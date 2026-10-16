import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';

export async function POST(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const body = await request.json().catch(() => ({}));
  const rawUrl = (body.url || 'https://whoami.genisisiq.com').trim();

  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const crawl = await crawlAndCaptureWebsite(rawUrl);
  const existingSteps = JSON.parse(flow.stepsJson || '[]');
  const primaryHex = crawl.colors[0]?.hex || '#D4AF37';

  const capturedSteps = crawl.screenshots.map((shot, idx) => ({
    id: `step_cap_${Date.now()}_${idx + 1}`,
    order: existingSteps.length + idx,
    type: 'IMAGE',
    title: shot.title,
    mediaUrl: shot.url,
    mediaWidth: 1440,
    mediaHeight: 900,
    hotspots: [
      {
        id: `hs_cap_${Date.now()}_${idx + 1}`,
        x: shot.hotspot?.x ?? 0.56,
        y: shot.hotspot?.y ?? 0.48,
        style: 'beacon',
        color: primaryHex,
        tooltipText: shot.hotspot?.tooltipText || `Explore ${shot.title}`,
        tooltipPosition: 'bottom',
        trigger: 'click',
        targetType: 'next_step',
      },
    ],
    callouts: [],
    areas: [],
    panAndZoom: { enabled: false, x: 0.15, y: 0.15, width: 0.7, height: 0.7, scale: 1.25 },
    voiceover: {
      enabled: true,
      script: crawl.paragraphs[idx] || `Inspect ${shot.title} on ${crawl.hostname}.`,
      voiceId: 'ava-natural',
      speed: 1.0,
      audioUrl: '/media/voiceover-sample.wav',
      durationSec: 5,
    },
  }));

  const nextSteps = body.replaceExisting ? capturedSteps : [...existingSteps, ...capturedSteps];
  const updated = await prisma.flow.update({
    where: { id: flow.id },
    data: {
      stepsJson: JSON.stringify(nextSteps),
      thumbnailUrl: capturedSteps[0]?.mediaUrl || flow.thumbnailUrl,
    },
  });

  return NextResponse.json({
    ok: true,
    flow: updated,
    steps: nextSteps,
    capturedCount: capturedSteps.length,
    crawledLive: crawl.crawledLive,
  });
}
