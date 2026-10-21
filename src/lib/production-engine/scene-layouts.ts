import { ProductionError } from './errors';

export type SceneArchetype = 'HERO_SPLIT' | 'BROWSER_SPOTLIGHT' | 'END_CARD_CTA';
export interface SceneLayout {
  archetype: SceneArchetype;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  badge: string;
  picture: string;
  ctaLabel: string;
  ctaUrl: string;
  sourceUrl: string;
  caption: string;
  background: string;
  foreground: string;
  secondary: string;
  accent: string;
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

// All text is escaped here; image data and colors are validated by the renderer.
export function sceneLayout(input: SceneLayout): { style: string; body: string } {
  const { width, height, background, foreground, secondary, accent } = input;
  const compact = height >= width;
  const unit = Math.min(width, height);
  const image = input.picture ? `<img src="${input.picture}" alt="">` : '';
  const badge = input.badge ? `<div class="badge mono">${escape(input.badge)}</div>` : '';
  const title = input.title ? `<h1>${escape(input.title)}</h1>` : '';
  const subtitle = input.subtitle ? `<p class="subtitle">${escape(input.subtitle)}</p>` : '';
  const cta = input.ctaLabel || input.ctaUrl
    ? `<div class="cta">${escape(input.ctaLabel || input.ctaUrl)}</div>${input.ctaLabel && input.ctaUrl ? `<div class="destination mono">${escape(input.ctaUrl)}</div>` : ''}` : '';
  const caption = input.caption ? `<footer class="caption">${escape(input.caption)}</footer>` : '';
  const base = `body{background:${background};color:${foreground};padding:${unit * 0.065}px;display:flex;flex-direction:column;gap:${unit * 0.025}px}
h1{font-size:${unit * (compact ? 0.075 : 0.083)}px;font-weight:750;line-height:1.08;letter-spacing:-.045em;margin:0;white-space:pre-wrap}
.subtitle{font-size:${unit * 0.031}px;line-height:1.48;color:${secondary};margin:0;white-space:pre-wrap}
.badge{color:${accent};font-size:${unit * 0.018}px;letter-spacing:.08em;text-transform:uppercase}
.cta{display:inline-block;align-self:flex-start;max-width:100%;padding:${unit * 0.02}px ${unit * 0.035}px;background:${accent};color:${background};font-size:${unit * 0.027}px;border-radius:${unit * 0.015}px;overflow-wrap:anywhere}
.destination{color:${secondary};font-size:${unit * 0.018}px;overflow-wrap:anywhere}
.caption{font-size:${unit * 0.023}px;line-height:1.35;color:${foreground};background:${background};padding:${unit * 0.015}px;text-align:center}
main{flex:1;min-height:0}img{width:100%;height:100%;min-height:0;object-fit:contain}`;

  if (input.archetype === 'HERO_SPLIT') {
    return {
      style: `${base}.hero{display:grid;grid-template-columns:${input.picture && !compact ? '1fr 1.08fr' : '1fr'};${input.picture && compact ? 'grid-template-rows:1fr 1fr;' : ''}gap:${unit * 0.055}px;align-items:center}
.copy{display:flex;flex-direction:column;gap:${unit * 0.035}px;min-width:0}.hero-media{height:${compact ? '100%' : '78%'};min-height:0;border:1px solid ${accent};border-radius:${unit * 0.025}px;padding:${unit * 0.015}px;overflow:hidden}`,
      body: `${badge}<main class="hero" data-layout="HERO_SPLIT"><section class="copy">${title}${subtitle}${cta}</section>${image ? `<section class="hero-media">${image}</section>` : ''}</main>${caption}`,
    };
  }
  if (input.archetype === 'BROWSER_SPOTLIGHT') {
    if (!input.picture) {
      throw new ProductionError('BROWSER_SPOTLIGHT scenes require a real captured screenshotUrl.', 'SCENE_IMAGE_REQUIRED', 422);
    }
    return {
      style: `${base}.spotlight{display:flex;flex-direction:column;gap:${unit * 0.035}px;text-align:center}
.spotlight h1{font-size:${unit * 0.067}px}.spotlight-copy{display:flex;flex-direction:column;gap:${unit * 0.02}px}
.browser{flex:1;min-height:0;display:flex;flex-direction:column;border:1px solid ${accent};border-radius:${unit * 0.022}px;overflow:hidden;background:${background}}
.browser-bar{display:flex;align-items:center;gap:${unit * 0.015}px;padding:${unit * 0.018}px;border-bottom:1px solid ${secondary};font-size:${unit * 0.018}px;color:${secondary}}
.browser-controls{display:flex;gap:6px}.browser-controls i{width:8px;height:8px;border-radius:50%;border:1px solid currentColor}
.browser-address{flex:1;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.browser-shot{flex:1;min-height:0}`,
      body: `${badge}<main class="spotlight" data-layout="BROWSER_SPOTLIGHT"><section class="spotlight-copy">${title}${subtitle}</section><section class="browser"><div class="browser-bar mono"><span class="browser-controls" aria-hidden="true"><i></i><i></i><i></i></span><span class="browser-address">${escape(input.sourceUrl)}</span></div><div class="browser-shot">${image}</div></section></main>${caption}`,
    };
  }
  if (input.archetype === 'END_CARD_CTA') {
    return {
      style: `${base}.end-card{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:${unit * 0.035}px}
.end-card .cta{align-self:center;margin-top:${unit * 0.025}px}.end-card h1{font-size:${unit * 0.1}px;max-width:95%}
.end-copy{display:flex;flex-direction:column;align-items:center;gap:${unit * 0.035}px;position:relative;z-index:1}
.end-shot{width:${compact ? '78%' : '42%'};height:22%;min-height:0;border:1px solid ${accent};border-radius:${unit * 0.018}px;overflow:hidden}`,
      body: `${badge}<main class="end-card" data-layout="END_CARD_CTA"><section class="end-copy">${title}${subtitle}${cta}</section>${image ? `<section class="end-shot">${image}</section>` : ''}</main>${caption}`,
    };
  }
  throw new ProductionError('Unsupported scene archetype.', 'UNSUPPORTED_SCENE_ARCHETYPE', 422);
}
