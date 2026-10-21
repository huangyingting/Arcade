import { NextResponse } from 'next/server';
import { api, body, text, throttle, workspaceAccess } from '@/lib/api';
import { synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';

export const POST = api(async (request) => {
  const input = await body(request);
  const { workspace, user } = await workspaceAccess(text(input.workspaceSlug, 'Workspace', 100), true);
  await throttle(`tts:${user.id}`, 30, 3600);
  const rules: { word: string; replacement: string }[] = JSON.parse(workspace.pronunciationRulesJson);
  const result = await withWorkspaceStorage(workspace.id, () => synthesizeSpeechAudio(
    text(input.script, 'Narration script', 10000), text(input.voiceId ?? 'ava-natural', 'Voice', 100),
    rules, input.locale ? text(input.locale, 'Language', 30) : undefined,
  ));
  return NextResponse.json({ ...result, ok: true });
});
