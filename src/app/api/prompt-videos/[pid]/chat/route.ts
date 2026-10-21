import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { validateContent, videoAccess } from '@/lib/assets';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import type { PromptVideoDesignValues } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await videoAccess((await params).pid, true);
  await throttle(`ai:${user.id}`, 30, 3600);
  const input = await body(request);
  const message = text(input.message, 'Instruction', 4000);
  const values: PromptVideoDesignValues = JSON.parse(asset.designValuesJson);
  const sceneId = text(input.targetSceneId, 'Scene', 100);
  if (!values.scenes[sceneId]) throw new HttpError(404, 'Scene not found.');
  const result = await callAzureOpenAiJson<{ reply: string; updatedFields: Record<string, string> }>(
    'Apply the requested edit to the supplied scene. Never invent factual claims. Return JSON {"reply":"brief description of actual edits","updatedFields":{...}}. Only change existing field keys.',
    JSON.stringify({ instruction: message, fields: values.scenes[sceneId] }), { reply: '', updatedFields: {} },
  );
  if (!result.data.updatedFields || typeof result.data.updatedFields !== 'object') throw new HttpError(502, 'The AI provider returned invalid edits.');
  for (const [key, value] of Object.entries(result.data.updatedFields)) {
    if (key in values.scenes[sceneId]) values.scenes[sceneId][key] = text(value, key, 3000, false);
  }
  validateContent(values, workspace.id);
  const version = asset.currentVersion + 1;
  const video = await prisma.promptVideo.update({ where: { id: asset.id }, data: {
    currentVersion: version, designValuesJson: JSON.stringify(values), exportsJson: '[]', status: 'DRAFT',
    timelineJson: JSON.stringify({ ...JSON.parse(asset.timelineJson), voiceoverTrack: [] }),
    sessions: { create: { versionNumber: version, messagesJson: JSON.stringify([
      { id: crypto.randomUUID(), role: 'user', content: message, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), role: 'assistant', content: text(result.data.reply, 'Edit summary', 2000), createdAt: new Date().toISOString() },
    ]) } },
  }, include: { sessions: { orderBy: { versionNumber: 'desc' } } } });
  return NextResponse.json({ video });
});
