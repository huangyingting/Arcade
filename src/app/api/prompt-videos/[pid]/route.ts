import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text } from '@/lib/api';
import { assetStatus, validateContent, videoAccess } from '@/lib/assets';
import { validateVideo } from '@/lib/validation';
import type { VideoTimeline, PromptVideoDesignValues } from '@/types/domain';

type Context = { params: Promise<{ pid: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { asset, workspace, role } = await videoAccess((await params).pid);
  const video = await prisma.promptVideo.findUnique({ where: { id: asset.id }, include: { sessions: { orderBy: { versionNumber: 'desc' } }, brandKit: true } });
  return NextResponse.json({ video: { ...video, workspace: { slug: workspace.slug }, role } });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { asset, workspace } = await videoAccess((await params).pid, true);
  const input = await body(request);
  const data: Record<string, unknown> = {};
  if ('name' in input) data.name = text(input.name, 'Video name', 200);
  for (const [key, kind] of Object.entries({ scenes: 'array', designSchema: 'object', designValues: 'object', timeline: 'object', pronunciation: 'array' }) as [string, 'array' | 'object'][]) {
    if (key in input) data[`${key}Json`] = validateContent(input[key], workspace.id, kind);
  }
  const scenes = input.scenes ?? JSON.parse(asset.scenesJson);
  const values = input.designValues ?? JSON.parse(asset.designValuesJson);
  const timeline = input.timeline ?? JSON.parse(asset.timelineJson);
  validateVideo(scenes, values, timeline, workspace.id);
  const nextValues: PromptVideoDesignValues = JSON.parse(typeof data.designValuesJson === 'string' ? data.designValuesJson : asset.designValuesJson);
  const nextTimeline: VideoTimeline = JSON.parse(typeof data.timelineJson === 'string' ? data.timelineJson : asset.timelineJson);
  const voices = nextTimeline.voiceoverTrack.filter((clip) => clip.script === nextValues.scenes[clip.sceneId]?.NarrationText);
  if (voices.length !== nextTimeline.voiceoverTrack.length) data.timelineJson = JSON.stringify({ ...nextTimeline, voiceoverTrack: voices });
  if (input.currentVersion !== undefined && input.currentVersion !== asset.currentVersion) throw new HttpError(409, 'This video changed in another session. Reload before saving.');
  const compositionChanged = ['scenesJson', 'designValuesJson', 'timelineJson'].some((key) => key in data && data[key] !== asset[key as keyof typeof asset]);
  if (compositionChanged) {
    data.exportsJson = '[]'; data.status = 'DRAFT'; data.currentVersion = { increment: 1 };
  }
  if ('status' in input) {
    data.status = assetStatus(input.status);
    if (data.status === 'PUBLISHED' && (compositionChanged || !JSON.parse(asset.exportsJson).some((item: { status: string }) => item.status === 'READY'))) throw new HttpError(400, 'Render an up-to-date export before publishing this video.');
  }
  const video = await prisma.promptVideo.update({ where: { id: asset.id, currentVersion: asset.currentVersion }, data, include: { sessions: { orderBy: { versionNumber: 'desc' } }, brandKit: true } });
  return NextResponse.json({ video });
});
export const DELETE = api<Context>(async (_request, { params }) => {
  const { asset } = await videoAccess((await params).pid, true);
  await prisma.promptVideo.update({ where: { id: asset.id }, data: { status: 'DELETED' } });
  return NextResponse.json({ ok: true });
});
