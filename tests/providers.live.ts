import '../scripts/environment';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { crawlAndCaptureWebsite } from '../src/lib/production-engine/live-crawler';
import { callAzureOpenAiJson, synthesizeSpeechAudio } from '../src/lib/production-engine/ai-provider';
import { renderPromptVideoMp4 } from '../src/lib/production-engine/media-renderer';
import { withWorkspaceStorage, resolveAssetPath } from '../src/lib/production-engine/storage';

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error('Provide a public website URL you have permission to capture: npm run test:providers -- https://your-site.example');
  const temp = await mkdtemp(path.join(tmpdir(), 'arcade-live-'));
  process.env.ARCADE_STORAGE_DIR = temp;
  try {
    await withWorkspaceStorage(`validation-${randomUUID()}`, async () => {
      const crawl = await crawlAndCaptureWebsite(url);
      assert.ok(crawl.screenshots.length);
      const copy = await callAzureOpenAiJson<{ title: string; subtitle: string }>(
        'Return JSON {"title":"...","subtitle":"..."}. Write one concise product introduction using only supplied public website facts. Do not invent claims.',
        JSON.stringify({ title: crawl.title, description: crawl.description }),
      );
      assert.equal(typeof copy.data.title, 'string'); assert.ok(copy.data.title);
      const speech = await synthesizeSpeechAudio('This is a real production voiceover check.', 'ava-natural', [], 'en');
      const audio = await resolveAssetPath(speech.audioUrl);
      const audioBytes = (await stat(audio)).size; assert.ok(audioBytes > 1000);
      const durationSec = 6;
      const scene = { sceneId: 'opening', sceneNumber: 1, title: copy.data.title, archetype: 'HERO_SPLIT', durationSec, startSec: 0, screenshotUrl: crawl.screenshots[0].url };
      const rendered = await renderPromptVideoMp4({
        aspectRatio: '16:9', durationSec,
        scenesJson: JSON.stringify([scene]),
        designValuesJson: JSON.stringify({ colors: { BackgroundPrimary: '#24251f', TextPrimary: '#faf8ef', AccentPrimary: '#dc7250' }, scenes: { opening: { TitleText: copy.data.title, SubtitleText: copy.data.subtitle } } }),
        timelineJson: JSON.stringify({ totalDurationSec: durationSec, fps: 30, scenesTrack: [{ ...scene, id: scene.sceneId }], voiceoverTrack: [{ id: 'voice', sceneId: scene.sceneId, startSec: 0, endSec: durationSec, volume: 1, speed: 1, audioUrl: speech.audioUrl }], musicTrack: [], sfxTrack: [], panZoomTrack: [] }),
      }, '720p', 30);
      const videoBytes = (await stat(await resolveAssetPath(rendered.fileUrl))).size;
      assert.ok(videoBytes > 1000);
      console.log(JSON.stringify({ capturedPages: crawl.screenshots.length, extractedColors: crawl.colors.length, aiProvider: copy.provider, aiModel: copy.model, speechAudioBytes: audioBytes, videoBytes }));
    });
  } finally { await rm(temp, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
