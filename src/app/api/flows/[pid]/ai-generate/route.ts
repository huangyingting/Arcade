import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAzureOpenAiJson, synthesizeSpeechAudio } from '@/lib/production-engine/ai-provider';

export async function POST(
  request: Request,
  { params }: { params: { pid: string } }
) {
  const body = await request.json().catch(() => ({}));
  const prompt = body.prompt || 'Polish all hotspot tooltips, callouts, and voiceover scripts with concise executive clarity.';
  const tone = body.tone || 'Product Launch';

  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const steps = JSON.parse(flow.stepsJson || '[]');
  const aiInput = steps.map((s: any, idx: number) => ({
    index: idx,
    title: s.title,
    tooltipText: s.hotspots?.[0]?.tooltipText || '',
    voiceoverScript: s.voiceover?.script || '',
  }));

  const aiResult = await callAzureOpenAiJson<{
    steps: Array<{ index: number; title: string; tooltipText: string; voiceoverScript: string }>;
  }>(
    'You are Avery, Arcade Interactive Demo Copywriter. Polish each step title, hotspot tooltipText (concise action-oriented CTA), and voiceoverScript (1-2 natural spoken sentences) according to the user prompt and tone. Return JSON {"steps": [{"index": 0, "title": "...", "tooltipText": "...", "voiceoverScript": "..."}]}.',
    JSON.stringify({ flowName: flow.name, tone, prompt, steps: aiInput }),
    { steps: [] }
  );

  const aiMap = new Map(
    (aiResult.data.steps || []).map((item) => [item.index, item])
  );

  const polishedSteps = await Promise.all(
    steps.map(async (step: Record<string, any>, idx: number) => {
      const aiStep = aiMap.get(idx);
      const nextHotspots = (step.hotspots || []).map((hs: Record<string, any>, hIdx: number) => ({
        ...hs,
        tooltipText:
          body.customTooltip ||
          (hIdx === 0 && aiStep?.tooltipText ? aiStep.tooltipText : `${hs.tooltipText.replace(/\s*✨$/, '')} ✨`),
      }));
      const nextScript =
        aiStep?.voiceoverScript ||
        step.voiceover?.script ||
        `Step ${idx + 1}: ${step.title} — tailored for ${prompt.slice(0, 50)}.`;

      let audioUrl = step.voiceover?.audioUrl || '/media/voiceover-sample.wav';
      if (idx === 0) {
        const tts = await synthesizeSpeechAudio(nextScript, step.voiceover?.voiceId || 'ava-natural');
        audioUrl = tts.audioUrl;
      }

      return {
        ...step,
        title: aiStep?.title || step.title || `Step ${idx + 1} (${tone})`,
        hotspots: nextHotspots,
        voiceover: {
          ...(step.voiceover || { enabled: true, voiceId: 'ava-natural', speed: 1.0 }),
          enabled: true,
          script: nextScript,
          audioUrl,
        },
      };
    })
  );

  const updated = await prisma.flow.update({
    where: { id: flow.id },
    data: { stepsJson: JSON.stringify(polishedSteps) },
  });

  return NextResponse.json({
    ok: true,
    flow: updated,
    steps: polishedSteps,
    aiProvider: aiResult.provider,
    aiModel: aiResult.model,
  });
}
