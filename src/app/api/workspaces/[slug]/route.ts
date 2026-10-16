import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const WORKSPACE_INCLUDE = {
  members: { include: { user: true } },
  teams: { include: { members: { include: { user: true } }, folders: true } },
  folders: true,
  brandKits: { orderBy: { createdAt: 'desc' as const } },
  flows: { orderBy: { updatedAt: 'desc' as const } },
  promptVideos: { orderBy: { updatedAt: 'desc' as const }, include: { sessions: true } },
  visualProjects: { orderBy: { updatedAt: 'desc' as const } },
  collections: { orderBy: { updatedAt: 'desc' as const } },
  leads: { orderBy: { createdAt: 'desc' as const } },
  analyticsEvents: { orderBy: { createdAt: 'desc' as const }, take: 100 },
  creditTransactions: { orderBy: { createdAt: 'desc' as const } },
  memories: { orderBy: { createdAt: 'desc' as const } },
  connectors: true,
  integrations: true,
  customLinks: true,
  notifications: { orderBy: { createdAt: 'desc' as const } },
};

export async function GET(
  _request: Request,
  { params: rawParams }: { params: Promise<{ slug: string }> }
) {
  const params = await rawParams;
  let workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    include: WORKSPACE_INCLUDE,
  });

  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      include: WORKSPACE_INCLUDE,
    });
  }

  return NextResponse.json({ workspace });
}

export async function PATCH(
  request: Request,
  { params: rawParams }: { params: Promise<{ slug: string }> }
) {
  const params = await rawParams;
  const body = await request.json();
  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.name === 'string') updateData.name = body.name;
  if (typeof body.slug === 'string') updateData.slug = body.slug;
  if (body.privacySettings) updateData.privacySettingsJson = JSON.stringify(body.privacySettings);
  if (body.translationSettings) updateData.translationSettingsJson = JSON.stringify(body.translationSettings);
  if (body.pronunciationRules) updateData.pronunciationRulesJson = JSON.stringify(body.pronunciationRules);
  if (body.syntheticVoices) updateData.syntheticVoicesJson = JSON.stringify(body.syntheticVoices);
  if (body.advancedSettings) updateData.advancedSettingsJson = JSON.stringify(body.advancedSettings);
  if (body.onboardingChecklist) updateData.onboardingChecklistJson = JSON.stringify(body.onboardingChecklist);

  if (body.newMemory) {
    await prisma.workspaceMemory.create({
      data: {
        workspaceId: workspace.id,
        category: body.newMemory.category || 'Product Fact',
        title: body.newMemory.title,
        content: body.newMemory.content,
        source: body.newMemory.source || 'Manual Entry',
      },
    });
  }

  if (body.deleteMemoryId) {
    await prisma.workspaceMemory.deleteMany({
      where: { id: body.deleteMemoryId, workspaceId: workspace.id },
    });
  }

  if (body.toggleConnectorId) {
    const conn = await prisma.workspaceConnector.findUnique({ where: { id: body.toggleConnectorId } });
    if (conn) {
      await prisma.workspaceConnector.update({
        where: { id: conn.id },
        data: {
          status: conn.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
          lastSyncAt: new Date(),
        },
      });
    }
  }

  if (body.toggleIntegrationId) {
    const integ = await prisma.workspaceIntegration.findUnique({ where: { id: body.toggleIntegrationId } });
    if (integ) {
      await prisma.workspaceIntegration.update({
        where: { id: integ.id },
        data: {
          status: integ.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED',
        },
      });
    }
  }

  if (body.markNotificationReadId) {
    await prisma.inboxNotification.updateMany({
      where: { id: body.markNotificationReadId, workspaceId: workspace.id },
      data: { isRead: true },
    });
  }

  if (body.markAllNotificationsRead) {
    await prisma.inboxNotification.updateMany({
      where: { workspaceId: workspace.id },
      data: { isRead: true },
    });
  }

  if (body.assetStatusChange) {
    const { assetType, assetId, status } = body.assetStatusChange;
    if (assetType === 'FLOW') {
      await prisma.flow.updateMany({ where: { id: assetId }, data: { status } });
    } else if (assetType === 'VIDEO') {
      await prisma.promptVideo.updateMany({ where: { id: assetId }, data: { status } });
    } else if (assetType === 'VISUAL') {
      await prisma.visualProject.updateMany({ where: { id: assetId }, data: { status } });
    }
  }

  if (body.createTeamName) {
    const teamSlug = body.createTeamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.team.upsert({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: teamSlug } },
      update: { name: body.createTeamName },
      create: {
        workspaceId: workspace.id,
        name: body.createTeamName,
        slug: teamSlug,
        iconColor: '#2563EB',
        isPersonal: false,
      },
    });
  }

  if (body.newCustomLink) {
    await prisma.customLink.create({
      data: {
        workspaceId: workspace.id,
        assetType: body.newCustomLink.assetType || 'FLOW',
        assetId: body.newCustomLink.assetId || '4fLyMFzH8BjqgKQF4Bd6',
        slug: body.newCustomLink.slug || `link-${Date.now()}`,
        recipient: body.newCustomLink.recipient || 'Enterprise Prospect',
      },
    });
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: updateData,
    });
  }

  const refreshed = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    include: WORKSPACE_INCLUDE,
  });

  return NextResponse.json({ workspace: refreshed });
}
