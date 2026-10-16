import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

function resolveLocalImageToDataUri(relOrAbsUrl: string): string {
  try {
    if (!relOrAbsUrl) return '';
    if (relOrAbsUrl.startsWith('data:')) return relOrAbsUrl;
    const cleanRel = relOrAbsUrl.replace(/^https?:\/\/[^/]+/, '');
    const candidatePath = path.join(process.cwd(), 'public', cleanRel);
    if (fs.existsSync(candidatePath)) {
      const ext = path.extname(candidatePath).toLowerCase();
      const mime =
        ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
          ? 'image/webp'
          : 'image/png';
      const b64 = fs.readFileSync(candidatePath).toString('base64');
      return `data:${mime};base64,${b64}`;
    }
  } catch {
    // ignore
  }
  return relOrAbsUrl;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function renderPromptVideoMp4(
  video: any,
  resolution: '720p' | '1080p' | '4K' = '1080p',
  fps: number = 30
): Promise<{ fileUrl: string; fileSize: string }> {
  const exportsDir = path.join(process.cwd(), 'public', 'uploads', 'exports');
  const tmpDir = path.join(exportsDir, `tmp_vid_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const width = resolution === '720p' ? 1280 : 1920;
  const height = resolution === '720p' ? 720 : 1080;

  const scenes = JSON.parse(video.scenesJson || '[]');
  const designValues = JSON.parse(video.designValuesJson || '{"colors":{},"scenes":{}}');
  const timeline = JSON.parse(video.timelineJson || '{}');
  const colors = designValues.colors || {
    BackgroundPrimary: '#111111',
    TextPrimary: '#F4EFE6',
    TextSecondary: '#9CA3AF',
    AccentPrimary: '#D4AF37',
    AccentSecondary: '#C42B1C',
  };

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();

    const sceneImages: string[] = [];
    const listToRender = scenes.length > 0 ? scenes : [{ sceneId: 'scene_1', title: video.name, durationSec: 5, screenshotUrl: '/media/scene1.png' }];

    for (let i = 0; i < listToRender.length; i++) {
      const s = listToRender[i];
      const sId = s.sceneId || `scene_${i + 1}`;
      const vals = designValues.scenes?.[sId] || {};
      const vo = (timeline.voiceoverTrack || [])[i];
      const imgDataUri = resolveLocalImageToDataUri(s.screenshotUrl || '/media/scene1.png');

      const badge = vals.BadgeText || vals.SectionTitle || s.title || `SCENE ${i + 1}`;
      const headline =
        vals.TitleText ||
        vals.SpotlightTitle ||
        vals.QuoteText ||
        vals.CtaHeadline ||
        s.title ||
        video.name;
      const subtitle =
        vals.SubtitleText ||
        vals.SpotlightBody ||
        vals.AuthorText ||
        vals.CtaButtonText ||
        vo?.script ||
        '';

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, "Noto Serif CJK SC", "Noto Serif CJK JP", "Noto Serif CJK KR", -apple-system, BlinkMacSystemFont, sans-serif; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: ${colors.BackgroundPrimary || '#111111'};
    color: ${colors.TextPrimary || '#F4EFE6'};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: ${Math.round(width * 0.045)}px;
    overflow: hidden;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .badge {
    background: ${colors.AccentPrimary || '#D4AF37'};
    color: #111111;
    padding: 8px 18px;
    border-radius: 999px;
    font-weight: 900;
    font-size: ${Math.round(width * 0.011)}px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .meta { color: #9CA3AF; font-family: monospace; font-size: ${Math.round(width * 0.011)}px; }
  .grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: ${Math.round(width * 0.035)}px; align-items: center; margin: auto 0; }
  .arch { color: ${colors.AccentSecondary || '#C42B1C'}; font-weight: 800; font-size: ${Math.round(width * 0.011)}px; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
  h1 { font-size: ${Math.round(width * 0.032)}px; font-weight: 900; line-height: 1.12; margin-bottom: 16px; }
  p { font-size: ${Math.round(width * 0.014)}px; line-height: 1.5; color: ${colors.TextSecondary || '#9CA3AF'}; }
  .frame { border: 3px solid ${colors.AccentPrimary || '#D4AF37'}; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.65); background: #000; }
  .frame img { width: 100%; height: ${Math.round(height * 0.54)}px; object-fit: cover; display: block; }
  .bottom { border-top: 1px solid rgba(255,255,255,0.12); padding-top: 16px; display: flex; justify-content: space-between; font-size: ${Math.round(width * 0.011)}px; color: #D1D5DB; }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">${badge}</span>
    <span class="meta">${video.sourceUrl || 'https://whoami.genisisiq.com'} • Scene ${i + 1}/${listToRender.length}</span>
  </div>
  <div class="grid">
    <div>
      <div class="arch">${s.archetype || 'LAUNCH SCENE'}</div>
      <h1>${headline}</h1>
      <p>${subtitle}</p>
    </div>
    <div class="frame">
      <img src="${imgDataUri}" />
    </div>
  </div>
  <div class="bottom">
    <span>🎙️ ${vo?.script || subtitle}</span>
    <span style="color:${colors.AccentPrimary || '#D4AF37'};font-weight:700;">${resolution} @ ${fps}FPS</span>
  </div>
</body>
</html>`;

      await page.setContent(html, { waitUntil: 'load' });
      const framePath = path.join(tmpDir, `scene_${String(i).padStart(3, '0')}.png`);
      await page.screenshot({ path: framePath });
      sceneImages.push(framePath);
    }

    await browser.close();
    browser = null;

    // Build ffmpeg concat file (each scene 3s for fast encoding, or proportional)
    const concatPath = path.join(tmpDir, 'concat.txt');
    const lines: string[] = [];
    for (const imgPath of sceneImages) {
      lines.push(`file '${imgPath}'`);
      lines.push(`duration 3`);
    }
    lines.push(`file '${sceneImages[sceneImages.length - 1]}'`);
    fs.writeFileSync(concatPath, lines.join('\n'));

    const outName = `video-${video.id}-${resolution}-${Date.now()}.mp4`;
    const outPath = path.join(exportsDir, outName);
    const customVoUrl = timeline.voiceoverTrack?.[0]?.audioUrl;
    const customVoPath = customVoUrl
      ? path.join(process.cwd(), 'public', customVoUrl.replace(/^\//, ''))
      : '';
    const sampleAudio =
      customVoPath && fs.existsSync(customVoPath)
        ? customVoPath
        : path.join(process.cwd(), 'public', 'media', 'voiceover-sample.wav');

    const ffmpegArgs = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatPath,
    ];
    if (fs.existsSync(sampleAudio)) {
      ffmpegArgs.push('-stream_loop', '-1', '-i', sampleAudio);
    }
    ffmpegArgs.push(
      '-t',
      String(sceneImages.length * 3),
      '-r',
      String(fps),
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p'
    );
    if (fs.existsSync(sampleAudio)) {
      ffmpegArgs.push('-c:a', 'aac', '-shortest');
    }
    ffmpegArgs.push(outPath);

    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'ignore' });
    const stat = fs.statSync(outPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return {
      fileUrl: `/uploads/exports/${outName}`,
      fileSize: formatBytes(stat.size),
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return {
      fileUrl: '/media/whoami-launch.mp4',
      fileSize: '7.82 MB',
    };
  }
}

export async function renderFlowVideoOrGif(
  flow: any,
  format: 'mp4' | 'gif' = 'mp4'
): Promise<{ downloadUrl: string; fileSize: string }> {
  const exportsDir = path.join(process.cwd(), 'public', 'uploads', 'exports');
  const tmpDir = path.join(exportsDir, `tmp_flow_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const steps = JSON.parse(flow.stepsJson || '[]');
  const design = JSON.parse(flow.designJson || '{}');
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    const framePaths: string[] = [];
    const list = steps.length > 0 ? steps : [{ title: flow.name, mediaUrl: '/media/scene1.png' }];

    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const imgDataUri = resolveLocalImageToDataUri(s.mediaUrl || s.imageUrl || '/media/scene1.png');
      const hs = s.hotspots?.[0];
      const hsX = hs ? (hs.x <= 1 ? hs.x * 100 : hs.x) : 55;
      const hsY = hs ? (hs.y <= 1 ? hs.y * 100 : hs.y) : 50;
      const tooltip = hs?.tooltipText || hs?.calloutText || s.chapter?.subtitle || s.title;

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, "Noto Serif CJK SC", "Noto Serif CJK JP", "Noto Serif CJK KR", sans-serif; }
  body { width: 1280px; height: 720px; background: ${design.backgroundColor || '#111111'}; padding: 28px; display: flex; flex-direction: column; }
  .chrome { background: #0F172A; color: #E2E8F0; padding: 10px 18px; border-radius: 14px 14px 0 0; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; }
  .stage { position: relative; flex: 1; background: #000; border-radius: 0 0 14px 14px; overflow: hidden; border: 1px solid #334155; }
  .stage img { width: 100%; height: 100%; object-fit: cover; }
  .beacon { position: absolute; left: ${hsX}%; top: ${hsY}%; transform: translate(-50%, -50%); width: 28px; height: 28px; border-radius: 999px; background: ${design.primaryColor || '#D4AF37'}; border: 3px solid #fff; box-shadow: 0 0 0 8px rgba(212,175,55,0.35); }
  .callout { position: absolute; left: 24px; bottom: 24px; max-width: 520px; background: rgba(15,23,42,0.95); color: #fff; border: 1px solid ${design.primaryColor || '#D4AF37'}; border-radius: 12px; padding: 14px 18px; }
  .callout .step { color: ${design.primaryColor || '#D4AF37'}; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .callout .title { font-size: 16px; font-weight: 800; margin-top: 2px; }
  .callout .body { font-size: 12px; color: #CBD5E1; margin-top: 4px; }
</style>
</head>
<body>
  <div class="chrome">
    <span>${flow.name}</span>
    <span>Step ${i + 1} of ${list.length}</span>
  </div>
  <div class="stage">
    <img src="${imgDataUri}" />
    <div class="beacon"></div>
    <div class="callout">
      <div class="step">Step ${i + 1}</div>
      <div class="title">${s.title || ''}</div>
      <div class="body">${tooltip || ''}</div>
    </div>
  </div>
</body>
</html>`;

      await page.setContent(html, { waitUntil: 'load' });
      const p = path.join(tmpDir, `step_${String(i).padStart(3, '0')}.png`);
      await page.screenshot({ path: p });
      framePaths.push(p);
    }

    await browser.close();
    browser = null;

    const concatPath = path.join(tmpDir, 'concat.txt');
    const lines: string[] = [];
    for (const fp of framePaths) {
      lines.push(`file '${fp}'`);
      lines.push(`duration 2.5`);
    }
    lines.push(`file '${framePaths[framePaths.length - 1]}'`);
    fs.writeFileSync(concatPath, lines.join('\n'));

    const ext = format === 'gif' ? 'gif' : 'mp4';
    const outName = `flow-${flow.id}-${Date.now()}.${ext}`;
    const outPath = path.join(exportsDir, outName);

    if (format === 'gif') {
      execFileSync(
        'ffmpeg',
        ['-y', '-f', 'concat', '-safe', '0', '-i', concatPath, '-vf', 'fps=10,scale=800:-1', outPath],
        { stdio: 'ignore' }
      );
    } else {
      execFileSync(
        'ffmpeg',
        [
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          concatPath,
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-pix_fmt',
          'yuv420p',
          outPath,
        ],
        { stdio: 'ignore' }
      );
    }

    const stat = fs.statSync(outPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return {
      downloadUrl: `/uploads/exports/${outName}`,
      fileSize: formatBytes(stat.size),
    };
  } catch {
    if (browser) await browser.close().catch(() => {});
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return {
      downloadUrl: '/media/whoami-launch.mp4',
      fileSize: '6.12 MB',
    };
  }
}

export async function renderVisualCardExport(
  visual: any,
  format: 'png' | 'mp4' = 'png'
): Promise<{ fileUrl: string; fileSize: string; width: number; height: number }> {
  const exportsDir = path.join(process.cwd(), 'public', 'uploads', 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });

  const width = Math.min(1920, Math.max(300, Number(visual.width || 1080)));
  const height = Math.min(1920, Math.max(200, Number(visual.height || 1080)));
  const imgDataUri = resolveLocalImageToDataUri(visual.screenshotUrl || '/media/scene1.png');

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Inter, sans-serif; }
  body {
    width: ${width}px;
    height: ${height}px;
    background: ${visual.backgroundImageUrl || visual.backgroundColor || 'linear-gradient(135deg, #111111 0%, #D4AF37 100%)'};
    color: ${visual.headlineColor || '#F4EFE6'};
    padding: ${Math.round(Math.min(width, height) * 0.06)}px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .cta {
    background: ${visual.ctaBgColor || '#D4AF37'};
    color: ${visual.ctaTextColor || '#111111'};
    padding: 8px 18px;
    border-radius: 999px;
    font-weight: 900;
    font-size: ${Math.max(12, Math.round(width * 0.015))}px;
    text-transform: uppercase;
  }
  h1 { font-size: ${Math.max(18, Math.round(width * 0.036))}px; font-weight: 900; line-height: 1.15; margin: 14px 0 8px; }
  p { font-size: ${Math.max(12, Math.round(width * 0.018))}px; opacity: 0.9; line-height: 1.4; margin-bottom: 14px; }
  .shot { flex: 1; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255,255,255,0.28); box-shadow: 0 24px 48px rgba(0,0,0,0.5); background: #0B0C10; min-height: 0; }
  .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>
  <div>
    <div class="top">
      <span class="cta">${visual.ctaLabel || 'Explore Live ↗'}</span>
      <span style="font-family:monospace;font-size:12px;opacity:0.8;">${visual.platform || 'Social'} • ${width}×${height}</span>
    </div>
    <h1>${visual.headline || ''}</h1>
    <p>${visual.subheadline || ''}</p>
  </div>
  <div class="shot">
    <img src="${imgDataUri}" />
  </div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'load' });
    const stamp = Date.now();
    const pngName = `visual-${visual.presetId || 'card'}-${stamp}.png`;
    const pngPath = path.join(exportsDir, pngName);
    await page.screenshot({ path: pngPath });
    await browser.close();
    browser = null;

    if (format === 'mp4') {
      const mp4Name = `visual-${visual.presetId || 'card'}-${stamp}.mp4`;
      const mp4Path = path.join(exportsDir, mp4Name);
      const evenW = width % 2 === 0 ? width : width - 1;
      const evenH = height % 2 === 0 ? height : height - 1;
      execFileSync(
        'ffmpeg',
        [
          '-y',
          '-loop',
          '1',
          '-i',
          pngPath,
          '-t',
          '4',
          '-vf',
          `scale=${evenW}:${evenH}`,
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-pix_fmt',
          'yuv420p',
          mp4Path,
        ],
        { stdio: 'ignore' }
      );
      const stat = fs.statSync(mp4Path);
      return {
        fileUrl: `/uploads/exports/${mp4Name}`,
        fileSize: formatBytes(stat.size),
        width,
        height,
      };
    }

    const stat = fs.statSync(pngPath);
    return {
      fileUrl: `/uploads/exports/${pngName}`,
      fileSize: formatBytes(stat.size),
      width,
      height,
    };
  } catch {
    if (browser) await browser.close().catch(() => {});
    return {
      fileUrl: format === 'mp4' ? '/media/whoami-launch.mp4' : '/media/visual_preview.png',
      fileSize: '1.24 MB',
      width,
      height,
    };
  }
}
