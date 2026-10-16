import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  const brandKits = await prisma.brandKit.findMany({
    where: workspace ? { workspaceId: workspace.id } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ brandKits });
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const rawUrl = (body.url || 'https://whoami.genisisiq.com').trim();

  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const crawl = await crawlAndCaptureWebsite(rawUrl);
  const primaryHex = crawl.colors[0]?.hex || '#D4AF37';
  const bgHex = crawl.colors[1]?.hex || '#111111';

  const brandKit = await prisma.brandKit.create({
    data: {
      workspaceId: workspace.id,
      name: crawl.hostname,
      sourceUrl: crawl.url,
      isDefault: false,
      status: 'READY',
      sourcesJson: JSON.stringify([
        {
          id: `src_${Date.now()}`,
          url: crawl.url,
          type: 'Website',
          status: crawl.crawledLive ? 'Live Crawled' : 'Synced',
          lastSyncedAt: new Date().toISOString(),
          pagesIndexed: crawl.screenshots.length,
        },
      ]),
      logosJson: JSON.stringify({
        lightLogoUrl: crawl.screenshots[0]?.url || '/media/scene1.png',
        darkLogoUrl: crawl.screenshots[0]?.url || '/media/scene1.png',
        iconText: crawl.hostname[0]?.toUpperCase() || 'A',
        brandMonogram: crawl.title.slice(0, 24).toUpperCase(),
      }),
      colorsJson: JSON.stringify(crawl.colors),
      fontsJson: JSON.stringify(crawl.fonts),
      photographyJson: JSON.stringify(
        crawl.screenshots.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
        }))
      ),
      backgroundsJson: JSON.stringify([
        {
          id: 'bg1',
          name: `${crawl.hostname} Primary Gradient`,
          style: `linear-gradient(135deg, ${bgHex} 0%, ${primaryHex} 100%)`,
          hex: bgHex,
        },
        {
          id: 'bg2',
          name: 'Bauhaus Obsidian Grid',
          style: 'linear-gradient(135deg, #111111 0%, #1F2937 100%)',
          hex: '#111111',
        },
        {
          id: 'bg3',
          name: 'Warm Ivory Studio',
          style: 'linear-gradient(135deg, #F4EFE6 0%, #E5DEC9 100%)',
          hex: '#F4EFE6',
        },
      ]),
      illustrationsJson: JSON.stringify([
        { id: 'il1', name: 'Bauhaus Geometric Vector', style: 'Vector' },
        { id: 'il2', name: 'Isometric Architecture', style: 'Blueprint' },
      ]),
      productJson: JSON.stringify({
        productName: crawl.title,
        tagline: crawl.tagline,
        description: crawl.description,
        icp: [
          {
            id: 'icp1',
            role: 'Engineering & Product Leadership',
            painPoint: `Evaluating ${crawl.hostname} capabilities through interactive product proof.`,
          },
          {
            id: 'icp2',
            role: 'Enterprise Buyers & Architects',
            painPoint: 'Wants verifiable production workflows without scheduling a sales call.',
          },
        ],
        keyMessaging: crawl.headings.slice(0, 3).map((h, i) => ({
          id: `km_${i + 1}`,
          title: h,
          body: crawl.paragraphs[i] || crawl.description,
        })),
      }),
      voiceJson: JSON.stringify({
        summary: `Clear, authoritative, and product-first voice extracted from ${crawl.hostname}.`,
        traits: ['Authoritative', 'Concise', 'Product-Led', 'High-Contrast'],
        dos: [
          `Highlight real workflows and headings from ${crawl.hostname}.`,
          'Use concise visual callouts instead of walls of text.',
        ],
        donts: ['Avoid generic filler copy without product screenshots.'],
      }),
      tonesJson: JSON.stringify([
        { id: 't1', name: 'Launch Video', description: 'Bold kinetic statements and fast product pacing.' },
        { id: 't2', name: 'Interactive Walkthrough', description: 'Actionable step-by-step hotspot guidance.' },
      ]),
      demoSettingsJson: JSON.stringify({
        hotspotColor: primaryHex,
        hotspotStyle: 'beacon',
        calloutTheme: 'dark',
        wrapperStyle: 'browser_dark',
        showProgressBar: true,
      }),
      sharePageJson: JSON.stringify({
        showBrandLogo: true,
        primaryCtaLabel: `Open ${crawl.hostname} ↗`,
        primaryCtaUrl: crawl.url,
        backgroundTheme: 'obsidian_gold',
      }),
      customElementsJson: JSON.stringify([
        { id: 'ce1', name: `${crawl.hostname} Lower Third`, type: 'Overlay', position: 'bottom-left' },
      ]),
    },
  });

  return NextResponse.json({ brandKit, crawledLive: crawl.crawledLive });
}
