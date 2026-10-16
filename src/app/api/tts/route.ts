import { NextResponse } from 'next/server';
import { synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawScript = body.script || 'Welcome to Arcade interactive product studio.';
    const voiceId = body.voiceId || 'ava-natural';
    const pronunciations = body.pronunciations || [];
    const locale = body.locale || undefined;

    const result = await synthesizeSpeechAudio(rawScript, voiceId, pronunciations, locale);
    return NextResponse.json({
      ok: true,
      ...result,
      voiceId,
    });
  } catch {
    return NextResponse.json({
      ok: true,
      audioUrl: '/media/voiceover-sample.wav',
      processedScript: '',
      durationSec: 4,
      provider: 'fallback',
    });
  }
}
