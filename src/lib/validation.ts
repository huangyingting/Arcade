import { HttpError, text } from '@/lib/api';
import { validateContent } from '@/lib/assets';

function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Expected an object.');
}
function list(value: unknown, max = 100): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new HttpError(400, `Expected a list with at most ${max} items.`);
}
function finite(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new HttpError(400, `${label} must be between ${min} and ${max}.`);
}
function color(value: unknown) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new HttpError(400, 'Colors must use six-digit hexadecimal values.');
}
function choice(value: unknown, allowed: readonly string[]) {
  if (typeof value !== 'string' || !allowed.includes(value)) throw new HttpError(400, 'Invalid content option.');
}
function uniqueIds(items: unknown[], key = 'id') {
  const seen = new Set<string>();
  for (const item of items) {
    object(item); const id = text(item[key], 'Item ID', 100);
    if (seen.has(id)) throw new HttpError(400, 'Item IDs must be unique.');
    seen.add(id);
  }
}
export function validateSteps(value: unknown, workspaceId: string, publishing = false) {
  const serialized = validateContent(value, workspaceId, 'array');
  list(value); uniqueIds(value);
  if (publishing && !value.length) throw new HttpError(400, 'Add at least one step before publishing.');
  const ids = new Set(value.map((step) => { object(step); return step.id; }));
  for (const step of value) {
    object(step);
    text(step.title, 'Step title', 300);
    choice(step.type, ['IMAGE', 'VIDEO', 'CHAPTER']);
    finite(step.mediaWidth, 'Media width', 1, 16000); finite(step.mediaHeight, 'Media height', 1, 16000);
    if (publishing && step.type !== 'CHAPTER' && !step.mediaUrl) throw new HttpError(400, 'Every image or video step needs media before publication.');
    for (const key of ['hotspots', 'callouts', 'areas']) { list(step[key], 50); uniqueIds(step[key]); }
    for (const overlay of [...step.hotspots as unknown[], ...step.callouts as unknown[], ...step.areas as unknown[]]) {
      object(overlay); finite(overlay.x, 'Position', 0, 1); finite(overlay.y, 'Position', 0, 1);
      if ('tooltipText' in overlay) text(overlay.tooltipText, 'Tooltip', 1000, false);
      if ('title' in overlay) text(overlay.title, 'Callout title', 300, false);
      if ('body' in overlay) text(overlay.body, 'Callout copy', 2000, false);
      if ('color' in overlay && overlay.color) color(overlay.color);
      if (overlay.targetType === 'specific_step' && !ids.has(overlay.targetStepId)) throw new HttpError(400, 'Hotspot destination does not exist.');
    }
    object(step.voiceover); text(step.voiceover.script, 'Narration script', 10000, false); finite(step.voiceover.speed, 'Narration speed', 0.5, 2);
    if (step.type === 'CHAPTER') {
      object(step.chapter); text(step.chapter.title, 'Chapter title', 300); text(step.chapter.subtitle, 'Chapter subtitle', 2000, false);
      choice(step.chapter.interactionMode, ['buttons', 'form']); color(step.chapter.backgroundValue);
      list(step.chapter.buttons, 10); list(step.chapter.formFields, 4);
      for (const button of step.chapter.buttons) {
        object(button); text(button.label, 'Button label', 100);
        choice(button.action, ['next_step', 'jump_to_step', 'external_url', 'replay']);
        if (button.action === 'jump_to_step' && !ids.has(button.targetStepId)) throw new HttpError(400, 'Chapter destination does not exist.');
        if (button.action === 'external_url' && !button.targetUrl) throw new HttpError(400, 'Enter a destination URL.');
      }
      const keys = new Set();
      for (const field of step.chapter.formFields) {
        object(field); choice(field.key, ['email', 'fullName', 'company', 'role']); text(field.label, 'Form field label', 100);
        if (keys.has(field.key)) throw new HttpError(400, 'Form fields must be unique.');
        keys.add(field.key);
      }
    }
  }
  return serialized;
}

