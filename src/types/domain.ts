export type FlowStepType = 'IMAGE' | 'VIDEO' | 'CHAPTER';

export interface HotspotOverlay {
  id: string;
  x: number; // [0..1]
  y: number; // [0..1]
  style: 'beacon' | 'highlight' | 'invisible';
  color: string;
  tooltipText: string;
  tooltipPosition: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  trigger: 'click' | 'hover';
  targetType: 'next_step' | 'specific_step' | 'external_url';
  targetStepId?: string;
  targetUrl?: string;
  autoplayDelayMs?: number;
}

export interface CalloutOverlay {
  id: string;
  x: number; // [0..1]
  y: number; // [0..1]
  title: string;
  body: string;
  theme: 'light' | 'dark' | 'brand';
  pointerDirection: 'none' | 'top' | 'bottom' | 'left' | 'right';
  showNavButtons: boolean;
  primaryButtonLabel: string;
}

export interface AreaOverlay {
  id: string;
  mode: 'blur' | 'highlight' | 'crop';
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export interface PanAndZoomConfig {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface StepVoiceoverConfig {
  enabled: boolean;
  script: string;
  voiceId: string;
  speed: number;
  audioUrl?: string;
  durationSec?: number;
}

export interface ChapterButtonItem {
  id: string;
  label: string;
  variant: 'primary' | 'secondary';
  action: 'next_step' | 'jump_to_step' | 'external_url' | 'replay';
  targetStepId?: string;
  targetUrl?: string;
}

export interface ChapterFormField {
  id: string;
  key: 'email' | 'fullName' | 'company' | 'role';
  label: string;
  placeholder: string;
  required: boolean;
}

export interface ChapterConfig {
  title: string;
  subtitle: string;
  alignment: 'center' | 'left';
  backgroundStyle: 'blur_step' | 'solid' | 'gradient' | 'brand_image';
  backgroundValue: string;
  showLogo: boolean;
  interactionMode: 'buttons' | 'form';
  buttons: ChapterButtonItem[];
  formFields: ChapterFormField[];
  formSubmitLabel: string;
  allowSkipForm: boolean;
}

export interface FlowStep {
  id: string;
  order: number;
  type: FlowStepType;
  title: string;
  mediaUrl?: string;
  mediaWidth: number;
  mediaHeight: number;
  trimStartSec?: number;
  trimEndSec?: number;
  playbackRate?: number;
  muted?: boolean;
  hotspots: HotspotOverlay[];
  callouts: CalloutOverlay[];
  areas: AreaOverlay[];
  panAndZoom: PanAndZoomConfig;
  voiceover: StepVoiceoverConfig;
  chapter?: ChapterConfig;
}

export interface FlowDesignConfig {
  wrapperStyle: 'browser_light' | 'browser_dark' | 'none';
  backgroundType: 'gradient' | 'solid' | 'brand_image';
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  shadow: 'none' | 'sm' | 'md' | 'xl';
  cursorStyle: 'default' | 'pointer_ring' | 'brand_dot';
  showProgressBar: boolean;
  showWatermark: boolean;
  watermarkText: string;
  primaryColor: string;
}

export type VideoSceneArchetype =
  | 'HERO_SPLIT'
  | 'METRIC_BENTO'
  | 'BROWSER_SPOTLIGHT'
  | 'FEATURE_CARDS'
  | 'KINETIC_STATEMENT'
  | 'END_CARD_CTA';

export interface DesignSchemaColorField {
  key: 'BackgroundPrimary' | 'BackgroundSecondary' | 'TextPrimary' | 'TextSecondary' | 'AccentPrimary' | 'AccentSecondary';
  label: string;
  defaultHex: string;
}

export interface DesignSchemaSceneField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'image';
}

export interface PromptVideoDesignSchema {
  colors: DesignSchemaColorField[];
  scenes: Array<{
    sceneId: string;
    sceneNumber: number;
    title: string;
    archetype: VideoSceneArchetype;
    fields: DesignSchemaSceneField[];
  }>;
}

export interface PromptVideoDesignValues {
  colors: Record<string, string>;
  scenes: Record<string, Record<string, string>>;
}

export interface NlePanZoomItem {
  id: string;
  sceneId: string;
  startSec: number;
  endSec: number;
  scale: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
}

export interface NleVoiceoverItem {
  id: string;
  sceneId: string;
  sceneNumber: number;
  startSec: number;
  endSec: number;
  script: string;
  voiceId: string;
  voiceName: string;
  speed: number;
  volume: number;
  audioUrl: string;
}

export interface NleSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  archetype: VideoSceneArchetype;
  startSec: number;
  durationSec: number;
  screenshotUrl?: string;
}

