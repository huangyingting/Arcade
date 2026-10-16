import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const events = await prisma.analyticsEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const flows = await prisma.flow.findMany();
  const videos = await prisma.promptVideo.findMany();
  const leads = await prisma.leadCapture.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ events, flows, videos, leads });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ev = await prisma.analyticsEvent.create({
    data: {
      workspaceId: workspace.id,
      assetType: body.assetType || 'FLOW',
      assetId: body.assetId || '4fLyMFzH8BjqgKQF4Bd6',
      assetTitle: body.assetTitle || 'whoami.genisisiq.com Interactive Tour',
      visitorId: body.visitorId || `vis_${Date.now()}`,
      visitorEmail: body.visitorEmail || null,
      companyName: body.companyName || 'Enterprise Cloud Visitor',
      companyDomain: body.companyDomain || 'enterprise.io',
      country: body.country || 'United States',
      deviceType: body.deviceType || 'Desktop',
      eventType: body.eventType || 'VIEW',
      stepIndex: typeof body.stepIndex === 'number' ? body.stepIndex : 0,
      durationMs: Number(body.durationMs || 5000),
    },
  });

  if (body.assetType === 'FLOW' && body.eventType === 'VIEW') {
    await prisma.flow.updateMany({
      where: { OR: [{ id: body.assetId }, { shareId: body.assetId }] },
      data: { viewsCount: { increment: 1 } },
    });
  }

  return NextResponse.json({ ok: true, event: ev });
}
