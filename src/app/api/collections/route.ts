import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const collections = await prisma.collection.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ collections });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspace = await prisma.workspace.findFirst();
  const user = await prisma.user.findFirst();
  if (!workspace || !user) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: {
      workspaceId: workspace.id,
      createdById: user.id,
      name: body.name || 'New Product Showcase Collection',
      status: 'PUBLISHED',
      headerJson: JSON.stringify({
        title: body.name || 'whoami.genisisiq.com Showcase Collection',
        subtitle: 'Curated interactive demos and AI launch videos.',
        logoUrl: '/media/scene1.png',
        ctaLabel: 'Open Live Site ↗',
        ctaUrl: 'https://whoami.genisisiq.com',
        bgStyle: 'obsidian_gold',
      }),
      itemsJson: JSON.stringify([
        { id: 'ci_1', assetType: 'FLOW', assetId: '4fLyMFzH8BjqgKQF4Bd6', order: 0 },
        { id: 'ci_2', assetType: 'VIDEO', assetId: 'qGe4L499rr5AsLtm6F4q', order: 1 },
      ]),
    },
  });

  return NextResponse.json({ collection });
}
