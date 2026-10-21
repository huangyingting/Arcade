import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text, throttle } from '@/lib/api';
import { flowAccess } from '@/lib/assets';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import type { FlowStep } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, user } = await flowAccess((await params).pid, true);
  await throttle(`ai:${user.id}`, 30, 3600);
  const input = await body(request);
  const steps: FlowStep[] = JSON.parse(asset.stepsJson);
  if (!steps.length) throw new HttpError(400, 'Add steps before refining your demo.');
  const result = await callAzureOpenAiJson<{ steps: { title: string; tooltipText: string; voiceoverScript: string }[] }>(
    'Refine the supplied product walkthrough copy without inventing claims. Return JSON {"steps":[{"title":"...","tooltipText":"...","voiceoverScript":"..."}]} with exactly one entry per input step, in order.',
    JSON.stringify({ instruction: text(input.prompt, 'Instruction', 4000), steps: steps.map((s) => ({ title: s.title, tooltipText: s.hotspots[0]?.tooltipText || '', voiceoverScript: s.voiceover.script })) }),
    { steps: [] },
  );
  if (result.data.steps?.length !== steps.length) throw new HttpError(502, 'The AI provider returned incomplete copy.');
  const updatedSteps = steps.map((step, index) => ({
    ...step, title: text(result.data.steps[index].title, 'Step title', 200),
    hotspots: step.hotspots.map((hotspot, h) => h ? hotspot : { ...hotspot, tooltipText: text(result.data.steps[index].tooltipText, 'Tooltip', 1000, false) }),
    voiceover: { ...step.voiceover, audioUrl: undefined, enabled: false, script: text(result.data.steps[index].voiceoverScript, 'Narration', 5000, false) },
  }));
  const flow = await prisma.flow.update({ where: { id: asset.id }, data: { stepsJson: JSON.stringify(updatedSteps) } });
  return NextResponse.json({ flow, steps: updatedSteps, aiProvider: result.provider, aiModel: result.model });
});
