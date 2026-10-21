import type { FlowStep, VisualCanvasItem } from '@/types/domain';

export const defaultDesign = {
  wrapperStyle: 'browser_light', backgroundType: 'solid', backgroundColor: '#eae7de',
  padding: 24, borderRadius: 12, shadow: 'md', cursorStyle: 'default',
  showProgressBar: true, showWatermark: false, watermarkText: '', primaryColor: '#bd5535',
} as const;

export function blankStep(order: number, chapter = false): FlowStep {
  return {
    id: crypto.randomUUID(), order, type: chapter ? 'CHAPTER' : 'IMAGE',
    title: chapter ? 'New chapter' : `Step ${order + 1}`, mediaWidth: 1440, mediaHeight: 900,
    hotspots: [], callouts: [], areas: [],
    panAndZoom: { enabled: false, x: 0, y: 0, width: 1, height: 1, scale: 1 },
    voiceover: { enabled: false, script: '', voiceId: 'ava-natural', speed: 1 },
    ...(chapter ? { chapter: {
      title: 'New chapter', subtitle: '', alignment: 'center' as const,
      backgroundStyle: 'solid' as const, backgroundValue: '#262722', showLogo: false,
      interactionMode: 'buttons' as const, buttons: [], formFields: [],
      formSubmitLabel: 'Continue', allowSkipForm: true,
    } } : {}),
  };
}

type CapturedPage = { title: string; url: string; hotspot?: { x: number; y: number; tooltipText: string } };
export function capturedSteps(screenshots: CapturedPage[], offset = 0): FlowStep[] {
  return screenshots.map((shot, index) => ({
    ...blankStep(index + offset), title: shot.title, mediaUrl: shot.url,
    hotspots: shot.hotspot ? [{
      id: crypto.randomUUID(), ...shot.hotspot, style: 'beacon', color: '#bd5535',
      tooltipPosition: 'bottom', trigger: 'click', targetType: 'next_step',
    }] : [],
  }));
}

export function blankVisual(headline = '', screenshotUrl = ''): VisualCanvasItem {
  return {
    id: crypto.randomUUID(), presetId: 'li-post-land', platform: 'LinkedIn', presetName: 'Post landscape',
    width: 1200, height: 626, templateId: 'capture', isAnimated: false, showLogo: false,
    backgroundType: 'color', backgroundImageUrl: '', backgroundColor: '#252620',
    headline, subheadline: '', headlineColor: '#faf8ef', ctaLabel: '',
    ctaBgColor: '#df7452', ctaTextColor: '#ffffff', showShadows: true, screenshotUrl,
  };
}
