import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';

export async function GET() {
  const visualProjects = await prisma.visualProject.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { brandKit: true },
  });
  return NextResponse.json({ visualProjects });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const category = body.category || 'social_announcement';
  const prompt = (body.prompt || '2,300+ AI use cases indexed. Verify SC‑100 ↗').trim();
  const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);
  const targetUrl = body.sourceUrl || urlMatch?.[0] || null;

  const workspace = await prisma.workspace.findFirst();
  const user = await prisma.user.findFirst();
  const brandKit = await prisma.brandKit.findFirst({
    where: body.brandKitId ? { id: body.brandKitId } : { isDefault: true },
  });

  if (!workspace || !user) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
  }

  let shot1 = '/media/scene1.png';
  let shot2 = '/media/scene2.png';
  let headline1 = prompt.slice(0, 72) || '2,300+ AI use cases indexed. Verify SC‑100 ↗';
  let subheadline1 = 'Build AI-enabled cloud solutions backed by 120+ verified badges and 2,300+ indexed use cases.';
  let projectTitle = body.name || 'whoami.genisisiq.com Visuals';

  if (targetUrl) {
    const crawl = await crawlAndCaptureWebsite(targetUrl);
    shot1 = crawl.screenshots[0]?.url || shot1;
    shot2 = crawl.screenshots[1]?.url || shot1;
    headline1 = crawl.headings[0] || crawl.title;
    subheadline1 = crawl.description;
    if (!body.name) projectTitle = `${crawl.hostname} Social & Launch Visuals`;
  }

  const defaultVisuals = [
    {
      id: `vis_ig_${Date.now()}`,
      presetId: 'ig-post-sq',
      platform: 'Instagram',
      presetName: 'Instagram post square',
      width: 1080,
      height: 1080,
      templateId: 'capture',
      isAnimated: true,
      showLogo: true,
      backgroundType: 'image',
      backgroundImageUrl: 'linear-gradient(135deg, #111111 0%, #1E293B 60%, #D4AF37 100%)',
      backgroundColor: '#111111',
      headline: headline1,
      subheadline: subheadline1,
      headlineColor: '#F4EFE6',
      ctaLabel: 'Explore Live ↗',
      ctaBgColor: '#D4AF37',
      ctaTextColor: '#111111',
      showShadows: true,
      screenshotUrl: shot1,
    },
    {
      id: `vis_li_${Date.now() + 1}`,
      presetId: 'li-post-land',
      platform: 'LinkedIn',
      presetName: 'Linkedin post landscape',
      width: 1200,
      height: 626,
      templateId: 'spotlight',
      isAnimated: false,
      showLogo: true,
      backgroundType: 'image',
      backgroundImageUrl: 'linear-gradient(135deg, #0D0E12 0%, #0047AB 65%, #D4AF37 100%)',
      backgroundColor: '#0047AB',
      headline: headline1,
      subheadline: subheadline1,
      headlineColor: '#F4EFE6',
      ctaLabel: 'Verify Now ↗',
      ctaBgColor: '#C42B1C',
      ctaTextColor: '#FFFFFF',
      showShadows: true,
      screenshotUrl: shot2,
    },
  ];

  const project = await prisma.visualProject.create({
    data: {
      workspaceId: workspace.id,
      brandKitId: brandKit?.id || null,
      createdById: user.id,
      name: projectTitle,
      category,
      prompt,
      sourceFlowId: body.sourceFlowId || '4fLyMFzH8BjqgKQF4Bd6',
      status: 'PUBLISHED',
      thumbnailUrl: shot1,
      visualsJson: JSON.stringify(defaultVisuals),
      templatesJson: JSON.stringify([
        { id: 'capture', name: 'Capture', description: 'Best for announcements', category: 'social_announcement' },
        { id: 'spotlight', name: 'Spotlight', description: 'High-contrast product focus', category: 'product_benefits' },
        { id: 'split', name: 'Split', description: 'Side-by-side metric & screenshot', category: 'feature_highlight' },
        { id: 'minimal', name: 'Minimal', description: 'Clean Bauhaus frame', category: 'website_hero' },
        { id: 'bento', name: 'Bento', description: 'Multi-card architectural grid', category: 'product_benefits' },
      ]),
    },
  });

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { usedCreditsThisCycle: workspace.usedCreditsThisCycle + 50 },
  });

  return NextResponse.json({ project });
}
