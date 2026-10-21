import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, integer, text, throttle, workspaceAccess, workspaceQuery } from '@/lib/api';
import { brandKitForWorkspace, brandAccent } from '@/lib/assets';
import { crawlAndCaptureWebsite } from '@/lib/production-engine/live-crawler';
import { callAzureOpenAiJson } from '@/lib/production-engine/ai-provider';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import type { VideoSceneArchetype } from '@/types/domain';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  return NextResponse.json({ videos: await prisma.promptVideo.findMany({ where: { workspaceId: workspace.id, status: { not: 'DELETED' } }, orderBy: { updatedAt: 'desc' } }) });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const { workspace, user } = await workspaceAccess(text(input.workspaceSlug, 'Workspace', 100), true);
  await throttle(`generate:${user.id}`, 10, 3600);
  const brandKit = await brandKitForWorkspace(input.brandKitId, workspace.id);
  const prompt = text(input.prompt, 'Creative brief', 5000);
  const durationSec = integer(input.durationSec ?? 30, 'Duration', 5, 120);
  const aspectRatio = text(input.aspectRatio ?? '16:9', 'Aspect ratio', 10);
  if (!['16:9', '9:16', '1:1'].includes(aspectRatio)) throw new HttpError(400, 'Unsupported aspect ratio.');
  const sourceUrl = text(input.sourceUrl, 'Source URL', 2000, false);
  const crawl = sourceUrl ? await withWorkspaceStorage(workspace.id, () => crawlAndCaptureWebsite(sourceUrl)) : null;
  const generated = await callAzureOpenAiJson<{ name: string; scenes: { title: string; subtitle: string; narration: string }[] }>(
    'You are a product video editor. Create 3 to 8 concise scenes using only the brief and supplied website facts. Never invent metrics, testimonials or claims. Return JSON {"name":"...", "scenes":[{"title":"...", "subtitle":"...", "narration":"..."}]}. Scene titles must be under 80 characters. No markdown.',
    JSON.stringify({ prompt, durationSec, brand: brandKit ? { product: JSON.parse(brandKit.productJson), voice: JSON.parse(brandKit.voiceJson) } : null, website: crawl ? { title: crawl.title, description: crawl.description, headings: crawl.headings, paragraphs: crawl.paragraphs } : null }),
    { name: '', scenes: [] },
  );
  if (!generated.data.name || !Array.isArray(generated.data.scenes) || generated.data.scenes.length < 1 || generated.data.scenes.length > 8) {
    throw new HttpError(502, 'The AI provider returned an invalid storyboard. Please retry.');
  }
  const sceneDuration = durationSec / generated.data.scenes.length;
  const scenes = generated.data.scenes.map((scene, index) => ({
    sceneId: `scene_${index + 1}`, sceneNumber: index + 1, title: text(scene.title, 'Scene title', 200),
    archetype: (index === 0 ? 'HERO_SPLIT' : index === generated.data.scenes.length - 1 ? 'END_CARD_CTA' : 'BROWSER_SPOTLIGHT') as VideoSceneArchetype,
    screenshotUrl: crawl?.screenshots[index % crawl.screenshots.length]?.url || '',
    startSec: index * sceneDuration, durationSec: sceneDuration,
  }));
  const fields = generated.data.scenes.map((scene, index) => [
    scenes[index].sceneId,
    { TitleText: scene.title, SubtitleText: text(scene.subtitle, 'Scene description', 1500, false), NarrationText: text(scene.narration, 'Narration', 2000, false), CtaUrl: sourceUrl },
  ]);
  const colors = { BackgroundPrimary: '#24251f', BackgroundSecondary: '#eeece4', TextPrimary: '#faf8ef', TextSecondary: '#bcbbae', AccentPrimary: '#dc7250', AccentSecondary: '#a9b796' };
  if (brandAccent(brandKit)) colors.AccentPrimary = brandAccent(brandKit)!;
  const video = await prisma.promptVideo.create({ data: {
    workspaceId: workspace.id, createdById: user.id, brandKitId: brandKit?.id,
    name: text(generated.data.name, 'Video name', 200), prompt, sourceUrl: sourceUrl || null,
    aspectRatio, durationSec, thumbnailUrl: scenes[0]?.screenshotUrl || null,
    scenesJson: JSON.stringify(scenes), designValuesJson: JSON.stringify({ colors, scenes: Object.fromEntries(fields) }),
    designSchemaJson: JSON.stringify({
      colors: Object.entries(colors).map(([key, defaultHex]) => ({ key, label: key.replace(/([A-Z])/g, ' $1').trim(), defaultHex })),
      scenes: scenes.map((scene) => ({ ...scene, fields: [
        { key: 'TitleText', label: 'Headline', type: 'text' }, { key: 'SubtitleText', label: 'Supporting copy', type: 'textarea' },
        { key: 'NarrationText', label: 'Narration script', type: 'textarea' }, { key: 'CtaUrl', label: 'Destination', type: 'url' },
      ] })),
    }),
    timelineJson: JSON.stringify({ totalDurationSec: durationSec, fps: 30, scenesTrack: scenes.map((s) => ({ ...s, id: s.sceneId })), voiceoverTrack: [], panZoomTrack: [], musicTrack: [], sfxTrack: [] }),
    sessions: { create: { state: 'COMPLETED', summaryText: 'Storyboard created. Narration and export have not been rendered.', stagesJson: '[]', messagesJson: JSON.stringify([
      { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() },
      { id: crypto.randomUUID(), role: 'assistant', content: `Created ${scenes.length} scenes from your brief using ${generated.model}. Review the copy, generate narration if needed, then render your export.`, createdAt: new Date().toISOString() },
    ]) } },
  } });
  return NextResponse.json({ video }, { status: 201 });
});
