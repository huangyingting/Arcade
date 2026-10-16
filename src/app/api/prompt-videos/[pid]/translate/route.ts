import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAzureOpenAiJson, synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';

const LOCALE_NAMES: Record<string, string> = {
  en: 'English (US)',
  'zh-CN': 'Chinese Simplified (简体中文)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
};

export async function POST(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const body = await request.json().catch(() => ({}));
  const locale = body.locale || 'zh-CN';
  const langName = LOCALE_NAMES[locale] || locale;

  const video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
    include: { sessions: { orderBy: { versionNumber: 'desc' } } },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const scenes = JSON.parse(video.scenesJson || '[]');
  const designValues = JSON.parse(video.designValuesJson || '{"colors":{},"scenes":{}}');
  const timeline = JSON.parse(video.timelineJson || '{}');
  const voiceoverTrack = timeline.voiceoverTrack || [];

  const aiTranslation = await callAzureOpenAiJson<{
    videoName: string;
    sceneTitles: string[];
    scenesFields: Record<string, Record<string, string>>;
    voiceoverScripts: string[];
  }>(
    `Translate the AI launch video title, scene titles, scene design text fields, and voiceover narration scripts into natural, native ${langName} (locale: ${locale}). Keep URLs, numbers (like 2,300+ or 120+), and hex codes intact. Return JSON {"videoName": "...", "sceneTitles": [...], "scenesFields": {"scene_1": {...}, ...}, "voiceoverScripts": [...]}.`,
    JSON.stringify({
      videoName: video.name,
      sceneTitles: scenes.map((s: any) => s.title),
      scenesFields: designValues.scenes || {},
      voiceoverScripts: voiceoverTrack.map((v: any) => v.script),
    }),
    {
      videoName: video.name,
      sceneTitles: scenes.map((s: any) => s.title),
      scenesFields: designValues.scenes || {},
      voiceoverScripts: voiceoverTrack.map((v: any) => v.script),
    }
  );

  const nextScenes = scenes.map((s: any, idx: number) => ({
    ...s,
    title: aiTranslation.data.sceneTitles?.[idx] || s.title,
  }));

  if (aiTranslation.data.scenesFields && designValues.scenes) {
    for (const [sceneKey, fields] of Object.entries(aiTranslation.data.scenesFields)) {
      if (designValues.scenes[sceneKey] && fields && typeof fields === 'object') {
        designValues.scenes[sceneKey] = {
          ...designValues.scenes[sceneKey],
          ...fields,
        };
      }
    }
  }

  const firstScript =
    aiTranslation.data.voiceoverScripts?.[0] ||
    voiceoverTrack[0]?.script ||
    aiTranslation.data.videoName;
  const tts = await synthesizeSpeechAudio(firstScript, 'ava-natural', [], locale);

  const nextVoiceoverTrack = voiceoverTrack.map((vo: any, idx: number) => ({
    ...vo,
    script: aiTranslation.data.voiceoverScripts?.[idx] || vo.script,
    audioUrl: idx === 0 ? tts.audioUrl : vo.audioUrl,
    voiceName: tts.neuralVoice,
  }));

  const nextTimeline = {
    ...timeline,
    voiceoverTrack: nextVoiceoverTrack,
    scenesTrack: (timeline.scenesTrack || []).map((st: any, idx: number) => ({
      ...st,
      title: nextScenes[idx]?.title || st.title,
    })),
  };

  const nextVersion = video.currentVersion + 1;
  const latestSession = video.sessions[0];
  if (latestSession) {
    const messages = JSON.parse(latestSession.messagesJson || '[]');
    messages.push({
      id: `a_lang_${Date.now()}`,
      role: 'assistant',
      content: `Localized all ${scenes.length} scenes and synthesized native **${langName}** voiceover via **${tts.neuralVoice}** (Snapshot **v${nextVersion}**).`,
      createdAt: new Date().toISOString(),
    });
    await prisma.promptVideoSession.update({
      where: { id: latestSession.id },
      data: { versionNumber: nextVersion, messagesJson: JSON.stringify(messages) },
    });
  }

  const updated = await prisma.promptVideo.update({
    where: { id: video.id },
    data: {
      name: aiTranslation.data.videoName || video.name,
      currentVersion: nextVersion,
      scenesJson: JSON.stringify(nextScenes),
      designValuesJson: JSON.stringify(designValues),
      timelineJson: JSON.stringify(nextTimeline),
    },
    include: { sessions: { orderBy: { versionNumber: 'desc' } }, brandKit: true },
  });

  return NextResponse.json({
    ok: true,
    video: updated,
    locale,
    aiProvider: aiTranslation.provider,
    aiModel: aiTranslation.model,
    ttsAudioUrl: tts.audioUrl,
    ttsNeuralVoice: tts.neuralVoice,
  });
}
