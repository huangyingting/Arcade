import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, integer, jsonField, text, workspaceAccess } from '@/lib/api';
import { assetStatus } from '@/lib/assets';

type Context = { params: Promise<{ slug: string }> };
const safeMemberUser = { id: true, name: true, email: true, image: true } as const;

export const GET = api<Context>(async (_request, { params }) => {
  const { slug } = await params;
  const { workspace, role, user } = await workspaceAccess(slug);
  const admin = ['OWNER', 'ADMIN'].includes(role);
  const data = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: {
      members: { include: { user: { select: safeMemberUser } } },
      teams: { include: { members: { include: { user: { select: safeMemberUser } } }, folders: true } },
      folders: true, brandKits: { orderBy: { createdAt: 'desc' } },
      flows: { orderBy: { updatedAt: 'desc' } }, promptVideos: { orderBy: { updatedAt: 'desc' } },
      visualProjects: { orderBy: { updatedAt: 'desc' } }, collections: { orderBy: { updatedAt: 'desc' } },
      leads: admin ? { orderBy: { createdAt: 'desc' }, take: 200 } : false,
      analyticsEvents: { orderBy: { createdAt: 'desc' }, take: 200 },
      creditTransactions: admin ? { orderBy: { createdAt: 'desc' }, take: 100 } : false,
      memories: { orderBy: { createdAt: 'desc' } },
      connectors: { select: { id: true, name: true, provider: true, status: true, lastSyncAt: true } },
      integrations: { select: { id: true, provider: true, status: true } },
      customLinks: true,
      notifications: { where: { OR: [{ userId: null }, { userId: user.id }] }, orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });
  return NextResponse.json({ workspace: { ...data, role }, user });
});

export const PATCH = api<Context>(async (request, { params }) => {
  const { slug } = await params;
  const input = await body(request);
  const adminKeys = ['name', 'slug', 'privacySettings', 'translationSettings', 'pronunciationRules', 'syntheticVoices', 'advancedSettings'];
  const needsAdmin = adminKeys.some((key) => key in input);
  const { workspace, user } = await workspaceAccess(slug, true, needsAdmin);
  const data: { name?: string; slug?: string; privacySettingsJson?: string; translationSettingsJson?: string; pronunciationRulesJson?: string } = {};
  if ('name' in input) data.name = text(input.name, 'Workspace name', 100);
  if ('slug' in input) {
    const next = text(input.slug, 'Workspace URL', 64);
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(next) || ['create', 'admin'].includes(next)) throw new HttpError(400, 'Invalid workspace URL.');
    data.slug = next;
  }
  if ('privacySettings' in input) {
    jsonField(input.privacySettings, 'object');
    const settings = input.privacySettings as Record<string, unknown>;
    if (settings.retentionDays !== undefined) integer(settings.retentionDays, 'Retention days', 1, 730);
    if (settings.collectViewerAnalytics !== undefined && typeof settings.collectViewerAnalytics !== 'boolean') throw new HttpError(400, 'Analytics collection must be enabled or disabled.');
    data.privacySettingsJson = JSON.stringify({ ...JSON.parse(workspace.privacySettingsJson), ...settings });
  }
  if ('translationSettings' in input) data.translationSettingsJson = jsonField(input.translationSettings, 'object');
  if ('pronunciationRules' in input) data.pronunciationRulesJson = jsonField(input.pronunciationRules, 'array', 100);
  if ('advancedSettings' in input || 'syntheticVoices' in input || 'toggleConnectorId' in input || 'toggleIntegrationId' in input || 'newCustomLink' in input) {
    throw new HttpError(501, 'This integration is not configured. Contact your deployment administrator.');
  }
  await prisma.$transaction(async (tx) => {
    if (input.newMemory) {
      const memory = input.newMemory as Record<string, unknown>;
      await tx.workspaceMemory.create({ data: {
        workspaceId: workspace.id, category: text(memory.category, 'Category', 80),
        title: text(memory.title, 'Title', 200), content: text(memory.content, 'Content', 10000), source: 'Manual entry',
      } });
    }
    if (input.deleteMemoryId) await tx.workspaceMemory.deleteMany({ where: { id: text(input.deleteMemoryId, 'Memory', 100), workspaceId: workspace.id } });
    if (input.markNotificationReadId || input.markAllNotificationsRead) await tx.inboxNotification.updateMany({
      where: { workspaceId: workspace.id, OR: [{ userId: null }, { userId: user.id }], ...(input.markNotificationReadId ? { id: text(input.markNotificationReadId, 'Notification', 100) } : {}) },
      data: { isRead: true },
    });
    if (input.createTeamName) {
      const name = text(input.createTeamName, 'Team name', 80);
      const teamSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!teamSlug) throw new HttpError(400, 'Team name needs at least one letter or number.');
      await tx.team.create({ data: { workspaceId: workspace.id, name, slug: teamSlug, members: { create: { userId: user.id } } } });
    }
    if (input.assetStatusChange) {
      const change = input.assetStatusChange as Record<string, unknown>;
      const id = text(change.assetId, 'Asset ID', 100);
      const status = assetStatus(change.status);
      if (status === 'PUBLISHED') throw new HttpError(400, 'Publish from the asset editor after reviewing its content.');
      const where = { id, workspaceId: workspace.id };
      const result = change.assetType === 'FLOW' ? await tx.flow.updateMany({ where, data: { status } })
        : change.assetType === 'VIDEO' ? await tx.promptVideo.updateMany({ where, data: { status } })
        : change.assetType === 'VISUAL' ? await tx.visualProject.updateMany({ where, data: { status } })
        : change.assetType === 'COLLECTION' ? await tx.collection.updateMany({ where, data: { status } }) : null;
      if (!result?.count) throw new HttpError(404, 'Asset not found.');
    }
    if (Object.keys(data).length) await tx.workspace.update({ where: { id: workspace.id }, data });
  });
  return GET(new Request(request.url), { params: Promise.resolve({ slug: data.slug || slug }) });
});
