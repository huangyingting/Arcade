import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';

const AVERY_HEADLINES = [
  '2,300+ AI use cases indexed. Verify SC‑100 ↗',
  'Doers, not talkers: 120+ Verified Cloud & AI Badges',
  'Production GenAI & Zero-Trust Cloud Architecture — Live',
  'Inspect 120+ Cryptographically Verified AI Credentials ↗',
];

const AVERY_BACKGROUNDS = [
  'linear-gradient(135deg, #111111 0%, #D4AF37 100%)',
  'linear-gradient(135deg, #0047AB 0%, #111111 60%, #C42B1C 100%)',
  'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 55%, #D4AF37 100%)',
  'linear-gradient(135deg, #0F172A 0%, #C42B1C 75%, #F4EFE6 100%)',
];

export async function GET(
  _request: Request,
  { params }: { params: { pid: string } }
) {
  let project = await prisma.visualProject.findUnique({
    where: { id: params.pid },
    include: { brandKit: true },
  });
  if (!project) {
    project = await prisma.visualProject.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: { brandKit: true },
    });
  }
  return NextResponse.json({ project });
}

export async function PATCH(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json();
  const project = await prisma.visualProject.findUnique({
    where: { id: params.pid },
  });
  if (!project) {
    return NextResponse.json({ error: 'Visual project not found' }, { status: 404 });
  }

  let visuals = JSON.parse(project.visualsJson || '[]');
  if (Array.isArray(body.visuals)) {
    visuals = body.visuals;
  }

  if (body.averyAction === 'headline' && body.visualId) {
    const targetVisual = visuals.find((v: Record<string, any>) => v.id === body.visualId);
    const fallbackHeadline = AVERY_HEADLINES[Math.floor(Math.random() * AVERY_HEADLINES.length)];
    const aiRewrite = await callAzureOpenAiJson<{ headline: string; subheadline?: string }>(
      'You are Avery, Arcade Visuals Copywriter. Write a high-converting, punchy product marketing headline (max 58 chars) and optional subheadline (max 95 chars) for this social visual card. Return JSON {"headline": "...", "subheadline": "..."}.',
      JSON.stringify({
        projectName: project.name,
        prompt: project.prompt,
        currentHeadline: targetVisual?.headline || '',
        currentSubheadline: targetVisual?.subheadline || '',
        presetLabel: targetVisual?.label || '',
      }),
      { headline: fallbackHeadline }
    );

    visuals = visuals.map((v: Record<string, any>) =>
      v.id === body.visualId
        ? {
            ...v,
            headline: aiRewrite.data.headline || fallbackHeadline,
            subheadline: aiRewrite.data.subheadline || v.subheadline,
          }
        : v
    );
  }

  if (body.averyAction === 'translate' && body.visualId && body.locale) {
    const targetVisual = visuals.find((v: Record<string, any>) => v.id === body.visualId) || visuals[0];
    const aiTrans = await callAzureOpenAiJson<{
      headline: string;
      subheadline: string;
      ctaLabel: string;
    }>(
      `Translate the marketing social card headline, subheadline, and CTA button label into natural, native ${body.locale}. Keep numbers (like 2,300+ or 120+) intact. Return JSON {"headline": "...", "subheadline": "...", "ctaLabel": "..."}.`,
      JSON.stringify({
        headline: targetVisual?.headline || '',
        subheadline: targetVisual?.subheadline || '',
        ctaLabel: targetVisual?.ctaLabel || 'Explore AI ↗',
      }),
      {
        headline: targetVisual?.headline || '',
        subheadline: targetVisual?.subheadline || '',
        ctaLabel: targetVisual?.ctaLabel || 'Explore AI ↗',
      }
    );

    visuals = visuals.map((v: Record<string, any>) =>
      v.id === body.visualId
        ? {
            ...v,
            headline: aiTrans.data.headline || v.headline,
            subheadline: aiTrans.data.subheadline || v.subheadline,
            ctaLabel: aiTrans.data.ctaLabel || v.ctaLabel,
          }
        : v
    );
  }

  if (body.averyAction === 'background' && body.visualId) {
    const pickBg = AVERY_BACKGROUNDS[Math.floor(Math.random() * AVERY_BACKGROUNDS.length)];
    visuals = visuals.map((v: Record<string, any>) =>
      v.id === body.visualId
        ? { ...v, backgroundType: 'image', backgroundImageUrl: pickBg }
        : v
    );
  }

  const data: Record<string, unknown> = {
    visualsJson: JSON.stringify(visuals),
  };
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.category === 'string') data.category = body.category;
  if (typeof body.prompt === 'string') data.prompt = body.prompt;

  const updated = await prisma.visualProject.update({
    where: { id: project.id },
    data,
    include: { brandKit: true },
  });

  return NextResponse.json({ project: updated, visuals });
}
