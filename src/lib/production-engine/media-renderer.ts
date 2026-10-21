import path from 'node:path';
import fs from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';
import {
  audioFormat, createJob, type EngineScope, numberInRange, probeDuration, ProductionError,
  readScopedAsset, requireEngineScope, runMediaCommand, text,
} from './runtime';
import { embeddedFontCss } from './renderer-fonts';
import { sceneLayout, type SceneArchetype } from './scene-layouts';
import { parsePublicUrl } from './public-network';

export { ProductionError } from './runtime';

type Model = Record<string, any>;
type Motion = 'none' | 'zoom-in' | 'zoom-out' | 'pan-left';
interface Frame { html: string; duration: number; motion?: Motion }
interface AudioTrack { url: string; start: number }
const MAX_DURATION = 180;
const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}
function label(value: unknown, name = 'text', max = 4000): string {
  return escapeHtml(text(value, name, max));
}
function color(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !/^#[a-f0-9]{3}(?:[a-f0-9]{3})?(?:[a-f0-9]{2})?$/i.test(value)) {
    throw new ProductionError('Colors must be hexadecimal values, not CSS or external URLs.', 'INVALID_COLOR', 400);
  }
  return value;
}
function model(value: unknown, name: string): Model {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ProductionError(`${name} must be an object.`, 'INVALID_INPUT', 400);
  }
  return value as Model;
}
function json(value: unknown, name: string, fallback: unknown): any {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || value.length > 1024 * 1024) {
    throw new ProductionError(`${name} must be JSON smaller than 1 MB.`, 'INVALID_INPUT', 400);
  }
  try { return JSON.parse(value); }
  catch { throw new ProductionError(`${name} contains invalid JSON.`, 'INVALID_INPUT', 400); }
}
function list(value: unknown, name: string, required = true): Model[] {
  if (!Array.isArray(value) || (required && !value.length) || value.length > 30) {
    throw new ProductionError(`${name} must contain ${required ? '1' : '0'} to 30 items.`, 'EMPTY_OR_INVALID_CONTENT', 400);
  }
  return value.map((entry) => model(entry, name));
}
function duration(value: unknown, fallback?: number) {
  return numberInRange(value === undefined ? fallback : value, 'durationSec', 0.25, 60);
}
function dimensions(resolution: unknown, aspectRatio: unknown = '16:9'): [number, number] {
  if (resolution === '4K') {
    throw new ProductionError('4K export is not supported by this renderer; select 720p or 1080p.', 'UNSUPPORTED_RESOLUTION', 422);
  }
  if (resolution !== '720p' && resolution !== '1080p') {
    throw new ProductionError('Unsupported resolution.', 'UNSUPPORTED_RESOLUTION', 400);
  }
  const ratios: Record<string, [number, number]> = {
    '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1],
    '4:5': [4, 5], '4:3': [4, 3], '3:4': [3, 4],
  };
  const ratio = typeof aspectRatio === 'string' ? ratios[aspectRatio] : undefined;
  if (!ratio) {
    throw new ProductionError('Supported aspect ratios are 16:9, 9:16, 1:1, 4:5, 4:3 and 3:4.', 'UNSUPPORTED_ASPECT_RATIO', 400);
  }
  const shortSide = resolution === '720p' ? 720 : 1080;
  return ratio.map((side) => Math.round(shortSide * side / Math.min(...ratio) / 2) * 2) as [number, number];
}
async function image(url: unknown, scope?: EngineScope): Promise<string> {
  if (url === undefined || url === null || url === '') return '';
  const bytes = await readScopedAsset(text(url, 'image URL', 2048, true), scope);
  const mime = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? 'image/png'
    : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? 'image/jpeg'
      : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
        ? 'image/webp' : '';
  if (!mime) {
    throw new ProductionError('Only PNG, JPEG and WebP workspace images are supported.', 'UNSUPPORTED_IMAGE', 422);
  }
  return `data:${mime};base64,${bytes.toString('base64')}`;
}
async function documentHtml(width: number, height: number, style: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'none'; frame-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'"><style>
*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden}${await embeddedFontCss()}h1,p{overflow-wrap:anywhere}img{display:block;max-width:100%;object-fit:contain}${style}
</style></head><body>${body}</body></html>`;
}
async function openPage(width: number, height: number) {
  const browser = await chromium.launch({ headless: true, timeout: 15_000 });
  try {
    const context = await browser.newContext({
      viewport: { width, height }, javaScriptEnabled: false, serviceWorkers: 'block', acceptDownloads: false,
    });
    await context.route('**/*', (route) => route.abort('blockedbyclient'));
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    return { browser, page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
async function screenshot(page: Page, html: string, file: string) {
  await page.setContent(html, { waitUntil: 'load', timeout: 15_000 });
  await page.evaluate(async () => {
    await Promise.all([document.fonts.load('400 16px "Mona Sans"'), document.fonts.load('400 16px "JetBrains Mono"')]);
    await document.fonts.ready;
  });
  const validImages = await page.evaluate(() => Array.from(document.images).every((img) =>
    img.complete && img.naturalWidth > 0 && img.naturalHeight > 0 &&
    img.naturalWidth <= 12_000 && img.naturalHeight <= 12_000 &&
    img.naturalWidth * img.naturalHeight <= 24_000_000));
  if (!validImages) throw new ProductionError('An image could not be decoded or exceeds image dimension limits.', 'INVALID_IMAGE', 422);
  await page.screenshot({ path: file, animations: 'disabled', timeout: 15_000 });
}
function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
async function outputSize(file: string) {
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size < 1 || stat.size > MAX_OUTPUT_BYTES) {
    throw new ProductionError('Render output is empty or exceeds the 256 MB export limit.', 'INVALID_OUTPUT', 502);
  }
  return formatBytes(stat.size);
}
function renderError(error: unknown): ProductionError {
  return error instanceof ProductionError ? error : new ProductionError(
    'Rendering failed. Verify Playwright Chromium and ffmpeg are installed and the input media is valid.',
    'RENDER_FAILED', 502,
  );
}

async function encode(
  directory: string, frames: Frame[], format: 'mp4' | 'gif', fps: number,
  tracks: AudioTrack[], width: number, height: number, scope?: EngineScope,
) {
  const total = frames.reduce((sum, frame) => sum + frame.duration, 0);
  numberInRange(total, 'total video duration', 0.25, MAX_DURATION);
  const concat = frames.flatMap((frame, index) => [`file 'frame-${index}.png'`, `duration ${frame.duration}`]);
  concat.push(`file 'frame-${frames.length - 1}.png'`);
  await fs.writeFile(path.join(directory, 'frames.txt'), concat.join('\n'), { mode: 0o600 });
  const args = ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-threads', '2',
    '-protocol_whitelist', 'file,pipe', '-f', 'concat', '-safe', '1', '-i', path.join(directory, 'frames.txt')];
  const filters: string[] = [];
  for (const [index, track] of tracks.entries()) {
    const bytes = await readScopedAsset(track.url, scope, 8 * 1024 * 1024);
    const format = audioFormat(bytes);
    const audioPath = path.join(directory, `audio-${index}`);
    await fs.writeFile(audioPath, bytes, { mode: 0o600 });
    const length = await probeDuration(audioPath, format);
    if (track.start + length > total + 0.15) {
      throw new ProductionError('Narration extends beyond the video timeline. Adjust scene durations before exporting.', 'AUDIO_EXCEEDS_TIMELINE', 422);
    }
    args.push('-protocol_whitelist', 'file,pipe', '-f', format, '-i', audioPath);
    const delay = Math.round(track.start * 1000);
    filters.push(`[${index + 1}:a]adelay=${delay}:all=1[a${index}]`);
  }
  if (tracks.length) {
    filters.push(`${tracks.map((_, index) => `[a${index}]`).join('')}amix=inputs=${tracks.length}:normalize=0[audio]`);
    args.push('-filter_complex_threads', '1', '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[audio]', '-c:a', 'aac');
  }
  args.push('-t', String(total));
  let videoFilter = `fps=${fps},tpad=stop_mode=clone:stop_duration=${total}`;
  if (frames.some((frame) => frame.motion && frame.motion !== 'none')) {
    let cursor = 0;
    const starts: number[] = [];
    const counts = frames.map((frame) => {
      const start = Math.round(cursor * fps);
      starts.push(start);
      cursor += frame.duration;
      return Math.max(1, Math.round(cursor * fps) - start);
    });
    const select = (values: Array<string | number>, fallback: string | number) =>
      values.reduceRight<string>((expression, value, index) => `if(eq(in,${index}),${value},${expression})`, String(fallback));
    const progress = counts.map((count, index) => `min(1,max(0,(on-${starts[index]})/${Math.max(1, count - 1)}))`);
    const zooms = frames.map((frame, index) => frame.motion === 'zoom-in' ? `1+0.035*${progress[index]}`
      : frame.motion === 'zoom-out' ? `1.035-0.035*${progress[index]}` : frame.motion === 'pan-left' ? '1.035' : '1');
    const positions = frames.map((frame, index) => frame.motion === 'pan-left'
      ? `(iw-iw/zoom)*${progress[index]}` : 'iw/2-iw/zoom/2');
    videoFilter = `zoompan=z='${select(zooms, 1)}':x='${select(positions, 'iw/2-iw/zoom/2')}':y='ih/2-ih/zoom/2':d='${select(counts, 1)}':s=${width}x${height}:fps=${fps}`;
  }
  if (format === 'gif') {
    args.push('-vf', `${videoFilter},scale=800:-2:flags=lanczos`, '-loop', '0');
  } else {
    args.push('-vf', `${videoFilter},scale=trunc(iw/2)*2:trunc(ih/2)*2`, '-c:v', 'libx264', '-threads', '2',
      '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  }
  args.push('-fs', String(MAX_OUTPUT_BYTES + 1), path.join(directory, `export.${format}`));
  await runMediaCommand('ffmpeg', args, 180_000);
  const expectedDuration = format === 'mp4' ? await probeDuration(path.join(directory, 'export.mp4')) : total;
  if (Math.abs(expectedDuration - total) > 0.25) {
    throw new ProductionError(`Encoded duration (${expectedDuration}s) does not match the supplied timeline (${total}s).`, 'INVALID_OUTPUT', 502);
  }
}

async function renderFrames(frames: Frame[], width: number, height: number, format: 'mp4' | 'gif',
  fps: number, tracks: AudioTrack[], scope?: EngineScope) {
  const job = await createJob(scope);
  let browser: Browser | undefined;
  try {
    const opened = await openPage(width, height);
    browser = opened.browser;
    for (const [index, frame] of frames.entries()) {
      await screenshot(opened.page, frame.html, path.join(job.directory, `frame-${index}.png`));
    }
    await browser.close();
    browser = undefined;
    await encode(job.directory, frames, format, fps, tracks, width, height, scope);
    const fileSize = await outputSize(path.join(job.directory, `export.${format}`));
    for (const name of await fs.readdir(job.directory)) {
      if (name !== `export.${format}`) await fs.unlink(path.join(job.directory, name));
    }
    const fileUrl = await job.publish(`export.${format}`);
    await job.cleanup();
    return { fileUrl, fileSize };
  } catch (error) {
    await job.cleanup();
    throw renderError(error);
  } finally { await browser?.close().catch(() => undefined); }
}

export async function renderPromptVideoMp4(
  input: any, resolution: '720p' | '1080p' | '4K' = '1080p', fps = 30, scope?: EngineScope,
): Promise<{ fileUrl: string; fileSize: string }> {
  requireEngineScope(scope);
  const video = model(input, 'video');
  if (!Number.isInteger(fps) || ![24, 25, 30, 50, 60].includes(fps)) {
    throw new ProductionError('Supported frame rates are 24, 25, 30, 50 and 60 FPS.', 'INVALID_FPS', 400);
  }
  const design = model(json(video.designValuesJson, 'designValuesJson', {}), 'design');
  const [width, height] = dimensions(resolution, video.aspectRatio ?? design.aspectRatio ?? '16:9');
  const scenes = list(json(video.scenesJson, 'scenesJson', []), 'scenes');
  const palette = model(design.colors || {}, 'colors');
  const sceneValues = model(design.scenes || {}, 'scene design');
  const timeline = model(json(video.timelineJson, 'timelineJson', {}), 'timeline');
  if (timeline.captionsEnabled !== undefined && typeof timeline.captionsEnabled !== 'boolean') {
    throw new ProductionError('captionsEnabled must be a boolean.', 'INVALID_INPUT', 400);
  }
  const voiceover = list(timeline.voiceoverTrack || [], 'voiceoverTrack', false);
  if ((timeline.musicTrack && Object.keys(timeline.musicTrack).length) || timeline.musicUrl || timeline.backgroundAudioUrl) {
    throw new ProductionError('Music tracks are not supported by this renderer.', 'UNSUPPORTED_AUDIO_TRACK', 422);
  }
  if (voiceover.length > scenes.length) throw new ProductionError('Voiceover references nonexistent scenes.', 'INVALID_TIMELINE', 400);
  const frames: Frame[] = [];
  const tracks: AudioTrack[] = [];
  let cursor = 0;
  for (const [index, scene] of scenes.entries()) {
    const id = text(scene.sceneId, 'sceneId', 100) || `scene_${index + 1}`;
    const values = model(sceneValues[id] || {}, 'scene design values');
    const narration = voiceover[index];
    const seconds = duration(scene.durationSec);
    const title = text(values.TitleText || values.SpotlightTitle || values.QuoteText || values.CtaHeadline || scene.TitleText || scene.title, 'scene title', 1000);
    const body = text(values.SubtitleText || values.SpotlightBody || values.AuthorText || scene.SubtitleText || scene.description, 'scene body');
    const narrationText = text(values.NarrationText || scene.NarrationText || narration?.script, 'narration text', 6000);
    const ctaValue = text(values.CtaUrl || scene.CtaUrl, 'CtaUrl', 2048);
    const ctaUrl = ctaValue ? parsePublicUrl(ctaValue).toString() : '';
    const sourceValue = text(scene.sourceUrl || video.sourceUrl, 'sourceUrl', 2048);
    const sourceUrl = sourceValue ? parsePublicUrl(sourceValue).toString() : '';
    const archetype = scene.archetype ?? 'HERO_SPLIT';
    if (!['HERO_SPLIT', 'BROWSER_SPOTLIGHT', 'END_CARD_CTA'].includes(archetype)) {
      throw new ProductionError('Supported scene archetypes are HERO_SPLIT, BROWSER_SPOTLIGHT and END_CARD_CTA.', 'UNSUPPORTED_SCENE_ARCHETYPE', 422);
    }
    const motion = scene.motion ?? video.motion ?? 'zoom-in';
    if (!['none', 'zoom-in', 'zoom-out', 'pan-left'].includes(motion)) {
      throw new ProductionError('Supported scene motion values are none, zoom-in, zoom-out and pan-left.', 'UNSUPPORTED_SCENE_MOTION', 422);
    }
    const picture = await image(scene.screenshotUrl, scope);
    if (!title && !body && !picture && !ctaUrl) throw new ProductionError('Each scene requires real text or an image.', 'EMPTY_SCENE', 400);
    if (narration?.script && !narration.audioUrl) {
      throw new ProductionError('Generate narration audio before exporting a narrated video.', 'NARRATION_AUDIO_REQUIRED', 422);
    }
    if (narration?.audioUrl) {
      const start = narration.startTimeSec === undefined ? cursor : numberInRange(narration.startTimeSec, 'audio startTimeSec', 0, MAX_DURATION);
      tracks.push({ url: text(narration.audioUrl, 'audioUrl', 2048, true), start });
    }
    const background = color(palette.BackgroundPrimary, '#111827');
    const foreground = color(palette.TextPrimary, '#F9FAFB');
    const secondary = color(palette.TextSecondary, '#D1D5DB');
    const accent = color(palette.AccentPrimary, '#FFFFFF');
    const layout = sceneLayout({
      archetype: archetype as SceneArchetype, width, height, title, subtitle: body,
      badge: text(values.BadgeText || values.SectionTitle, 'scene badge', 300), picture,
      ctaLabel: text(values.CtaButtonText || values.CtaLabel, 'CTA label', 300), ctaUrl, sourceUrl,
      caption: timeline.captionsEnabled ? narrationText : '',
      background, foreground, secondary, accent,
    });
    const html = await documentHtml(width, height, layout.style, layout.body);
    frames.push({ html, duration: seconds, motion });
    cursor += seconds;
  }
  numberInRange(cursor, 'total video duration', 0.25, MAX_DURATION);
  return renderFrames(frames, width, height, 'mp4', fps, tracks, scope);
}

export async function renderFlowVideoOrGif(
  input: any, format: 'mp4' | 'gif' = 'mp4', scope?: EngineScope,
): Promise<{ downloadUrl: string; fileSize: string }> {
  requireEngineScope(scope);
  if (!['mp4', 'gif'].includes(format)) throw new ProductionError('Supported flow formats are mp4 and gif.', 'UNSUPPORTED_FORMAT', 400);
  const flow = model(input, 'flow');
  const steps = list(json(flow.stepsJson, 'stepsJson', []), 'steps');
  const design = model(json(flow.designJson, 'designJson', {}), 'design');
  const background = color(design.backgroundColor, '#111827');
  const primary = color(design.primaryColor, '#FFFFFF');
  const frames: Frame[] = [];
  for (const [index, step] of steps.entries()) {
    if (step.mediaType && !['image', 'screenshot', 'chapter'].includes(step.mediaType)) {
      throw new ProductionError('Flow video/audio steps are not supported by this renderer.', 'UNSUPPORTED_STEP_MEDIA', 422);
    }
    const picture = await image(step.mediaUrl || step.imageUrl, scope);
    const title = text(step.title || step.chapter?.title, 'step title', 1000);
    const body = text(step.chapter?.subtitle || step.description, 'step description');
    if (!picture && !title && !body) throw new ProductionError('Each flow step requires text or a captured image.', 'EMPTY_STEP', 400);
    const hotspots = list(step.hotspots || [], 'hotspots', false);
    const points = hotspots.map((hotspot) => {
      const rawX = numberInRange(hotspot.x, 'hotspot x', 0, 100);
      const rawY = numberInRange(hotspot.y, 'hotspot y', 0, 100);
      const x = rawX <= 1 ? rawX * 100 : rawX;
      const y = rawY <= 1 ? rawY * 100 : rawY;
      const tooltip = label(hotspot.tooltipText || hotspot.calloutText);
      return `<div class="point" style="left:${x}%;top:${y}%"><span>●</span>${tooltip ? `<div>${tooltip}</div>` : ''}</div>`;
    }).join('');
    frames.push({
      duration: duration(step.durationSec ?? (step.durationMs === undefined ? undefined : step.durationMs / 1000), flow.stepDurationSec ?? 2.5),
      html: await documentHtml(1280, 720,
        `body{background:${background};color:#F9FAFB;padding:28px;display:flex;flex-direction:column}
header{display:flex;justify-content:space-between;font-size:18px;margin-bottom:16px}.stage{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}
img{height:100%;width:100%;min-height:0}.point{position:absolute;transform:translate(-50%,-50%);color:${primary};font-size:30px}
.point div{font-size:14px;background:#111827;color:#FFFFFF;max-width:260px;padding:12px}h1{font-size:30px;margin:12px 0}p{font-size:18px;white-space:pre-wrap}`,
        `<header class="mono"><span>${label(flow.name)}</span><span>${index + 1}/${steps.length}</span></header><div class="stage">${picture ? `<img src="${picture}" alt="">` : ''}${points}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(body)}</p>`),
    });
  }
  numberInRange(frames.reduce((sum, frame) => sum + frame.duration, 0), 'total duration', 0.25, MAX_DURATION);
  const result = await renderFrames(frames, 1280, 720, format, format === 'gif' ? 10 : 30, [], scope);
  return { downloadUrl: result.fileUrl, fileSize: result.fileSize };
}

