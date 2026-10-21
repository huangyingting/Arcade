import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { validateContent, visualAccess } from '@/lib/assets';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import type { VisualCanvasItem } from '@/types/domain';
import { validateVisuals } from '@/lib/validation';

type Context = { params: Promise<{ pid: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { asset, workspace, role } = await visualAccess((await params).pid);
  return NextResponse.json({ project: { ...asset, workspace: { slug: workspace.slug }, role } });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { asset, workspace, user } = await visualAccess((await params).pid, true);
  const input = await body(request);
  const data: Record<string, unknown> = {};
  if ('name' in input) data.name = text(input.name, 'Project name', 200);
  if ('visuals' in input) data.visualsJson = validateVisuals(input.visuals, workspace.id);
  if (typeof data.visualsJson === 'string') {
    const visuals: VisualCanvasItem[] = JSON.parse(data.visualsJson);
    data.thumbnailUrl = visuals.find((visual) => visual.screenshotUrl)?.screenshotUrl || null;
  }
  if (input.averyAction) {
    await throttle(`ai:${user.id}`, 30, 3600);
    const visuals: VisualCanvasItem[] = JSON.parse(asset.visualsJson);
    const visual = visuals.find((item) => item.id === input.visualId);
    if (!visual) throw new HttpError(404, 'Visual not found.');
    if (!['headline', 'translate'].includes(String(input.averyAction))) throw new HttpError(400, 'Choose copy refinement or translation.');
    const instruction = input.averyAction === 'translate'
      ? `Translate into ${text(input.locale, 'Language', 30)}. Preserve numbers and claims exactly.`
      : 'Refine this marketing copy. Do not invent claims, numbers or testimonials.';
    const result = await callAzureOpenAiJson<{ headline: string; subheadline: string; ctaLabel: string }>(
      `${instruction} Return JSON {"headline":"...","subheadline":"...","ctaLabel":"..."}.`,
      JSON.stringify({ headline: visual.headline, subheadline: visual.subheadline, ctaLabel: visual.ctaLabel }),
      { headline: '', subheadline: '', ctaLabel: '' },
    );
    visual.headline = text(result.data.headline, 'Headline', 300);
    visual.subheadline = text(result.data.subheadline, 'Supporting copy', 1000, false);
    visual.ctaLabel = text(result.data.ctaLabel, 'CTA label', 100, false);
    data.visualsJson = JSON.stringify(visuals);
  }
  return NextResponse.json({ project: await prisma.visualProject.update({ where: { id: asset.id }, data }) });
});
export const DELETE = api<Context>(async (_request, { params }) => {
  const { asset } = await visualAccess((await params).pid, true);
  await prisma.visualProject.update({ where: { id: asset.id }, data: { status: 'DELETED' } });
  return NextResponse.json({ ok: true });
});
