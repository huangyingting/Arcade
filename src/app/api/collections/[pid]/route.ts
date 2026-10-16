import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: { pid: string } }
) {
  let collection = await prisma.collection.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!collection) {
    collection = await prisma.collection.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  const flows = await prisma.flow.findMany();
  const videos = await prisma.promptVideo.findMany();

  return NextResponse.json({ collection, flows, videos });
}

export async function PATCH(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json();
  const collection = await prisma.collection.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (body.header) data.headerJson = JSON.stringify(body.header);
  if (body.items) data.itemsJson = JSON.stringify(body.items);

  const updated = await prisma.collection.update({
    where: { id: collection.id },
    data,
  });

  return NextResponse.json({ collection: updated });
}