export function validateDesign(value: unknown, workspaceId: string) {
  const serialized = validateContent(value, workspaceId);
  object(value); color(value.backgroundColor); color(value.primaryColor);
  finite(value.padding, 'Canvas padding', 0, 64); finite(value.borderRadius, 'Corner radius', 0, 64);
  text(value.watermarkText, 'Watermark', 150, false);
  return serialized;
}

export function validateVisuals(value: unknown, workspaceId: string) {
  const serialized = validateContent(value, workspaceId, 'array');
  list(value, 40); uniqueIds(value);
  for (const visual of value) {
    object(visual);
    finite(visual.width, 'Canvas width', 200, 4096); finite(visual.height, 'Canvas height', 200, 4096);
    if (!Number.isInteger(visual.width) || !Number.isInteger(visual.height)) throw new HttpError(400, 'Canvas dimensions must be whole pixels.');
    for (const key of ['backgroundColor', 'headlineColor', 'ctaBgColor', 'ctaTextColor']) color(visual[key]);
    text(visual.headline, 'Headline', 300, false); text(visual.subheadline, 'Supporting copy', 1000, false); text(visual.ctaLabel, 'CTA', 100, false);
  }
  return serialized;
}

export function validateVideo(scenes: unknown, values: unknown, timeline: unknown, workspaceId: string) {
  validateContent(scenes, workspaceId, 'array'); validateContent(values, workspaceId); validateContent(timeline, workspaceId);
  list(scenes, 20); uniqueIds(scenes, 'sceneId'); object(values); object(values.colors); object(values.scenes); object(timeline);
  for (const hex of Object.values(values.colors)) color(hex);
  if (!scenes.length) throw new HttpError(400, 'A video needs at least one scene.');
  let total = 0;
  for (const scene of scenes) {
    object(scene); const id = text(scene.sceneId, 'Scene ID', 100);
    finite(scene.durationSec, 'Scene duration', 0.25, 120); total += Number(scene.durationSec);
    choice(scene.archetype, ['HERO_SPLIT', 'BROWSER_SPOTLIGHT', 'END_CARD_CTA', 'METRIC_BENTO', 'FEATURE_CARDS', 'KINETIC_STATEMENT']);
    object(values.scenes[id]);
    for (const [key, field] of Object.entries(values.scenes[id])) text(field, key, 3000, false);
  }
  if (total > 300) throw new HttpError(400, 'Videos cannot exceed five minutes.');
  finite(timeline.totalDurationSec, 'Timeline duration', 1, 300);
  if (Math.abs(total - Number(timeline.totalDurationSec)) > 0.1) throw new HttpError(400, 'Scene durations must match the timeline duration.');
  for (const track of ['scenesTrack', 'voiceoverTrack', 'musicTrack', 'sfxTrack', 'panZoomTrack']) list(timeline[track], 100);
  uniqueIds(timeline.scenesTrack as unknown[]);
  const ids = new Set(scenes.map((s) => { object(s); return s.sceneId; }));
  let expectedStart = 0;
  for (const [i, clip] of (timeline.scenesTrack as unknown[]).entries()) {
    object(clip); object(scenes[i]);
    if (!ids.has(clip.id) || clip.id !== scenes[i].sceneId) throw new HttpError(400, 'Timeline scenes must match scene order.');
    finite(clip.startSec, 'Scene start', 0, total); finite(clip.durationSec, 'Scene duration', 0.25, 120);
    if (Math.abs(Number(clip.startSec) - expectedStart) > 0.1 || Math.abs(Number(clip.durationSec) - Number(scenes[i].durationSec)) > 0.1) throw new HttpError(400, 'Timeline scene timing is inconsistent.');
    expectedStart += Number(clip.durationSec);
  }
  if ((timeline.scenesTrack as unknown[]).length !== scenes.length) throw new HttpError(400, 'Every scene needs a timeline clip.');
  for (const clip of [...timeline.voiceoverTrack as unknown[], ...timeline.musicTrack as unknown[], ...timeline.sfxTrack as unknown[]]) {
    object(clip); finite(clip.startSec, 'Audio start', 0, total); finite(clip.volume, 'Audio volume', 0, 1);
    if (!clip.audioUrl) throw new HttpError(400, 'Audio tracks need an uploaded audio file.');
  }
}