export interface NleMusicItem {
  id: string;
  trackName: string;
  genre: string;
  startSec: number;
  durationSec: number;
  volume: number;
  audioUrl: string;
}

export interface NleSfxItem {
  id: string;
  effectType: 'Whoosh' | 'Click' | 'Pop' | 'Chime' | 'Swoosh' | 'Riser';
  startSec: number;
  durationSec: number;
  volume: number;
  audioUrl: string;
}

export interface VideoTimeline {
  totalDurationSec: number;
  fps: number;
  panZoomTrack: NlePanZoomItem[];
  voiceoverTrack: NleVoiceoverItem[];
  scenesTrack: NleSceneItem[];
  musicTrack: NleMusicItem[];
  sfxTrack: NleSfxItem[];
}

export interface VisualCanvasItem {
  id: string;
  presetId: string;
  platform: string;
  presetName: string;
  width: number;
  height: number;
  templateId: 'capture' | 'spotlight' | 'split' | 'minimal' | 'bento';
  isAnimated: boolean;
  showLogo: boolean;
  backgroundType: 'image' | 'color';
  backgroundImageUrl: string;
  backgroundColor: string;
  headline: string;
  subheadline: string;
  headlineColor: string;
  ctaLabel: string;
  ctaBgColor: string;
  ctaTextColor: string;
  showShadows: boolean;
  screenshotUrl: string;
}

export const ELEVENLABS_VOICES = [
  { id: 'ava-natural', name: 'Ava', style: 'Natural, Warm American Female', tone: 'Natural, Warm American Female', accent: 'US' },
  { id: 'marcus-exec', name: 'Marcus', style: 'Confident, Executive Baritone', tone: 'Confident, Executive Baritone', accent: 'US' },
  { id: 'elena-crisp', name: 'Elena', style: 'Crisp, Product Storyteller', tone: 'Crisp, Product Storyteller', accent: 'UK' },
  { id: 'liam-tech', name: 'Liam', style: 'Modern Tech Launch Narrator', tone: 'Modern Tech Launch Narrator', accent: 'US' },
  { id: 'sophia-bright', name: 'Sophia', style: 'Upbeat Growth Marketing', tone: 'Upbeat Growth Marketing', accent: 'US' },
  { id: 'noah-calm', name: 'Noah', style: 'Calm Documentation & Guide', tone: 'Calm Documentation & Guide', accent: 'CA' },
  { id: 'chloe-au', name: 'Chloe', style: 'Friendly SaaS Onboarding', tone: 'Friendly SaaS Onboarding', accent: 'AU' },
  { id: 'mateo-intl', name: 'Mateo', style: 'Global Enterprise Presenter', tone: 'Global Enterprise Presenter', accent: 'ES' },
  { id: 'aria-studio', name: 'Aria', style: 'Broadcast Commercial Lead', tone: 'Broadcast Commercial Lead', accent: 'US' },
  { id: 'julian-deep', name: 'Julian', style: 'Cinematic Trailer Voice', tone: 'Cinematic Trailer Voice', accent: 'UK' },
] as const;

