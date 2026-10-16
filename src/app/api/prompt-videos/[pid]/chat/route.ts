import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';

export async function POST(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const body = await request.json().catch(() => ({}));
  const message = (body.message || 'Make the headline bolder').trim();
  const targetSceneId = body.targetSceneId || null;

  const video = await prisma.promptVideo.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
    include: { sessions: { orderBy: { versionNumber: 'desc' } } },
  });
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  const designValues = JSON.parse(video.designValuesJson || '{"colors":{},"scenes":{}}');
  const activeSceneId = targetSceneId || 'scene_1';
  const currentSceneFields = designValues.scenes?.[activeSceneId] || {};

  if (targetSceneId && designValues.scenes?.[targetSceneId]) {
    const firstKey = Object.keys(designValues.scenes[targetSceneId])[0];
    if (firstKey && body.updatedText) {
      designValues.scenes[targetSceneId][firstKey] = body.updatedText;
    }
  }

  const aiResponse = await callAzureOpenAiJson<{
    reply: string;
    updatedFields?: Record<string, string>;
    updatedColors?: Record<string, string>;
  }>(
    'You are Avery, Arcade AI Launch Video Director. Given the user instruction and current scene design fields, return JSON with {"reply": "concise 1-2 sentence explanation of changes made", "updatedFields": {...optional updated string fields for the target scene...}, "updatedColors": {...optional hex color updates...}}.',
    JSON.stringify({
      instruction: message,
      targetSceneId: activeSceneId,
      currentSceneFields,
      currentColors: designValues.colors || {},
    }),
    {
      reply: `Updated ${targetSceneId ? targetSceneId.replace('_', ' ') : 'the video composition'} based on "${message}".`,
    }
  );

  if (aiResponse.data.updatedFields && designValues.scenes?.[activeSceneId]) {
    for (const [k, v] of Object.entries(aiResponse.data.updatedFields)) {
      if (typeof v === 'string' && v.trim() && k in designValues.scenes[activeSceneId]) {
        designValues.scenes[activeSceneId][k] = v;
      }
    }
  }
  if (aiResponse.data.updatedColors && designValues.colors) {
    for (const [k, v] of Object.entries(aiResponse.data.updatedColors)) {
      if (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) && k in designValues.colors) {
        designValues.colors[k] = v;
      }
    }
  }

  const latestSession = video.sessions[0];
  const messages = latestSession ? JSON.parse(latestSession.messagesJson || '[]') : [];
  const nextVersion = video.currentVersion + 1;

  messages.push(
    {
      id: `u_${Date.now()}`,
      role: 'user',
      content: targetSceneId ? `@${targetSceneId.replace('_', ' ')} ${message}` : message,
      createdAt: new Date().toISOString(),
    },
    {
      id: `a_${Date.now() + 1}`,
      role: 'assistant',
      content: `${aiResponse.data.reply} (Saved snapshot **v${nextVersion}** via ${aiResponse.provider === 'azure-openai' ? `Azure OpenAI ${aiResponse.model}` : 'Avery Studio Engine'}).`,
      createdAt: new Date().toISOString(),
    }
  );

  if (latestSession) {
    await prisma.promptVideoSession.update({
      where: { id: latestSession.id },
      data: {
        versionNumber: nextVersion,
        messagesJson: JSON.stringify(messages),
      },
    });
  }

  const updated = await prisma.promptVideo.update({
    where: { id: video.id },
    data: {
      currentVersion: nextVersion,
      designValuesJson: JSON.stringify(designValues),
    },
    include: { sessions: { orderBy: { versionNumber: 'desc' } }, brandKit: true },
  });

  return NextResponse.json({
    ok: true,
    video: updated,
    messages,
    aiProvider: aiResponse.provider,
    aiModel: aiResponse.model,
  });
}
