import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, text, throttle, workspaceAccess, workspaceQuery } from '@/lib/api';
import { brandKitForWorkspace, brandAccent } from '@/lib/assets';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import { blankVisual } from '@/lib/content';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  return NextResponse.json({ visualProjects: await prisma.visualProject.findMany({ where: { workspaceId: workspace.id, status: { not: 'DELETED' } }, orderBy: { updatedAt: 'desc' } }) });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const { workspace, user } = await workspaceAccess(text(input.workspaceSlug, 'Workspace', 100), true);
  await throttle(`create:${user.id}`, 30, 3600);
  const brandKit = await brandKitForWorkspace(input.brandKitId, workspace.id);
  const prompt = text(input.prompt, 'Visual headline', 5000);
  const target = text(input.sourceUrl, 'Source URL', 2000, false);
  const crawl = target ? await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(target)) : null;
  const visual = blankVisual(prompt.slice(0, 200), crawl?.screenshots[0]?.url);
  if (brandAccent(brandKit)) visual.ctaBgColor = brandAccent(brandKit)!;
  if (crawl) visual.subheadline = crawl.description.slice(0, 300);
  const project = await prisma.visualProject.create({ data: {
    workspaceId: workspace.id, createdById: user.id, brandKitId: brandKit?.id, prompt,
    name: input.name ? text(input.name, 'Project name', 200) : crawl ? `${crawl.hostname} visuals` : prompt.slice(0, 60),
    category: text(input.category ?? 'social_announcement', 'Category', 80),
    thumbnailUrl: visual.screenshotUrl || null, visualsJson: JSON.stringify([visual]),
  } });
  return NextResponse.json({ project }, { status: 201 });
});