export const TRANSLATION_LOCALES = [
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh-CN', name: 'Chinese Simplified (简体中文)' },
  { code: 'zh-TW', name: 'Chinese Traditional (繁體中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'sv', name: 'Swedish (Svenska)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
] as const;

export const VISUAL_SIZE_PRESETS = [
  // LinkedIn (8)
  { id: 'li-ad-sq', platform: 'LinkedIn', name: 'Ad square', width: 1200, height: 1200 },
  { id: 'li-ad-land', platform: 'LinkedIn', name: 'Ad landscape', width: 1200, height: 628 },
  { id: 'li-ad-port', platform: 'LinkedIn', name: 'Ad portrait', width: 720, height: 900 },
  { id: 'li-post-sq', platform: 'LinkedIn', name: 'Post square', width: 1080, height: 1080 },
  { id: 'li-post-land', platform: 'LinkedIn', name: 'Post landscape', width: 1200, height: 626 },
  { id: 'li-post-port', platform: 'LinkedIn', name: 'Post portrait', width: 626, height: 1200 },
  { id: 'li-banner-prof', platform: 'LinkedIn', name: 'Profile banner', width: 1584, height: 396 },
  { id: 'li-banner-art', platform: 'LinkedIn', name: 'Article banner', width: 1920, height: 1080 },
  // Facebook (5)
  { id: 'fb-ad-sq', platform: 'Facebook', name: 'Ad square', width: 1440, height: 1440 },
  { id: 'fb-ad-port', platform: 'Facebook', name: 'Ad portrait', width: 1440, height: 1800 },
  { id: 'fb-post', platform: 'Facebook', name: 'Post', width: 1200, height: 630 },
  { id: 'fb-stories', platform: 'Facebook', name: 'Stories', width: 1080, height: 1920 },
  { id: 'fb-cover', platform: 'Facebook', name: 'Cover', width: 851, height: 315 },
  // Instagram (5)
  { id: 'ig-ad', platform: 'Instagram', name: 'Ad', width: 1440, height: 1440 },
  { id: 'ig-post-sq', platform: 'Instagram', name: 'Post square', width: 1080, height: 1080 },
  { id: 'ig-post-port', platform: 'Instagram', name: 'Post portrait', width: 1080, height: 1350 },
  { id: 'ig-stories', platform: 'Instagram', name: 'Stories', width: 1080, height: 1920 },
  { id: 'ig-reels', platform: 'Instagram', name: 'Reels', width: 1080, height: 1920 },
  // X (2)
  { id: 'x-post', platform: 'X', name: 'Post', width: 1200, height: 675 },
  { id: 'x-banner', platform: 'X', name: 'Banner', width: 1500, height: 500 },
  // TikTok (1)
  { id: 'tt-post', platform: 'TikTok', name: 'Post', width: 1080, height: 1920 },
  // YouTube (2)
  { id: 'yt-shorts', platform: 'YouTube', name: 'Shorts', width: 1080, height: 1920 },
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720 },
  // Google Ads (5)
  { id: 'ga-leader', platform: 'Google Ads', name: 'Leaderboard', width: 728, height: 90 },
  { id: 'ga-lg-rect', platform: 'Google Ads', name: 'Large rectangle', width: 336, height: 280 },
  { id: 'ga-md-rect', platform: 'Google Ads', name: 'Medium rectangle', width: 300, height: 250 },
  { id: 'ga-mob-ban', platform: 'Google Ads', name: 'Mobile banner', width: 300, height: 50 },
  { id: 'ga-sky', platform: 'Google Ads', name: 'Wide skyscraper', width: 160, height: 600 },
] as const;

export const VISUAL_TEMPLATES = [
  { id: 'split-feature-spotlight', name: 'Split Feature Spotlight', description: '50/50 split with bold headline & 3D device frame' },
  { id: 'centered-glass-hero', name: 'Centered Glassmorphic Hero', description: 'Floating glassmorphic browser over brand gradient' },
  { id: 'dark-exec-monolith', name: 'Dark Executive Monolith', description: 'High-contrast luxury gold & obsidian layout' },
  { id: 'perspective-showcase', name: '3D Perspective Browser Showcase', description: 'Angled perspective screenshot with callout pill' },
  { id: 'metric-testimonial-card', name: 'Metric & Authority Card', description: 'Highlights verified badges and metric counters' },
] as const;

export const VISUAL_LAYOUT_TEMPLATES = VISUAL_TEMPLATES;

export const BACKGROUND_MUSIC_TRACKS = [
  { id: 'cybernetic-horizon', name: 'Cybernetic Horizon', bpm: 122, genre: 'Electronic Launch' },
  { id: 'executive-pulse', name: 'Executive Pulse', bpm: 110, genre: 'Ambient Corporate' },
  { id: 'neural-momentum', name: 'Neural Momentum', bpm: 128, genre: 'Upbeat SaaS' },
] as const;

export const SFX_LIBRARY = [
  { id: 'whoosh', name: 'Cinematic Whoosh' },
  { id: 'chime', name: 'Glass Shimmer Chime' },
  { id: 'impact', name: 'Sub Bass Impact' },
  { id: 'click', name: 'Tactile UI Click' },
] as const;
