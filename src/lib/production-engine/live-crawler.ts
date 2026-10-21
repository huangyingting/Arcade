import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import { createJob, type EngineScope, ProductionError, requireEngineScope } from './runtime';
import { fetchPublicResource, parsePublicUrl, resolvePublicUrl } from './public-network';

export { ProductionError } from './runtime';

export interface CrawledInteractiveTarget {
  label: string; tag: string; href?: string; x: number; y: number; scrollIndex: number;
}
export interface LiveCrawlResult {
  url: string; hostname: string; title: string; tagline: string; description: string;
  headings: string[]; paragraphs: string[];
  metrics: Array<{ value: string; label: string }>;
  colors: Array<{ id: string; role: string; name: string; hex: string }>;
  fonts: { headingFont: string; headingWeight: string; bodyFont: string; bodyWeight: string; monoFont: string };
  screenshots: Array<{
    id: string; title: string; url: string; hotspot?: { x: number; y: number; tooltipText: string };
  }>;
  interactiveTargets: CrawledInteractiveTarget[];
  crawledLive: boolean;
}

export async function crawlAndCaptureWebsite(rawUrl: string, scope?: EngineScope): Promise<LiveCrawlResult> {
  requireEngineScope(scope);
  const parsedUrl = parsePublicUrl(rawUrl);
  await resolvePublicUrl(parsedUrl.toString());
  const job = await createJob(scope);
  let browser: Browser | undefined;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
  let navigationFailure: unknown;
  let phase = 'browser startup';
  const budget = { requests: 0, bytes: 0, deadline: Date.now() + 40_000 };
  let finalUrl = parsedUrl.toString();
  try {
    browser = await chromium.launch({ headless: true, timeout: 15_000 });
    deadlineTimer = setTimeout(() => { void browser?.close(); }, 40_000);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, javaScriptEnabled: false,
      serviceWorkers: 'block', acceptDownloads: false,
    });
    await context.route('**/*', async (route) => {
      const request = route.request();
      const mainNavigation = request.isNavigationRequest() && !request.frame().parentFrame();
      try {
        if (!['GET', 'HEAD'].includes(request.method())) {
          await route.abort('blockedbyclient');
          return;
        }
        const response = await fetchPublicResource(request.url(), budget);
        if (mainNavigation) {
          if (response.status < 200 || response.status >= 300) {
            throw new ProductionError(`Website returned HTTP ${response.status}.`, 'CRAWL_HTTP_FAILED', 422);
          }
          const contentType = response.headers['content-type'] || '';
          if (!/^text\/html(?:;|$)/i.test(contentType)) {
            throw new ProductionError('Capture requires an HTML website.', 'CRAWL_UNSUPPORTED_CONTENT', 422);
          }
          finalUrl = response.finalUrl;
        }
        if (mainNavigation && response.finalUrl !== request.url()) {
          await route.fulfill({ status: 302, headers: { location: response.finalUrl }, body: '' });
          return;
        }
        await route.fulfill({ status: response.status, headers: response.headers, body: response.body });
      } catch (error) {
        if (mainNavigation) navigationFailure = error;
        await route.abort('blockedbyclient').catch(() => undefined);
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    phase = 'website navigation';
    await page.goto(parsedUrl.toString(), { waitUntil: 'load', timeout: 25_000 });
    if (navigationFailure) throw navigationFailure;
    phase = 'page extraction';
    const dom = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 100)
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200)).filter(Boolean).slice(0, 12);
      const paragraphs = Array.from(document.querySelectorAll('p,li')).slice(0, 100)
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 500)).filter(Boolean).slice(0, 12);
      const hexes: string[] = [];
      for (const element of Array.from(document.querySelectorAll('body,header,main,h1,a,button,section')).slice(0, 50)) {
        const style = getComputedStyle(element);
        for (const value of [style.backgroundColor, style.color]) {
          const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
          if (match && (match[4] === undefined || Number(match[4]) === 1)) {
            const hex = '#' + match.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('').toUpperCase();
            if (!hexes.includes(hex)) hexes.push(hex);
          }
        }
      }
      const body = getComputedStyle(document.body);
      const heading = getComputedStyle(document.querySelector('h1') || document.body);
      const mono = document.querySelector('code,pre');
      const metrics = Array.from((document.body.innerText || '').slice(0, 200_000)
        .matchAll(/\b(\d{1,3}(?:,\d{3})+|\d+\+|\d+%|\d+x)\s+([A-Za-z][A-Za-z -]{3,28})/g))
        .slice(0, 10).map((match) => ({ value: match[1], label: match[2].trim() }));
      return {
        title: (document.title || '').replace(/\s+/g, ' ').trim().slice(0, 300),
        description: (document.querySelector('meta[name="description"],meta[property="og:description"]')?.getAttribute('content') || '')
          .replace(/\s+/g, ' ').trim().slice(0, 1000),
        headings, paragraphs, hexes: hexes.slice(0, 8), metrics,
        fonts: {
          headingFont: heading.fontFamily, headingWeight: heading.fontWeight,
          bodyFont: body.fontFamily, bodyWeight: body.fontWeight,
          monoFont: mono ? getComputedStyle(mono).fontFamily : '',
        },
        scrollHeight: Math.min(20_000, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)),
      };
    });
    const maxScroll = Math.max(0, dom.scrollHeight - 900);
    const offsets = [...new Set([0, Math.round(maxScroll / 3), Math.round(2 * maxScroll / 3), maxScroll])];
    const screenshots: LiveCrawlResult['screenshots'] = [];
    const interactiveTargets: CrawledInteractiveTarget[] = [];
    phase = 'screenshot capture';
    for (const [index, offset] of offsets.entries()) {
      await page.evaluate((value) => window.scrollTo(0, value), offset);
      const target = await page.evaluate((scrollIndex) => {
        for (const element of Array.from(document.querySelectorAll('a,button,[role="button"],input[type="submit"]')).slice(0, 300)) {
          const rectangle = element.getBoundingClientRect();
          const label = (element.textContent || (element as HTMLInputElement).value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
          if (label && rectangle.width > 10 && rectangle.height > 10 && rectangle.top >= 0 &&
              rectangle.bottom <= 900 && rectangle.left >= 0 && rectangle.right <= 1440) {
            return {
              label, tag: element.tagName.toLowerCase(), href: (element as HTMLAnchorElement).href || undefined,
              x: (rectangle.left + rectangle.width / 2) / 1440, y: (rectangle.top + rectangle.height / 2) / 900, scrollIndex,
            };
          }
        }
        return null;
      }, index);
      if (target?.href) {
        try { target.href = parsePublicUrl(target.href).toString(); }
        catch { delete target.href; }
      }
      if (target) interactiveTargets.push(target);
      const name = `capture-${index + 1}.png`;
      await page.screenshot({ path: path.join(job.directory, name), fullPage: false, timeout: 10_000, animations: 'disabled' });
      screenshots.push({
        id: `capture-${index + 1}`, title: dom.headings[index] || dom.title, url: name,
        ...(target ? { hotspot: { x: target.x, y: target.y, tooltipText: target.label } } : {}),
      });
    }
    phase = 'asset storage';
    for (const shot of screenshots) shot.url = await job.publish(shot.url, 'captures');
    await job.cleanup();
    return {
      url: finalUrl, hostname: new URL(finalUrl).hostname, title: dom.title, tagline: dom.headings[0] || '',
      description: dom.description, headings: dom.headings, paragraphs: dom.paragraphs, metrics: dom.metrics,
      colors: dom.hexes.map((hex, index) => ({ id: `color-${index + 1}`, role: 'Observed color', name: hex, hex })),
      fonts: dom.fonts, screenshots, interactiveTargets, crawledLive: true,
    };
  } catch (error) {
    await job.cleanup();
    if (navigationFailure instanceof ProductionError) throw navigationFailure;
    if (error instanceof ProductionError) throw error;
    const underlying = (navigationFailure ?? error) as { code?: unknown; name?: unknown; message?: unknown };
    const message = typeof underlying?.message === 'string' ? underlying.message : '';
    const networkCode = message.match(/\bnet::(ERR_[A-Z_]+)\b/)?.[1];
    const code = typeof underlying?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(underlying.code)
      ? underlying.code : networkCode || (underlying?.name === 'TimeoutError' ? 'CAPTURE_TIMEOUT' : 'CAPTURE_RUNTIME_ERROR');
    const failure = new ProductionError(
      `Live capture failed during ${phase} (${code}). Verify website connectivity and the Playwright Chromium installation.`,
      'CRAWL_FAILED', 502,
    );
    // Do not log raw browser errors: they can contain a user URL's private query parameters.
    const safeCause = Object.assign(new Error(`${phase}: ${code}`), { code });
    if (typeof underlying?.name === 'string' && /^[a-zA-Z]{1,40}$/.test(underlying.name)) safeCause.name = underlying.name;
    Object.defineProperty(failure, 'cause', { value: safeCause });
    throw failure;
  } finally {
    if (deadlineTimer) clearTimeout(deadlineTimer);
    await browser?.close().catch(() => undefined);
  }
}
