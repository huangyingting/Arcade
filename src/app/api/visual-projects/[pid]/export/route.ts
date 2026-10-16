import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderVisualCardExport } from '@/lib/production-engine/media-renderer';

export async function POST(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json().catch(() => ({}));
  const format = (body.format || 'png') as 'png' | 'mp4';
  const visual = body.visual;

  if (!visual) {
    const project = await prisma.visualProject.findFirst({
      where: { id: params.pid },
    });
    if (!project) {
      return NextResponse.json({ error: 'Visual project not found' }, { status: 404 });
    }
    const visuals = JSON.parse(project.visualsJson || '[]');
    const rendered = await renderVisualCardExport(visuals[0] || {}, format);
    return NextResponse.json({ ok: true, ...rendered });
  }

  const rendered = await renderVisualCardExport(visual, format);
  return NextResponse.json({ ok: true, ...rendered });
}
