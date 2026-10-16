import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderPromptVideoMp4 } from '@/lib/production-engine/media-renderer';

export async function POST(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json().catch(() => ({}));
  const resolution = (body.resolution || '1080p') as '720p' | '1080p' | '4K';
  const fps = Number(body.fps || 30);

  const video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const rendered = await renderPromptVideoMp4(video, resolution, fps);

  const exportsList = JSON.parse(video.exportsJson || '[]');
  const newExport = {
    id: `exp_${Date.now()}`,
    resolution,
    fps,
    status: 'READY',
    fileUrl: rendered.fileUrl,
    fileSize: rendered.fileSize,
    createdAt: new Date().toISOString(),
  };

  const nextExports = [newExport, ...exportsList];
  await prisma.promptVideo.update({
    where: { id: video.id },
    data: {
      exportsJson: JSON.stringify(nextExports),
    },
  });

  return NextResponse.json({
    ok: true,
    exportItem: newExport,
    exports: nextExports,
  });
}
