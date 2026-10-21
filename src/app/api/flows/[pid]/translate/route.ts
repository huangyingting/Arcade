import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { flowAccess } from '@/lib/assets';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import { TRANSLATION_LOCALES, type FlowStep } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, user } = await flowAccess((await params).pid, true);
  await throttle(`ai:${user.id}`, 30, 3600);
  const input = await body(request);
  const locale = text(input.locale, 'Language', 30);
  if (!['en', ...TRANSLATION_LOCALES.map((l) => l.code)].includes(locale)) throw new HttpError(400, 'Unsupported language.');
  const steps: FlowStep[] = JSON.parse(asset.stepsJson);
  const result = await callAzureOpenAiJson<{ name: string; steps: { title: string; tooltips: string[]; callouts: { title: string; body: string }[]; chapter?: { title: string; subtitle: string }; voiceoverText: string }[] }>(
    `Translate into ${locale}. Preserve IDs, links, and factual claims. Return JSON {"name":"...","steps":[{"title":"...","tooltips":["..."],"callouts":[{"title":"...","body":"..."}],"chapter":{"title":"...","subtitle":"..."},"voiceoverText":"..."}]}. Keep exactly the same number and order of steps, tooltips and callouts.`,
    JSON.stringify({ name: asset.name, steps: steps.map((s) => ({ title: s.title, tooltips: s.hotspots.map((h) => h.tooltipText), callouts: s.callouts.map(({ title, body }) => ({ title, body })), chapter: s.chapter ? { title: s.chapter.title, subtitle: s.chapter.subtitle } : undefined, voiceoverText: s.voiceover.script })) }),
    { name: '', steps: [] },
  );
  if (result.data.steps?.length !== steps.length) throw new HttpError(502, 'The translation did not include every step.');
  for (const [index, translated] of result.data.steps.entries()) {
    text(translated.title, 'Translated step title', 300);
    text(translated.voiceoverText, 'Translated narration', 10000, false);
    if (!Array.isArray(translated.tooltips) || translated.tooltips.length !== steps[index].hotspots.length || !Array.isArray(translated.callouts) || translated.callouts.length !== steps[index].callouts.length) throw new HttpError(502, 'The translation did not preserve every annotation.');
    for (const tooltip of translated.tooltips) text(tooltip, 'Translated tooltip', 1000, false);
    for (const callout of translated.callouts) { text(callout.title, 'Translated callout title', 300, false); text(callout.body, 'Translated callout copy', 2000, false); }
    if (steps[index].chapter) { text(translated.chapter?.title, 'Translated chapter title', 300); text(translated.chapter?.subtitle, 'Translated chapter copy', 2000, false); }
  }
  const translations = JSON.parse(asset.translationsJson);
  translations[locale] = { name: text(result.data.name, 'Translated title', 300), steps: result.data.steps, updatedAt: new Date().toISOString(), provider: result.provider };
  const flow = await prisma.flow.update({ where: { id: asset.id }, data: { translationsJson: JSON.stringify(translations) } });
  return NextResponse.json({ flow, translations });
});
