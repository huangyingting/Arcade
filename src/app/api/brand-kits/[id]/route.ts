import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  let brandKit = await prisma.brandKit.findUnique({
    where: { id: params.id },
  });
  if (!brandKit) {
    brandKit = await prisma.brandKit.findFirst({
      orderBy: { isDefault: 'desc' },
    });
  }
  return NextResponse.json({ brandKit });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const existing = await prisma.brandKit.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Brand Kit not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.sourceUrl === 'string') data.sourceUrl = body.sourceUrl;
  if (typeof body.isDefault === 'boolean') data.isDefault = body.isDefault;
  if (body.sources) data.sourcesJson = JSON.stringify(body.sources);
  if (body.logos) data.logosJson = JSON.stringify(body.logos);
  if (body.colors) data.colorsJson = JSON.stringify(body.colors);
  if (body.fonts) data.fontsJson = JSON.stringify(body.fonts);
  if (body.photography) data.photographyJson = JSON.stringify(body.photography);
  if (body.backgrounds) data.backgroundsJson = JSON.stringify(body.backgrounds);
  if (body.illustrations) data.illustrationsJson = JSON.stringify(body.illustrations);
  if (body.product) data.productJson = JSON.stringify(body.product);
  if (body.voice) data.voiceJson = JSON.stringify(body.voice);
  if (body.tones) data.tonesJson = JSON.stringify(body.tones);
  if (body.demoSettings) data.demoSettingsJson = JSON.stringify(body.demoSettings);
  if (body.sharePage) data.sharePageJson = JSON.stringify(body.sharePage);
  if (body.customElements) data.customElementsJson = JSON.stringify(body.customElements);

  if (body.resyncUrl || body.recrawl) {
    const targetUrl =
      typeof body.resyncUrl === 'string' && body.resyncUrl.trim()
        ? body.resyncUrl.trim()
        : existing.sourceUrl;
    const crawl = await crawlAndCaptureWebsite(targetUrl);
    const sources = JSON.parse(existing.sourcesJson || '[]');
    const existingPhotos = JSON.parse(existing.photographyJson || '[]');
    sources.unshift({
      id: `src_${Date.now()}`,
      url: crawl.url,
      type: 'Website',
      status: crawl.crawledLive ? 'Live Crawled' : 'Synced',
      lastSyncedAt: new Date().toISOString(),
      pagesIndexed: crawl.screenshots.length,
    });
    data.sourcesJson = JSON.stringify(sources);
    if (crawl.crawledLive && crawl.screenshots.length > 0) {
      data.photographyJson = JSON.stringify([
        ...crawl.screenshots.map((s) => ({ id: s.id, title: s.title, url: s.url })),
        ...existingPhotos,
      ]);
    }
  }

  const updated = await prisma.brandKit.update({
    where: { id: existing.id },
    data,
  });

  return NextResponse.json({ brandKit: updated });
}
