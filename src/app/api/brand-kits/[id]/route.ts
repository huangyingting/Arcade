import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, safeLink, throttle } from '@/lib/api';
import { brandAccess, validateContent } from '@/lib/assets';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';

type Context = { params: Promise<{ id: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { asset, role } = await brandAccess((await params).id);
  return NextResponse.json({ brandKit: { ...asset, role } });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { asset, workspace, user } = await brandAccess((await params).id, true);
  const input = await body(request);
  const data: Record<string, unknown> = {};
  if ('name' in input) data.name = text(input.name, 'Brand name', 200);
  if ('sourceUrl' in input) data.sourceUrl = safeLink(text(input.sourceUrl, 'Website URL', 2000));
  const fields = { sources: 'array', logos: 'object', colors: 'array', fonts: 'object', photography: 'array', backgrounds: 'array', illustrations: 'array', product: 'object', voice: 'object', tones: 'array', demoSettings: 'object', sharePage: 'object', customElements: 'array' } as const;
  for (const [key, kind] of Object.entries(fields)) {
    if (key in input) data[`${key}Json`] = validateContent(input[key], workspace.id, kind);
  }
  if (Array.isArray(input.colors) && input.colors.some((color) => !color || typeof color !== 'object' || !('hex' in color) || typeof color.hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(color.hex))) throw new HttpError(400, 'Brand colors must use six-digit hexadecimal values.');
  if (input.resyncUrl || input.recrawl) {
    await throttle(`capture:${user.id}`, 12, 3600);
    const crawl = await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(input.resyncUrl ? text(input.resyncUrl, 'Website URL', 2000) : asset.sourceUrl));
    data.sourceUrl = crawl.url;
    data.sourcesJson = JSON.stringify([{ id: crypto.randomUUID(), url: crawl.url, status: 'Captured', lastSyncedAt: new Date().toISOString(), pagesIndexed: crawl.screenshots.length }]);
    data.colorsJson = JSON.stringify(crawl.colors);
    data.fontsJson = JSON.stringify(crawl.fonts);
    data.photographyJson = JSON.stringify(crawl.screenshots.map((s) => ({ id: crypto.randomUUID(), title: s.title, url: s.url })));
  }
  const brandKit = await prisma.$transaction(async (tx) => {
    if (input.isDefault === true) await tx.brandKit.updateMany({ where: { workspaceId: workspace.id }, data: { isDefault: false } });
    return tx.brandKit.update({ where: { id: asset.id }, data: { ...data, ...('isDefault' in input ? { isDefault: input.isDefault === true } : {}) } });
  });
  return NextResponse.json({ brandKit });
});