export async function renderVisualCardExport(
  input: any, format: 'png' | 'mp4' = 'png', scope?: EngineScope,
): Promise<{ fileUrl: string; fileSize: string; width: number; height: number }> {
  requireEngineScope(scope);
  if (!['png', 'mp4'].includes(format)) throw new ProductionError('Supported visual formats are png and mp4.', 'UNSUPPORTED_FORMAT', 400);
  const visual = model(input, 'visual');
  const width = numberInRange(visual.width ?? 1080, 'width', 300, 1920);
  const height = numberInRange(visual.height ?? 1080, 'height', 200, 1920);
  if (!Number.isInteger(width) || !Number.isInteger(height) || (format === 'mp4' && (width % 2 || height % 2))) {
    throw new ProductionError('Dimensions must be integers; MP4 dimensions must be even.', 'INVALID_DIMENSIONS', 400);
  }
  const headline = text(visual.headline, 'headline', 1000);
  const subheadline = text(visual.subheadline, 'subheadline');
  const picture = await image(visual.screenshotUrl, scope);
  const backgroundImage = await image(visual.backgroundImageUrl, scope);
  if (!headline && !subheadline && !picture && !backgroundImage) {
    throw new ProductionError('A visual needs real text or an image before exporting.', 'EMPTY_VISUAL', 400);
  }
  const html = await documentHtml(width, height,
    `body{background-color:${color(visual.backgroundColor, '#111827')};${backgroundImage ? `background-image:url("${backgroundImage}");background-size:cover;` : ''}
color:${color(visual.headlineColor, '#F9FAFB')};padding:${Math.round(Math.min(width, height) * 0.06)}px;display:flex;flex-direction:column;gap:16px}
h1{font-size:${Math.max(18, width * 0.046)}px;margin:0}p{font-size:${Math.max(12, width * 0.022)}px;line-height:1.4;margin:0;white-space:pre-wrap}
.cta{align-self:flex-start;background:${color(visual.ctaBgColor, '#FFFFFF')};color:${color(visual.ctaTextColor, '#111827')};padding:10px 18px;border-radius:24px}
img{flex:1;min-height:0;width:100%;border-radius:12px}`,
    `${visual.ctaLabel ? `<div class="cta">${label(visual.ctaLabel, 'ctaLabel', 300)}</div>` : ''}<h1>${escapeHtml(headline)}</h1><p>${escapeHtml(subheadline)}</p>${picture ? `<img src="${picture}" alt="">` : ''}`);
  if (format === 'mp4') {
    return { ...await renderFrames([{ html, duration: duration(visual.durationSec, 4) }], width, height, 'mp4', 30, [], scope), width, height };
  }
  const job = await createJob(scope);
  let browser: Browser | undefined;
  try {
    const opened = await openPage(width, height);
    browser = opened.browser;
    const output = path.join(job.directory, 'export.png');
    await screenshot(opened.page, html, output);
    const fileSize = await outputSize(output);
    const fileUrl = await job.publish('export.png');
    await job.cleanup();
    return { fileUrl, fileSize, width, height };
  } catch (error) {
    await job.cleanup();
    throw renderError(error);
  } finally { await browser?.close().catch(() => undefined); }
}
