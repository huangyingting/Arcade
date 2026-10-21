import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, text, throttle, workspaceAccess, workspaceQuery } from '@/lib/api';
import { brandKitForWorkspace, brandAccent } from '@/lib/assets';
import { validateSteps } from '@/lib/validation';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import { capturedSteps, defaultDesign } from '@/lib/content';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  return NextResponse.json({ flows: await prisma.flow.findMany({ where: { workspaceId: workspace.id, status: { not: 'DELETED' } }, orderBy: { updatedAt: 'desc' }, include: { brandKit: true } }) });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const { workspace, user } = await workspaceAccess(text(input.workspaceSlug, 'Workspace', 100), true);
  await throttle(`create:${user.id}`, 30, 3600);
  const brandKit = await brandKitForWorkspace(input.brandKitId, workspace.id);
  const target = text(input.sourceUrl, 'Source URL', 2000, false);
  const crawl = target ? await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(target)) : null;
  const steps = input.steps === undefined ? capturedSteps(crawl?.screenshots || []) : input.steps;
  const flow = await prisma.flow.create({ data: {
    workspaceId: workspace.id, createdById: user.id, brandKitId: brandKit?.id,
    name: input.name ? text(input.name, 'Demo name', 200) : crawl ? `${crawl.hostname} walkthrough` : 'Untitled walkthrough',
    description: crawl?.description || '', thumbnailUrl: crawl?.screenshots[0]?.url || null,
    stepsJson: validateSteps(steps, workspace.id), designJson: JSON.stringify({ ...defaultDesign, primaryColor: brandAccent(brandKit) || defaultDesign.primaryColor }),
  } });
  return NextResponse.json({ flow }, { status: 201 });
});
