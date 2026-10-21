import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, workspaceAccess, workspaceQuery } from '@/lib/api';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  const query = (new URL(request.url).searchParams.get('q') || '').slice(0, 100).trim();
  const where = { workspaceId: workspace.id, status: { not: 'DELETED' }, ...(query ? { name: { contains: query } } : {}) };
  const [flows, videos, visuals, collections, kits] = await Promise.all([
    prisma.flow.findMany({ where, take: 20, orderBy: { updatedAt: 'desc' } }),
    prisma.promptVideo.findMany({ where, take: 20, orderBy: { updatedAt: 'desc' } }),
    prisma.visualProject.findMany({ where, take: 20, orderBy: { updatedAt: 'desc' } }),
    prisma.collection.findMany({ where, take: 20, orderBy: { updatedAt: 'desc' } }),
    prisma.brandKit.findMany({ where: { workspaceId: workspace.id, ...(query ? { name: { contains: query } } : {}) }, take: 20 }),
  ]);
  return NextResponse.json({ results: [
    ...flows.map((f) => ({ id: f.id, type: 'Demo', title: f.name, url: `/flows/${f.id}/edit` })),
    ...videos.map((v) => ({ id: v.id, type: 'Video', title: v.name, url: `/prompt-videos/custom/${v.id}/edit` })),
    ...visuals.map((v) => ({ id: v.id, type: 'Visuals', title: v.name, url: `/visual-projects/${v.id}/edit` })),
    ...collections.map((c) => ({ id: c.id, type: 'Collection', title: c.name, url: `/collections/${c.id}/edit` })),
    ...kits.map((k) => ({ id: k.id, type: 'Brand kit', title: k.name, url: `/workspaces/${workspace.slug}/settings/brand-kits/${k.id}` })),
  ] });
});
