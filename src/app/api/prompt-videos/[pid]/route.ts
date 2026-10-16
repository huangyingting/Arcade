import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  let video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
    include: {
      sessions: { orderBy: { versionNumber: 'desc' } },
      brandKit: true,
      workspace: true,
    },
  });

  if (!video) {
    video = await prisma.promptVideo.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: {
        sessions: { orderBy: { versionNumber: 'desc' } },
        brandKit: true,
        workspace: true,
      },
    });
  }

  return NextResponse.json({ video });
}

export async function PATCH(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const body = await request.json();
  const video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.aspectRatio === 'string') data.aspectRatio = body.aspectRatio;
  if (typeof body.durationSec === 'number') data.durationSec = body.durationSec;
  if (typeof body.currentVersion === 'number') data.currentVersion = body.currentVersion;
  if (body.scenes) data.scenesJson = JSON.stringify(body.scenes);
  if (body.designSchema) data.designSchemaJson = JSON.stringify(body.designSchema);
  if (body.designValues) data.designValuesJson = JSON.stringify(body.designValues);
  if (body.timeline) data.timelineJson = JSON.stringify(body.timeline);
  if (body.pronunciation) data.pronunciationJson = JSON.stringify(body.pronunciation);
  if (body.exports) data.exportsJson = JSON.stringify(body.exports);

  const updated = await prisma.promptVideo.update({
    where: { id: video.id },
    data,
    include: {
      sessions: { orderBy: { versionNumber: 'desc' } },
      brandKit: true,
    },
  });

  return NextResponse.json({ video: updated });
}

export async function DELETE(
  _request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (video) {
    await prisma.promptVideo.update({
      where: { id: video.id },
      data: { status: 'DELETED' },
    });
  }
  return NextResponse.json({ ok: true });
}
