import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderFlowVideoOrGif } from '@/lib/production-engine/media-renderer';

export async function POST(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const body = await request.json().catch(() => ({}));
  const format = (body.format || 'mp4') as 'mp4' | 'gif';
  const resolution = body.resolution || '1080p';

  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const rendered = await renderFlowVideoOrGif(flow, format);

  return NextResponse.json({
    ok: true,
    status: 'READY',
    format,
    resolution,
    downloadUrl: rendered.downloadUrl,
    fileSize: rendered.fileSize,
  });
}
