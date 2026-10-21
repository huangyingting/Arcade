import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, text, throttle } from '@/lib/api';
import { flowAccess } from '@/lib/assets';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import { capturedSteps } from '@/lib/content';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await flowAccess((await params).pid, true);
  await throttle(`capture:${user.id}`, 12, 3600);
  const input = await body(request);
  const crawl = await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(text(input.url, 'Source URL', 2000)));
  const existing = input.replaceExisting === true ? [] : JSON.parse(asset.stepsJson);
  const steps = [...existing, ...capturedSteps(crawl.screenshots, existing.length)];
  const flow = await prisma.flow.update({ where: { id: asset.id }, data: {
    stepsJson: JSON.stringify(steps), thumbnailUrl: steps[0]?.mediaUrl || null,
  } });
  return NextResponse.json({ flow, steps, capturedCount: crawl.screenshots.length, crawledLive: true });
});
