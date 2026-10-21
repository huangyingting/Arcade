import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, text, throttle, workspaceAccess } from '@/lib/api';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';

type Context = { params: Promise<{ slug: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { workspace } = await workspaceAccess((await params).slug);
  return NextResponse.json({ brandKits: await prisma.brandKit.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' } }) });
});
export const POST = api<Context>(async (request, { params }) => {
  const { workspace, user } = await workspaceAccess((await params).slug, true);
  await throttle(`capture:${user.id}`, 12, 3600);
  const input = await body(request);
  const crawl = await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(text(input.url, 'Website URL', 2000)));
  const brandKit = await prisma.brandKit.create({ data: {
    workspaceId: workspace.id, name: crawl.hostname, sourceUrl: crawl.url,
    sourcesJson: JSON.stringify([{ id: crypto.randomUUID(), url: crawl.url, type: 'Website', status: 'Captured', lastSyncedAt: new Date().toISOString(), pagesIndexed: crawl.screenshots.length }]),
    colorsJson: JSON.stringify(crawl.colors), fontsJson: JSON.stringify(crawl.fonts),
    photographyJson: JSON.stringify(crawl.screenshots.map(({ title, url }) => ({ id: crypto.randomUUID(), title, url }))),
    productJson: JSON.stringify({ productName: crawl.title, tagline: crawl.tagline, description: crawl.description, icp: [], keyMessaging: [] }),
  } });
  return NextResponse.json({ brandKit, crawledLive: true }, { status: 201 });
});
