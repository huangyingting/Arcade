import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAzureOpenAiJson, synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';

const LOCALE_LABELS: Record<string, { label: string; prefix: string }> = {
  en: { label: 'English (US)', prefix: '[EN]' },
  'zh-CN': { label: 'Chinese Simplified (简体中文)', prefix: '[ZH]' },
  'zh-TW': { label: 'Chinese Traditional (繁體中文)', prefix: '[ZH-TW]' },
  ja: { label: 'Japanese (日本語)', prefix: '[JA]' },
  ko: { label: 'Korean (한국어)', prefix: '[KO]' },
  es: { label: 'Spanish (Español)', prefix: '[ES]' },
  fr: { label: 'French (Français)', prefix: '[FR]' },
  de: { label: 'German (Deutsch)', prefix: '[DE]' },
  pt: { label: 'Portuguese (Português)', prefix: '[PT]' },
};

export async function POST(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json().catch(() => ({}));
  const locale = body.locale || 'zh-CN';
  const meta = LOCALE_LABELS[locale] || { label: locale, prefix: `[${locale.toUpperCase()}]` };

  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const steps = JSON.parse(flow.stepsJson || '[]');
  const sampleSteps = steps.map((s: any) => ({
    id: s.id,
    title: s.title,
    callout: s.hotspots?.[0]?.tooltipText || '',
    voiceoverText: s.voiceover?.script || s.title || '',
  }));

  const aiTranslation = await callAzureOpenAiJson<{
    translatedFlowName: string;
    translatedSteps: Array<{ id?: string; title: string; callout: string; voiceoverText: string }>;
  }>(
    `Translate the interactive product demo title, step titles, hotspot callout tooltips, and voiceover narration scripts into natural, native ${meta.label} (locale code: ${locale}). Return JSON {"translatedFlowName": "...", "translatedSteps": [{"title": "...", "callout": "...", "voiceoverText": "..."}]} with the exact same number of steps (${sampleSteps.length}).`,
    JSON.stringify({ flowName: flow.name, steps: sampleSteps }),
    {
      translatedFlowName: `${meta.prefix} ${flow.name}`,
      translatedSteps: sampleSteps,
    }
  );

  const normalizedSteps = sampleSteps.map((orig: any, idx: number) => {
    const t = aiTranslation.data.translatedSteps?.[idx];
    return {
      id: orig.id,
      title: t?.title || `${meta.prefix} ${orig.title}`,
      callout: t?.callout || orig.callout,
      tooltip: t?.callout || orig.callout,
      voiceoverText: t?.voiceoverText || orig.voiceoverText,
    };
  });

  // Synthesize native neural audio for the first step in the target language
  const firstScript = normalizedSteps[0]?.voiceoverText || aiTranslation.data.translatedFlowName || flow.name;
  const tts = await synthesizeSpeechAudio(firstScript, 'ava-natural', [], locale);

  const translations = JSON.parse(flow.translationsJson || '{}');
  translations[locale] = {
    name: aiTranslation.data.translatedFlowName || `${meta.prefix} ${flow.name}`,
    localeLabel: meta.label,
    steps: normalizedSteps,
    translatedSteps: normalizedSteps,
    audioUrl: tts.audioUrl,
    neuralVoice: tts.neuralVoice,
    provider: aiTranslation.provider,
    status: 'Synced',
    updatedAt: new Date().toISOString(),
  };

  const updated = await prisma.flow.update({
    where: { id: flow.id },
    data: { translationsJson: JSON.stringify(translations) },
  });

  return NextResponse.json({
    ok: true,
    translations,
    flow: updated,
    aiProvider: aiTranslation.provider,
    aiModel: aiTranslation.model,
    ttsAudioUrl: tts.audioUrl,
    ttsNeuralVoice: tts.neuralVoice,
  });
}
