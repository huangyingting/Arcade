import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text } from '@/lib/api';
import { assetStatus, collectionAccess, validateCollectionItems, validateContent } from '@/lib/assets';

type Context = { params: Promise<{ pid: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { asset, workspace, role } = await collectionAccess((await params).pid);
  const [flows, videos] = await Promise.all([
    prisma.flow.findMany({ where: { workspaceId: workspace.id, status: 'PUBLISHED', visibility: { not: 'PRIVATE' } } }),
    prisma.promptVideo.findMany({ where: { workspaceId: workspace.id, status: 'PUBLISHED' } }),
  ]);
  return NextResponse.json({ collection: { ...asset, workspace: { slug: workspace.slug }, role }, flows, videos });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { asset, workspace } = await collectionAccess((await params).pid, true);
  const input = await body(request);
  const data: Record<string, unknown> = {};
  if ('name' in input) data.name = text(input.name, 'Collection name', 200);
  if ('header' in input) data.headerJson = validateContent(input.header, workspace.id);
  if ('items' in input) data.itemsJson = await validateCollectionItems(input.items, workspace.id);
  if ('status' in input) {
    data.status = assetStatus(input.status);
    if (data.status === 'PUBLISHED') {
      const items = input.items ?? JSON.parse(asset.itemsJson);
      if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Add at least one published asset before publishing this collection.');
      await validateCollectionItems(items, workspace.id);
    }
  }
  return NextResponse.json({ collection: await prisma.collection.update({ where: { id: asset.id }, data }) });
});
