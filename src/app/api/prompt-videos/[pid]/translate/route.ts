import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { validateContent, videoAccess } from '@/lib/assets';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import { TRANSLATION_LOCALES, type PromptVideoDesignValues } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await videoAccess((await params).pid, true);
  await throttle(`ai:${user.id}`, 30, 3600);
  const input = await body(request);
  const locale = text(input.locale, 'Language', 30);
  if (!['en', ...TRANSLATION_LOCALES.map((l) => l.code)].includes(locale)) throw new HttpError(400, 'Unsupported language.');
  const values: PromptVideoDesignValues = JSON.parse(asset.designValuesJson);
  const result = await callAzureOpenAiJson<{ name: string; scenes: Record<string, Record<string, string>> }>(
    `Translate text into ${locale}. Preserve field keys and URLs. Return JSON {"name":"...","scenes":{...}} using the same scene and field keys.`, JSON.stringify({ name: asset.name, scenes: values.scenes }), { name: '', scenes: {} },
  );
  for (const [sceneId, fields] of Object.entries(values.scenes)) {
    for (const key of Object.keys(fields)) {
      if (key.toLowerCase().includes('url')) continue;
      if (typeof result.data.scenes?.[sceneId]?.[key] !== 'string') throw new HttpError(502, 'The translation is incomplete.');
      fields[key] = text(result.data.scenes[sceneId][key], 'Translated text', 3000, false);
    }
  }
  const video = await prisma.promptVideo.update({ where: { id: asset.id }, data: {
    name: text(result.data.name, 'Translated title', 200), designValuesJson: validateContent(values, workspace.id),
    currentVersion: { increment: 1 }, exportsJson: '[]', status: 'DRAFT',
    timelineJson: JSON.stringify({ ...JSON.parse(asset.timelineJson), voiceoverTrack: [] }),
  }, include: { sessions: { orderBy: { versionNumber: 'desc' } } } });
  return NextResponse.json({ video });
});
