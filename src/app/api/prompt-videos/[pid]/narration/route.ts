import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { videoAccess } from '@/lib/assets';
import { synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import type { VideoTimeline, PromptVideoDesignValues } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await videoAccess((await params).pid, true);
  await throttle(`tts:${user.id}`, 30, 3600);
  const input = await body(request);
  const sceneId = text(input.sceneId, 'Scene', 100);
  const values: PromptVideoDesignValues = JSON.parse(asset.designValuesJson);
  const timeline: VideoTimeline = JSON.parse(asset.timelineJson);
  const clip = timeline.scenesTrack.find((s) => s.id === sceneId);
  const script = values.scenes[sceneId]?.NarrationText;
  if (!clip || !script) throw new HttpError(400, 'Add a narration script to this scene first.');
  const rules: { word: string; replacement: string }[] = JSON.parse(workspace.pronunciationRulesJson);
  const speech = await withWorkspaceStorage(workspace.id, () => synthesizeSpeechAudio(script, String(input.voiceId || 'ava-natural'), rules, typeof input.locale === 'string' ? input.locale : undefined));
  timeline.voiceoverTrack = [...timeline.voiceoverTrack.filter((v) => v.sceneId !== sceneId), {
    id: crypto.randomUUID(), sceneId, sceneNumber: clip.sceneNumber, startSec: clip.startSec,
    endSec: clip.startSec + clip.durationSec, script, voiceId: String(input.voiceId || 'ava-natural'),
    voiceName: speech.neuralVoice || 'Azure Speech', speed: 1, volume: 1, audioUrl: speech.audioUrl,
  }];
  const video = await prisma.promptVideo.update({ where: { id: asset.id }, data: { timelineJson: JSON.stringify(timeline), exportsJson: '[]', status: 'DRAFT', currentVersion: { increment: 1 } } });
  return NextResponse.json({ video, speech });
});
