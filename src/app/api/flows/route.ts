import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';

export async function GET() {
  const flows = await prisma.flow.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { brandKit: true },
  });
  return NextResponse.json({ flows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspace = await prisma.workspace.findFirst();
  const user = await prisma.user.findFirst();
  const brandKit = await prisma.brandKit.findFirst({ where: { isDefault: true } });

  if (!workspace || !user) {
    return NextResponse.json({ error: 'Workspace not initialized' }, { status: 400 });
  }

  const promptText = (body.prompt || '').trim();
  const urlMatch = (body.sourceUrl || promptText).match(/https?:\/\/[^\s]+/i);
  const targetUrl = body.sourceUrl || urlMatch?.[0] || null;

  let flowSteps = body.steps || null;
  let flowName = body.name || 'Untitled Interactive Demo';
  let flowDesc = body.description || 'Created in Arcade Interactive Demo Studio';
  let thumbUrl = '/media/scene1.png';
  let primaryHex = '#D4AF37';
  let watermarkHost = 'whoami.genisisiq.com';

  if (!flowSteps && targetUrl) {
    const crawl = await crawlAndCaptureWebsite(targetUrl);
    watermarkHost = crawl.hostname;
    primaryHex = crawl.colors[0]?.hex || '#D4AF37';
    thumbUrl = crawl.screenshots[0]?.url || '/media/scene1.png';
    if (!body.name || body.name.includes('whoami')) {
      flowName = `${crawl.hostname} Interactive Tour`;
    }
    flowDesc = crawl.description;

    flowSteps = [
      {
        id: `step_cover_${Date.now()}`,
        order: 0,
        type: 'CHAPTER',
        title: `Welcome to ${crawl.hostname}`,
        mediaUrl: thumbUrl,
        mediaWidth: 1440,
        mediaHeight: 900,
        hotspots: [],
        callouts: [],
        areas: [],
        panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
        voiceover: {
          enabled: true,
          script: `Welcome to the interactive walkthrough of ${crawl.title}.`,
          voiceId: 'ava-natural',
          speed: 1.0,
          audioUrl: '/media/voiceover-sample.wav',
          durationSec: 4,
        },
        chapter: {
          title: crawl.tagline || crawl.title,
          subtitle: crawl.description,
          alignment: 'center',
          backgroundStyle: 'blur_step',
          backgroundValue: '#111111',
          showLogo: true,
          interactionMode: 'buttons',
          buttons: [
            { id: 'b_start', label: 'Start Interactive Tour →', variant: 'primary', action: 'next_step' },
            { id: 'b_open', label: `Open ${crawl.hostname} ↗`, variant: 'secondary', action: 'external_url', targetUrl: crawl.url },
          ],
          formFields: [
            { id: 'f1', key: 'email', label: 'Work Email', placeholder: 'you@company.com', required: true },
          ],
          formSubmitLabel: 'Continue',
          allowSkipForm: true,
        },
      },
      ...crawl.screenshots.map((shot, idx) => ({
        id: `step_${Date.now()}_${idx + 1}`,
        order: idx + 1,
        type: 'IMAGE',
        title: shot.title,
        mediaUrl: shot.url,
        mediaWidth: 1440,
        mediaHeight: 900,
        hotspots: [
          {
            id: `hs_${Date.now()}_${idx + 1}`,
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
        panAndZoom: { enabled: idx === 0, x: 0.15, y: 0.15, width: 0.7, height: 0.7, scale: 1.3 },
        voiceover: {
          enabled: true,
          script: crawl.paragraphs[idx] || `Step ${idx + 1}: ${shot.title}.`,
          voiceId: 'ava-natural',
          speed: 1.0,
          audioUrl: '/media/voiceover-sample.wav',
          durationSec: 5,
        },
      })),
    ];
  }

  if (!flowSteps) {
    flowSteps = [
      {
        id: `step_cover_${Date.now()}`,
        order: 0,
        type: 'CHAPTER',
        title: 'Welcome Chapter',
        mediaUrl: '/media/scene1.png',
        mediaWidth: 1440,
        mediaHeight: 900,
        hotspots: [],
        callouts: [],
        areas: [],
        panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
        voiceover: {
          enabled: true,
          script: 'Welcome to this interactive product walkthrough.',
          voiceId: 'ava-natural',
          speed: 1.0,
          audioUrl: '/media/voiceover-sample.wav',
          durationSec: 4,
        },
        chapter: {
          title: flowName,
          subtitle: 'Click below to experience our interactive workflow step by step.',
          alignment: 'center',
          backgroundStyle: 'blur_step',
          backgroundValue: '#111111',
          showLogo: true,
          interactionMode: 'buttons',
          buttons: [
            { id: 'b1', label: 'Start Interactive Demo →', variant: 'primary', action: 'next_step' },
          ],
          formFields: [],
          formSubmitLabel: 'Continue',
          allowSkipForm: true,
        },
      },
      {
        id: `step_1_${Date.now()}`,
        order: 1,
        type: 'IMAGE',
        title: 'Explore Core Dashboard',
        mediaUrl: '/media/scene1.png',
        mediaWidth: 1440,
        mediaHeight: 900,
        hotspots: [
          {
            id: `hs_${Date.now()}`,
            x: 0.58,
            y: 0.42,
            style: 'beacon',
            color: '#D4AF37',
            tooltipText: 'Click here to inspect the interactive component',
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
          script: 'Click the highlighted beacon to proceed to the next step.',
          voiceId: 'ava-natural',
          speed: 1.0,
          audioUrl: '/media/voiceover-sample.wav',
          durationSec: 4,
        },
      },
    ];
  }

  const flow = await prisma.flow.create({
    data: {
      workspaceId: workspace.id,
      brandKitId: body.brandKitId || brandKit?.id || null,
      createdById: user.id,
      name: flowName,
      description: flowDesc,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      thumbnailUrl: thumbUrl,
      stepsJson: JSON.stringify(flowSteps),
      designJson: JSON.stringify({
        wrapperStyle: 'browser_dark',
        backgroundType: 'gradient',
        backgroundColor: '#111111',
        padding: 32,
        borderRadius: 16,
        shadow: 'xl',
        cursorStyle: 'pointer_ring',
        showProgressBar: true,
        showWatermark: true,
        watermarkText: watermarkHost,
        primaryColor: primaryHex,
      }),
      variablesJson: JSON.stringify([
        { key: 'first_name', label: 'Viewer First Name', fallbackValue: 'Builder' },
        { key: 'company_name', label: 'Target Company', fallbackValue: 'Enterprise Cloud' },
      ]),
    },
  });

  return NextResponse.json({ flow });
}
