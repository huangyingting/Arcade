import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, text, workspaceAccess, workspaceQuery } from '@/lib/api';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  return NextResponse.json({ collections: await prisma.collection.findMany({ where: { workspaceId: workspace.id, status: { not: 'DELETED' } }, orderBy: { updatedAt: 'desc' } }) });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const { workspace, user } = await workspaceAccess(text(input.workspaceSlug, 'Workspace', 100), true);
  const collection = await prisma.collection.create({ data: {
    workspaceId: workspace.id, createdById: user.id, name: text(input.name, 'Collection name', 200),
    headerJson: JSON.stringify({ title: text(input.name, 'Collection name', 200), subtitle: '', ctaLabel: '', ctaUrl: '' }),
  } });
  return NextResponse.json({ collection }, { status: 201 });
});
