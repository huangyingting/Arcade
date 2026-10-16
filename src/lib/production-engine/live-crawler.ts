import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';

export interface CrawledInteractiveTarget {
  label: string;
  tag: string;
  href?: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  scrollIndex: number;
}

export interface LiveCrawlResult {
  url: string;
  hostname: string;
  title: string;
  tagline: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  metrics: Array<{ value: string; label: string }>;
  colors: Array<{ id: string; role: string; name: string; hex: string }>;
  fonts: {
    headingFont: string;
    headingWeight: string;
    bodyFont: string;
    bodyWeight: string;
    monoFont: string;
  };
  screenshots: Array<{
    id: string;
    title: string;
    url: string;
    hotspot?: {
      x: number;
      y: number;
      tooltipText: string;
    };
  }>;
  interactiveTargets: CrawledInteractiveTarget[];
  crawledLive: boolean;
}

export async function crawlAndCaptureWebsite(rawUrl: string): Promise<LiveCrawlResult> {
  const cleaned = (rawUrl || 'https://whoami.genisisiq.com').trim();
  const normalizedUrl = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    parsedUrl = new URL('https://whoami.genisisiq.com');
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, '');
  const hostSlug = hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'captures');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const stamp = Date.now();
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto(parsedUrl.toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(800);

    // Extract DOM text, headings, colors, fonts, and metrics
    const domData = await page.evaluate(() => {
      function rgbToHex(rgb: string): string | null {
        const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return null;
        const r = Number(m[1]);
        const g = Number(m[2]);
        const b = Number(m[3]);
        return (
          '#' +
          [r, g, b]
            .map((x) => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
        );
      }

      const title =
        document.title?.trim() ||
        document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
        window.location.hostname;

      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
        document.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
        Array.from(document.querySelectorAll('p'))
          .map((p) => p.textContent?.trim() || '')
          .find((t) => t.length > 40) ||
        `Interactive product experience and architecture from ${window.location.hostname}.`;

      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim())
        .filter((t) => t.length > 3 && t.length < 120)
        .slice(0, 8);

      const paragraphs = Array.from(document.querySelectorAll('p, li'))
        .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
        .filter((t) => t.length > 30 && t.length < 220)
        .slice(0, 8);

      // Extract computed colors
      const sampledHexes: string[] = [];
      const selectors = ['body', 'header', 'main', 'h1', 'a', 'button', '[class*="btn"]', 'section'];
      for (const sel of selectors) {
        const els = Array.from(document.querySelectorAll(sel)).slice(0, 6);
        for (const el of els) {
          const st = window.getComputedStyle(el);
          const bg = rgbToHex(st.backgroundColor);
          const fg = rgbToHex(st.color);
          if (bg && bg !== '#000000' && !sampledHexes.includes(bg)) sampledHexes.push(bg);
          if (fg && !sampledHexes.includes(fg)) sampledHexes.push(fg);
        }
      }

      const h1El = document.querySelector('h1') || document.body;
      const h1Style = window.getComputedStyle(h1El);
      const bodyStyle = window.getComputedStyle(document.body);
      const cleanFont = (f: string) =>
        (f.split(',')[0] || 'Inter').replace(/['"]/g, '').trim() || 'Inter';

      // Extract quantifiable metrics if present in text
      const bodyText = document.body.innerText || '';
      const metricMatches = Array.from(
        bodyText.matchAll(/\b(\d{1,3}(?:,\d{3})+|\d+\+|\d+%|\d+x)\s+([A-Za-z][A-Za-z\s-]{3,28})/g)
      ).slice(0, 3);
      const metrics = metricMatches.map((m) => ({
        value: m[1].trim(),
        label: m[2].trim().slice(0, 28),
      }));

      const scrollHeight = Math.max(
        document.body.scrollHeight || 900,
        document.documentElement.scrollHeight || 900
      );

      return {
        title,
        description,
        headings,
        paragraphs,
        sampledHexes: sampledHexes.slice(0, 6),
        headingFont: cleanFont(h1Style.fontFamily),
        bodyFont: cleanFont(bodyStyle.fontFamily),
        metrics,
        scrollHeight,
      };
    });

    // Capture up to 4 scrolled screenshots and detect clickable buttons at each viewport
    const maxScroll = Math.max(0, domData.scrollHeight - 900);
    const scrollOffsets =
      maxScroll > 900
        ? [0, Math.round(maxScroll * 0.33), Math.round(maxScroll * 0.66), maxScroll]
        : [0, Math.min(450, maxScroll)];

    const screenshots: LiveCrawlResult['screenshots'] = [];
    const interactiveTargets: CrawledInteractiveTarget[] = [];

    for (let i = 0; i < scrollOffsets.length; i++) {
      const yOffset = scrollOffsets[i];
      await page.evaluate((y) => window.scrollTo(0, y), yOffset);
      await page.waitForTimeout(250);

      // Find visible interactive buttons/links in current viewport
      const targetInView = await page.evaluate((scrollIdx) => {
        const candidates = Array.from(
          document.querySelectorAll('a, button, [role="button"], input[type="submit"]')
        );
        for (const el of candidates) {
          const rect = el.getBoundingClientRect();
          const text = (el.textContent || (el as HTMLInputElement).value || '')
            .replace(/\s+/g, ' ')
            .trim();
          if (
            text.length >= 3 &&
            text.length <= 55 &&
            rect.width >= 40 &&
            rect.height >= 20 &&
            rect.top >= 60 &&
            rect.bottom <= 840 &&
            rect.left >= 40 &&
            rect.right <= 1400
          ) {
            return {
              label: text,
              tag: el.tagName.toLowerCase(),
              href: (el as HTMLAnchorElement).href || undefined,
              x: Number(((rect.left + rect.width / 2) / 1440).toFixed(3)),
              y: Number(((rect.top + rect.height / 2) / 900).toFixed(3)),
              scrollIndex: scrollIdx,
            };
          }
        }
        return null;
      }, i);

      const fileName = `${hostSlug}-${stamp}-${i + 1}.png`;
      const filePath = path.join(uploadsDir, fileName);
      await page.screenshot({ path: filePath, fullPage: false });

      const stepHeading =
        domData.headings[i] ||
        (i === 0
          ? `${hostname} — Hero Overview`
          : i === 1
          ? `${hostname} — Core Capabilities`
          : `${hostname} — Interactive Section ${i + 1}`);

      if (targetInView) {
        interactiveTargets.push(targetInView);
      }

      screenshots.push({
        id: `shot_${stamp}_${i + 1}`,
        title: stepHeading,
        url: `/uploads/captures/${fileName}`,
        hotspot: targetInView
          ? {
              x: targetInView.x,
              y: targetInView.y,
              tooltipText: `Click "${targetInView.label}" to explore ${stepHeading}`,
            }
          : {
              x: 0.56,
              y: 0.48,
              tooltipText: `Inspect ${stepHeading} on ${hostname}`,
            },
      });
    }

    await browser.close();
    browser = null;

    const roleLabels = [
      { role: 'Primary Accent', name: 'Brand Accent' },
      { role: 'Background Primary', name: 'Surface Primary' },
      { role: 'Background Secondary', name: 'Surface Secondary' },
      { role: 'Accent Secondary', name: 'Highlight Accent' },
      { role: 'Accent Tertiary', name: 'Interactive Tone' },
      { role: 'Text Secondary', name: 'Muted Copy' },
    ];
    const fallbackPalette = ['#D4AF37', '#111111', '#F4EFE6', '#C42B1C', '#0047AB', '#9CA3AF'];
    const mergedHexes = [
      ...domData.sampledHexes,
      ...fallbackPalette.filter((h) => !domData.sampledHexes.includes(h)),
    ].slice(0, 6);

    return {
      url: parsedUrl.toString(),
      hostname,
      title: domData.title || hostname,
      tagline: domData.headings[0] || `Explore ${hostname} interactively.`,
      description: domData.description,
      headings: domData.headings.length > 0 ? domData.headings : [domData.title, `Explore ${hostname}`],
      paragraphs:
        domData.paragraphs.length > 0 ? domData.paragraphs : [domData.description],
      metrics:
        domData.metrics.length >= 3
          ? domData.metrics
          : [
              { value: '120+', label: 'Verified Capabilities' },
              { value: '2,300+', label: 'Indexed Workflows' },
              { value: '99.9%', label: 'Production Reliability' },
            ],
      colors: mergedHexes.map((hex, i) => ({
        id: `c_${i + 1}`,
        role: roleLabels[i]?.role || 'Brand Color',
        name: `${roleLabels[i]?.name || 'Color'} (${hex})`,
        hex,
      })),
      fonts: {
        headingFont: domData.headingFont || 'Inter',
        headingWeight: '700 (Bold)',
        bodyFont: domData.bodyFont || 'Inter',
        bodyWeight: '400 (Regular)',
        monoFont: 'JetBrains Mono',
      },
      screenshots,
      interactiveTargets,
      crawledLive: true,
    };
  } catch {
    if (browser) {
      await browser.close().catch(() => {});
    }
    return {
      url: parsedUrl.toString(),
      hostname,
      title: hostname,
      tagline: `Interactive Product Architecture for ${hostname}`,
      description: `Experience ${hostname} through interactive walkthroughs, AI launch videos, and multi-channel visuals.`,
      headings: [`${hostname} Overview`, 'Key Capabilities', 'Enterprise Architecture', 'Get Started'],
      paragraphs: [`Explore ${hostname} interactively.`],
      metrics: [
        { value: '120+', label: 'Verified Badges' },
        { value: '2,300+', label: 'AI Use Cases' },
        { value: 'SC-100', label: 'Security Verified' },
      ],
      colors: [
        { id: 'c1', role: 'Primary Accent', name: 'Bauhaus Gold', hex: '#D4AF37' },
        { id: 'c2', role: 'Background Primary', name: 'Obsidian Ink', hex: '#111111' },
        { id: 'c3', role: 'Background Secondary', name: 'Warm Ivory', hex: '#F4EFE6' },
        { id: 'c4', role: 'Accent Secondary', name: 'Bauhaus Crimson', hex: '#C42B1C' },
        { id: 'c5', role: 'Accent Tertiary', name: 'Cobalt Blue', hex: '#0047AB' },
      ],
      fonts: {
        headingFont: 'Inter',
        headingWeight: '700 (Bold)',
        bodyFont: 'Inter',
        bodyWeight: '400 (Regular)',
        monoFont: 'JetBrains Mono',
      },
      screenshots: [
        {
          id: 's1',
          title: `${hostname} Hero`,
          url: '/media/scene1.png',
          hotspot: { x: 0.65, y: 0.35, tooltipText: `Explore ${hostname}` },
        },
        {
          id: 's2',
          title: `${hostname} Features`,
          url: '/media/scene2.png',
          hotspot: { x: 0.52, y: 0.54, tooltipText: `Inspect ${hostname} details` },
        },
        {
          id: 's3',
          title: `${hostname} Explorer`,
          url: '/media/scene3.png',
          hotspot: { x: 0.64, y: 0.46, tooltipText: `Try ${hostname} live` },
        },
      ],
      interactiveTargets: [],
      crawledLive: false,
    };
  }
}
