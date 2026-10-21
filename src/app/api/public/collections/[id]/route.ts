import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, HttpError } from '@/lib/api';

export const GET = api<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const collection = await prisma.collection.findFirst({
    where: { shareId: (await params).id, status: 'PUBLISHED' },
    select: { id: true, shareId: true, name: true, headerJson: true, itemsJson: true, workspaceId: true },
  });
  if (!collection) throw new HttpError(404, 'This collection is unavailable or no longer published.');
  const items: { assetType: string; assetId: string }[] = JSON.parse(collection.itemsJson);
  const [flows, videos] = await Promise.all([
    prisma.flow.findMany({ where: { id: { in: items.filter((i) => i.assetType === 'FLOW').map((i) => i.assetId) }, workspaceId: collection.workspaceId, status: 'PUBLISHED', visibility: { in: ['PUBLIC', 'LINK_ONLY'] } }, select: { id: true, shareId: true, name: true, description: true, thumbnailUrl: true } }),
    prisma.promptVideo.findMany({ where: { id: { in: items.filter((i) => i.assetType === 'VIDEO').map((i) => i.assetId) }, workspaceId: collection.workspaceId, status: 'PUBLISHED' }, select: { id: true, shareId: true, name: true, durationSec: true, thumbnailUrl: true } }),
  ]);
  const { workspaceId, ...safeCollection } = collection;
  return NextResponse.json({ collection: safeCollection, flows, videos });
});
