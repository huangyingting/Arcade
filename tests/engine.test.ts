import assert from 'node:assert/strict';
import { after, before, mock, test } from 'node:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import dns from 'node:dns/promises';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { chromium } from 'playwright';
import {
  callAzureOpenAiJson, callAzureOpenAiChat, synthesizeSpeechAudio,
} from '../src/lib/production-engine/ai-provider';
import { crawlAndCaptureWebsite } from '../src/lib/production-engine/live-crawler';
import {
  escapeHtml, renderFlowVideoOrGif, renderPromptVideoMp4, renderVisualCardExport,
} from '../src/lib/production-engine/media-renderer';
import { fetchPublicResource, isPublicAddress, parsePublicUrl, resolvePublicUrl } from '../src/lib/production-engine/public-network';
import { ProductionError, probeDuration, readScopedAsset, runMediaCommand } from '../src/lib/production-engine/runtime';
import {
  withWorkspaceStorage, writeAsset, resolveAssetPath, storageRoot,
} from '../src/lib/production-engine/storage';
import { embeddedFontCss } from '../src/lib/production-engine/renderer-fonts';
import { sceneLayout, type SceneArchetype } from '../src/lib/production-engine/scene-layouts';

const root = path.resolve('tests', `.engine-storage-${randomUUID()}`);
const originalFetch = globalThis.fetch;
const envNames = ['ARCADE_STORAGE_DIR', 'AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_DEPLOYMENT', 'AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION', 'AZURE_SPEECH_VOICE'];
const originalEnv = Object.fromEntries(envNames.map((key) => [key, process.env[key]]));
const scoped = <T>(callback: () => T) => withWorkspaceStorage('workspace-a', callback);
const hasCode = (code: string, status?: number) => (error: unknown) =>
  error instanceof ProductionError && error.code === code && (status === undefined || error.status === status);

before(async () => {
  process.env.ARCADE_STORAGE_DIR = root;
  for (const key of envNames.filter((key) => key !== 'ARCADE_STORAGE_DIR')) delete process.env[key];
  await fs.mkdir(root, { recursive: true });
});
after(async () => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await fs.rm(root, { recursive: true, force: true });
});

test('private storage is scoped, isolated, nonpublic, and rejects traversal or links', async () => {
  await assert.rejects(writeAsset('files', Buffer.from('real data'), 'txt'), hasCode('WORKSPACE_REQUIRED', 403));
  const urls = await Promise.all(['workspace-a', 'workspace-b'].map((workspace) =>
    withWorkspaceStorage(workspace, async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      return writeAsset('files', Buffer.from(workspace), 'txt');
    })));
  assert.match(urls[0], /^\/api\/media\/workspace-a\/files\/[a-f0-9-]+\.txt$/);
  await scoped(async () => {
    assert.equal((await readScopedAsset(urls[0])).toString(), 'workspace-a');
    await assert.rejects(resolveAssetPath(urls[1]), hasCode('UNSAFE_ASSET', 403));
    for (const url of ['/api/media/workspace-a/files/../../package.json', 'file:///etc/passwd',
      'https://example.com/asset.png', '/uploads/captures/old.png', 'data:image/svg+xml,<svg/>']) {
      await assert.rejects(readScopedAsset(url), hasCode('UNSAFE_ASSET'));
    }
    const file = await resolveAssetPath(urls[0]);
    const linkedName = `${randomUUID()}.txt`;
    await fs.symlink(file, path.join(root, 'workspace-a', 'files', linkedName));
    await assert.rejects(resolveAssetPath(`/api/media/workspace-a/files/${linkedName}`), hasCode('UNSAFE_ASSET', 403));
    await assert.rejects(writeAsset('files', Buffer.from('<svg/>'), 'svg'), hasCode('INVALID_ASSET'));
  });
  process.env.ARCADE_STORAGE_DIR = 'public/uploads/private';
  assert.throws(storageRoot, hasCode('INVALID_STORAGE_CONFIG', 503));
  process.env.ARCADE_STORAGE_DIR = root;
});

test('network policy denies internal, special-use, credential, local-file and nonstandard-port URLs', async () => {
  for (const address of ['0.0.0.0', '10.0.0.1', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.16.0.1', '192.168.1.1', '192.0.2.1', '198.18.0.1', '198.51.100.1', '203.0.113.1',
    '224.0.0.1', '240.0.0.1', '::1', '::', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1',
    '2001:db8::1', '2002:7f00:1::', '2001::1', '3fff::1']) assert.equal(isPublicAddress(address), false, address);
  for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111', '2001:4860:4860::8888']) {
    assert.equal(isPublicAddress(address), true, address);
  }
  for (const url of ['file:///etc/passwd', 'http://localhost/', 'http://metadata.internal/',
    'http://127.1/', 'http://2130706433/', 'http://0x7f000001/', 'http://[::ffff:127.0.0.1]/',
    'http://10.0.0.1/', 'http://user:pass@example.com/', 'https://example.com:8443/',
    'ftp://example.com/', 'example.com', '', 'https://example.com\\@localhost/', 'http://router/']) {
    assert.throws(() => parsePublicUrl(url), hasCode('UNSAFE_URL'), url);
    await assert.rejects(scoped(() => crawlAndCaptureWebsite(url)), hasCode('UNSAFE_URL'), url);
  }
  assert.equal(parsePublicUrl('https://example.com/path#hash').toString(), 'https://example.com/path');
  // Resolving a public literal does not perform a second, uncontrolled DNS lookup.
  const resolved = await resolvePublicUrl('https://1.1.1.1/');
  assert.equal(resolved.address.address, '1.1.1.1');
});

test('Azure absence is an actionable error, never the compatibility fallback value', async () => {
  await assert.rejects(callAzureOpenAiJson('Generate a document', 'A real request', { fake: true }), hasCode('AI_NOT_CONFIGURED', 503));
  await assert.rejects(scoped(() => synthesizeSpeechAudio('Read this actual script.')), hasCode('SPEECH_NOT_CONFIGURED', 503));
  await assert.rejects(scoped(() => synthesizeSpeechAudio('')), hasCode('INVALID_INPUT', 400));
});

test('capture pins validated DNS, rejects unsafe redirect targets, and blocks unsafe page subrequests', async () => {
  const sockets: string[] = [];
  let mode: 'page' | 'redirect' | 'rebind' | 'failure' = 'page';
  let lookups = 0;
  const dnsMock = mock.method(dns, 'lookup', (async () => {
    lookups++;
    return [{ address: mode === 'rebind' && lookups > 1 ? '127.0.0.1' : '93.184.215.14', family: 4 }];
  }) as any);
  const requestMock = mock.method(https, 'request', ((url: URL, options: any, callback: any) => {
    const request = new EventEmitter() as any;
    request.setTimeout = () => request;
    request.destroy = (error: Error) => { request.emit('error', error); return request; };
    request.end = () => {
      options.lookup(url.hostname, {}, (error: unknown, address: string) => {
        assert.equal(error, null);
        assert.equal(address, '93.184.215.14', 'Socket must use the already validated public address');
      });
      options.lookup(url.hostname, { all: true }, (error: unknown, addresses: unknown) => {
        assert.equal(error, null);
        assert.deepEqual(addresses, [{ address: '93.184.215.14', family: 4 }],
          'Node autoSelectFamily requires the all-address callback form, even with one pinned IP');
      });
      sockets.push(url.toString());
      queueMicrotask(() => {
        if (mode === 'failure') {
          request.emit('error', Object.assign(new Error('Request failed at https://capture.example/?private=secret-token'), { code: 'ECONNRESET' }));
          return;
        }
        const html = '<html><head><title>Real captured title</title></head><body><h1>Actual fixture heading</h1><p>Actual fixture paragraph, not a generated claim.</p><img src="http://127.0.0.1/private"><script>fetch("http://169.254.169.254/")</script><button>Actual button</button></body></html>';
        const response = Readable.from(mode === 'page' ? [Buffer.from(html)] : []) as any;
        response.statusCode = mode === 'page' ? 200 : 302;
        response.headers = mode === 'page' ? { 'content-type': 'text/html' } : {
          location: mode === 'redirect' ? 'http://127.0.0.1/private' : 'https://capture.example/rebound',
        };
        callback(response);
      });
    };
    return request;
  }) as any);
  try {
    mode = 'redirect';
    await assert.rejects(fetchPublicResource('https://capture.example/', {
      requests: 0, bytes: 0, deadline: Date.now() + 5000,
    }), hasCode('UNSAFE_URL'));
    assert.equal(sockets.length, 1, 'Unsafe redirect must never reach a socket');
    mode = 'rebind';
    lookups = 0;
    await assert.rejects(fetchPublicResource('https://capture.example/', {
      requests: 0, bytes: 0, deadline: Date.now() + 5000,
    }), hasCode('UNSAFE_URL'));
    mode = 'page';
    sockets.length = 0;
    const capture = await scoped(() => crawlAndCaptureWebsite('https://capture.example/'));
    assert.equal(capture.title, 'Real captured title');
    assert.equal(capture.tagline, 'Actual fixture heading');
    assert.deepEqual(capture.metrics, [], 'Missing metrics must remain missing, not invented');
    assert.equal(capture.crawledLive, true);
    assert.equal(capture.screenshots.length, 1);
    assert.match(capture.screenshots[0].url, /^\/api\/media\/workspace-a\/captures\/.*\.png$/);
    assert.ok(sockets.every((url) => new URL(url).hostname === 'capture.example'));
    mode = 'failure';
    await assert.rejects(scoped(() => crawlAndCaptureWebsite('https://capture.example/?private=secret-token')), (error: unknown) => {
      assert.ok(error instanceof ProductionError);
      assert.equal(error.code, 'CRAWL_FAILED');
      assert.match(error.message, /website navigation \(ECONNRESET\)/);
      assert.equal((error.cause as { code: string }).code, 'ECONNRESET');
      assert.equal(`${error.message} ${String(error.cause)}`.includes('secret-token'), false,
        'Safe diagnostics must retain the network code without exposing URL query secrets');
      return true;
    });
  } finally {
    dnsMock.mock.restore();
    requestMock.mock.restore();
  }
});

test('Azure JSON returns only genuine valid provider output and surfaces provider failures', async () => {
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test-resource.openai.azure.com';
  process.env.AZURE_OPENAI_API_KEY = 'test-key-not-a-real-secret';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'test-deployment';
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.redirect, 'error');
    return new Response(JSON.stringify({ model: 'actual-model', choices: [{
      finish_reason: 'stop', message: { content: '{"title":"Provider-generated title"}' },
    }] }), { headers: { 'content-type': 'application/json' } });
  };
  assert.deepEqual(await callAzureOpenAiJson('Generate a document', 'Actual input'), {
    provider: 'azure-openai', model: 'actual-model', data: { title: 'Provider-generated title' },
  });
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: 'not json' } }] }));
  await assert.rejects(callAzureOpenAiJson('Generate', 'Input', { fake: true }), hasCode('AI_INVALID_JSON', 502));
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }));
  await assert.rejects(callAzureOpenAiJson('Generate', 'Input'), hasCode('AI_INCOMPLETE_RESPONSE', 502));
  globalThis.fetch = async () => new Response('private provider error must not be exposed', { status: 429 });
  await assert.rejects(callAzureOpenAiChat('Generate', 'Input'), hasCode('PROVIDER_REQUEST_FAILED', 429));
  globalThis.fetch = async () => { throw new Error('connection failed'); };
  await assert.rejects(callAzureOpenAiJson('Generate', 'Input'), hasCode('PROVIDER_UNAVAILABLE', 502));
  globalThis.fetch = originalFetch;
});

test('media validates empty, unsupported, untrusted and excessive input without returning samples', async () => {
  await assert.rejects(renderVisualCardExport({ headline: 'No scope' }), hasCode('WORKSPACE_REQUIRED', 403));
  await scoped(async () => {
    await assert.rejects(renderPromptVideoMp4({ scenesJson: '[]' }), hasCode('EMPTY_OR_INVALID_CONTENT', 400));
    await assert.rejects(renderPromptVideoMp4({ scenesJson: '{' }), hasCode('INVALID_INPUT', 400));
    await assert.rejects(renderPromptVideoMp4({}, '4K'), hasCode('UNSUPPORTED_RESOLUTION', 422));
    await assert.rejects(renderPromptVideoMp4({ aspectRatio: '2:1' }), hasCode('UNSUPPORTED_ASPECT_RATIO', 400));
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual title', durationSec: 1, archetype: 'UNSUPPORTED_TEMPLATE' }]),
    }), hasCode('UNSUPPORTED_SCENE_ARCHETYPE', 422));
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual title', durationSec: 1, archetype: 'BROWSER_SPOTLIGHT' }]),
    }), hasCode('SCENE_IMAGE_REQUIRED', 422));
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual title', durationSec: 1, motion: 'not-implemented' }]),
    }), hasCode('UNSUPPORTED_SCENE_MOTION', 422));
    await assert.rejects(renderFlowVideoOrGif({ stepsJson: '[]' }), hasCode('EMPTY_OR_INVALID_CONTENT', 400));
    await assert.rejects(renderVisualCardExport({}), hasCode('EMPTY_VISUAL', 400));
    await assert.rejects(renderVisualCardExport({ headline: 'Text', backgroundColor: 'url(http://localhost/)' }), hasCode('INVALID_COLOR'));
    await assert.rejects(renderVisualCardExport({ headline: 'Text', width: Infinity }), hasCode('INVALID_INPUT'));
    await assert.rejects(renderVisualCardExport({ headline: 'Text', screenshotUrl: '/media/scene1.png' }), hasCode('UNSAFE_ASSET'));
    await assert.rejects(renderVisualCardExport({ headline: 'Text', screenshotUrl: 'https://example.com/image.png' }), hasCode('UNSAFE_ASSET'));
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual title', durationSec: 1 }]),
      timelineJson: JSON.stringify({ voiceoverTrack: [{ script: 'Not yet synthesized' }] }),
    }), hasCode('NARRATION_AUDIO_REQUIRED', 422));
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual title', durationSec: 61 }]),
    }), hasCode('INVALID_INPUT', 400));
    const forbiddenImage = await writeAsset('files', Buffer.from('<svg><script>bad()</script></svg>'), 'txt');
    await assert.rejects(renderVisualCardExport({ headline: 'Text', screenshotUrl: forbiddenImage }), hasCode('UNSUPPORTED_IMAGE'));
  });
  assert.equal(escapeHtml('<script x="&">\'</script>'), '&lt;script x=&quot;&amp;&quot;&gt;&#39;&lt;/script&gt;');
});

test('scene layouts are distinct, escape model fields, and load both bundled fonts without networking', async () => {
  const fonts = await embeddedFontCss();
  assert.match(fonts, /data:font\/woff2;base64,/);
  assert.match(fonts, /data:font\/ttf;base64,/);
  assert.match(fonts, /Noto Sans CJK/);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, javaScriptEnabled: false });
    let networkRequests = 0;
    await context.route('**/*', (route) => { networkRequests++; return route.abort(); });
    const page = await context.newPage();
    const selectors: Record<SceneArchetype, string> = {
      HERO_SPLIT: '.hero-media', BROWSER_SPOTLIGHT: '.browser', END_CARD_CTA: '.end-card .cta',
    };
    for (const archetype of Object.keys(selectors) as SceneArchetype[]) {
      const layout = sceneLayout({
        archetype, width: 1280, height: 720, title: '<Actual title>', subtitle: 'Actual subtitle',
        badge: 'User-provided badge', picture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        ctaLabel: 'Actual call to action', ctaUrl: 'https://example.com/start', sourceUrl: 'https://example.com/product',
        caption: 'Actual planned narration', background: '#111827', foreground: '#FFFFFF', secondary: '#D1D5DB', accent: '#FFFFFF',
      });
      assert.match(layout.body, /&lt;Actual title&gt;/);
      assert.ok(layout.body.includes(`data-layout="${archetype}"`));
      await page.setContent(`<html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'"><style>
*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px}${fonts}${layout.style}
</style></head><body>${layout.body}</body></html>`);
      await page.evaluate(async () => {
        await document.fonts.load('400 16px "Mona Sans"');
        await document.fonts.load('400 16px "JetBrains Mono"');
        await document.fonts.ready;
      });
      assert.equal(await page.locator('h1').textContent(), '<Actual title>');
      assert.equal(await page.locator('.caption').textContent(), 'Actual planned narration');
      const fontNames = await page.evaluate(() => ({
        sans: getComputedStyle(document.body).fontFamily,
        mono: getComputedStyle(document.querySelector('.mono')!).fontFamily,
        sansLoaded: document.fonts.check('400 16px "Mona Sans"'),
        monoLoaded: document.fonts.check('400 16px "JetBrains Mono"'),
      }));
      assert.match(fontNames.sans, /Mona Sans/);
      assert.match(fontNames.mono, /JetBrains Mono/);
      assert.equal(fontNames.sansLoaded && fontNames.monoLoaded, true);
      const box = await page.locator(selectors[archetype]).boundingBox();
      assert.ok(box && box.width > 100 && box.height > 20);
      if (archetype === 'HERO_SPLIT') {
        const copy = await page.locator('.copy').boundingBox();
        assert.ok(copy && box.x > copy.x + copy.width, 'Hero image must be beside the copy');
      } else if (archetype === 'BROWSER_SPOTLIGHT') {
        const title = await page.locator('h1').boundingBox();
        assert.ok(title && box.y > title.y + title.height, 'Browser must be below its heading');
        assert.equal(await page.locator('.browser-address').textContent(), 'https://example.com/product');
      } else {
        assert.ok(Math.abs(box.x + box.width / 2 - 640) < 2, 'End-card CTA must be centered');
        assert.equal(await page.locator('.destination').textContent(), 'https://example.com/start');
      }
    }
    assert.equal(networkRequests, 0);
  } finally { await browser.close(); }
});

test('real Chromium PNG and ffmpeg MP4/GIF exports use supplied content and exact durations', async () => {
  await scoped(async () => {
    const visual = await renderVisualCardExport({
      headline: '<script>fetch("http://localhost/secrets")</script>',
      subheadline: 'This user-provided text is rendered literally.',
      width: 400, height: 300, backgroundColor: '#123456',
    });
    const png = await readScopedAsset(visual.fileUrl);
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 400);
    assert.equal(png.readUInt32BE(20), 300);
    const flow = { name: 'Real walkthrough', stepsJson: JSON.stringify([
      { title: 'Actual first step', mediaUrl: visual.fileUrl, durationSec: 0.5 },
      { title: 'Actual second step', durationSec: 0.75, hotspots: [{ x: 0.2, y: 0.3, tooltipText: '<literal>' }] },
    ]) };
    const gif = await renderFlowVideoOrGif(flow, 'gif');
    assert.equal((await readScopedAsset(gif.downloadUrl)).subarray(0, 3).toString(), 'GIF');
    const video = await renderPromptVideoMp4({
      name: 'Actual video', scenesJson: JSON.stringify([
        { sceneId: 'one', title: 'The actual first scene', durationSec: 0.5, screenshotUrl: visual.fileUrl },
        { sceneId: 'two', title: 'The actual second scene', durationSec: 0.75 },
      ]),
    }, '720p', 24);
    assert.match(video.fileUrl, /^\/api\/media\/workspace-a\/exports\/.*\.mp4$/);
    const videoPath = await resolveAssetPath(video.fileUrl);
    assert.ok(Math.abs(await probeDuration(videoPath) - 1.25) < 0.15);
    const streams = JSON.parse(await runMediaCommand('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height',
      '-of', 'json', videoPath]));
    assert.equal(streams.streams.length, 1, 'No stock/sample soundtrack may be added');
    assert.equal(streams.streams[0].width, 1280);
    assert.equal(streams.streams[0].height, 720);
    const exports = await fs.readdir(path.join(root, 'workspace-a', 'exports'));
    assert.equal(exports.some((name) => name.startsWith('.job-')), false, 'Scratch files must be cleaned');
  });
});

test('neural speech validates provider audio and measures actual duration rather than estimating', async () => {
  process.env.AZURE_SPEECH_KEY = 'test-speech-key';
  process.env.AZURE_SPEECH_REGION = 'eastus';
  const fixture = path.join(root, 'provider-response.mp3');
  // Deliberately synthetic test fixture for the mocked provider, never a production fallback.
  await runMediaCommand('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.5', fixture]);
  const audio = await fs.readFile(fixture);
  globalThis.fetch = async (_url, init) => {
    assert.ok(String(init?.body).includes('Read &lt;this&gt; &amp; that.'));
    return new Response(audio, { headers: { 'content-type': 'audio/mpeg' } });
  };
  await scoped(async () => {
    const result = await synthesizeSpeechAudio('Read <this> & that.');
    assert.equal(result.provider, 'azure-speech');
    assert.ok(result.durationSec >= 0.5 && result.durationSec < 0.7);
    assert.match(result.audioUrl, /^\/api\/media\/workspace-a\/audio\/.*\.mp3$/);
    const narrated = await renderPromptVideoMp4({
      scenesJson: JSON.stringify([
        { title: 'First actual narrated scene', durationSec: 0.75 },
        { title: 'Second actual narrated scene', durationSec: 0.75 },
      ]),
      timelineJson: JSON.stringify({ voiceoverTrack: [{ audioUrl: result.audioUrl }, { audioUrl: result.audioUrl }] }),
    }, '720p', 24);
    const narratedPath = await resolveAssetPath(narrated.fileUrl);
    const streams = JSON.parse(await runMediaCommand('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', narratedPath]));
    assert.deepEqual(streams.streams.map((stream: any) => stream.codec_type), ['video', 'audio']);
    assert.ok(Math.abs(await probeDuration(narratedPath) - 1.5) < 0.15);
    const playlistUrl = await writeAsset('files', Buffer.from('#EXTM3U\n#EXTINF:5,\nfile:///etc/passwd'), 'txt');
    await assert.rejects(renderPromptVideoMp4({
      scenesJson: JSON.stringify([{ title: 'Actual scene', durationSec: 1 }]),
      timelineJson: JSON.stringify({ voiceoverTrack: [{ audioUrl: playlistUrl }] }),
    }, '720p'), hasCode('INVALID_AUDIO', 422));
    await assert.rejects(synthesizeSpeechAudio('Text', '../invalid-voice'), hasCode('INVALID_VOICE', 400));
    globalThis.fetch = async () => new Response('provider returned invalid audio');
    await assert.rejects(synthesizeSpeechAudio('Actual text'), hasCode('INVALID_AUDIO', 422));
  });
  globalThis.fetch = originalFetch;
});

test('portrait/square/4:5 exports honor aspect ratio, distinct scene durations, and actual zoom/pan motion', async () => {
  await scoped(async () => {
    const visual = await renderVisualCardExport({
      headline: 'Actual screenshot content', subheadline: 'Used by both real image-based layouts.',
      width: 400, height: 300, backgroundColor: '#123456',
    });
    const video = await renderPromptVideoMp4({
      aspectRatio: '9:16', sourceUrl: 'https://example.com/product',
      scenesJson: JSON.stringify([
        { sceneId: 'hero', archetype: 'HERO_SPLIT', durationSec: 0.5, screenshotUrl: visual.fileUrl, motion: 'zoom-in' },
        { sceneId: 'browser', archetype: 'BROWSER_SPOTLIGHT', durationSec: 0.75, screenshotUrl: visual.fileUrl, motion: 'pan-left' },
        { sceneId: 'cta', archetype: 'END_CARD_CTA', durationSec: 0.5, motion: 'zoom-out' },
      ]),
      designValuesJson: JSON.stringify({ scenes: {
        hero: { TitleText: 'Actual hero heading', SubtitleText: 'Actual hero subtitle', NarrationText: 'Actual hero narration' },
        browser: { TitleText: 'Actual browser heading', SubtitleText: 'Actual browser subtitle' },
        cta: { TitleText: 'Actual end heading', SubtitleText: 'Actual end subtitle', CtaUrl: 'https://example.com/start' },
      } }),
      timelineJson: JSON.stringify({ captionsEnabled: true }),
    }, '720p', 24);
    const file = await resolveAssetPath(video.fileUrl);
    const details = JSON.parse(await runMediaCommand('ffprobe', [
      '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', file,
    ]));
    assert.equal(details.streams[0].width, 720);
    assert.equal(details.streams[0].height, 1280);
    assert.ok(Math.abs(await probeDuration(file) - 1.75) < 0.1);
    const early = await runMediaCommand('ffmpeg', ['-v', 'error', '-ss', '0.05', '-i', file, '-frames:v', '1', '-f', 'md5', '-']);
    const later = await runMediaCommand('ffmpeg', ['-v', 'error', '-ss', '0.35', '-i', file, '-frames:v', '1', '-f', 'md5', '-']);
    assert.notEqual(early, later, 'Zoom must change actual encoded pixels within a scene');
    for (const [aspectRatio, width, height] of [['1:1', 720, 720], ['4:5', 720, 900]] as const) {
      const result = await renderPromptVideoMp4({
        aspectRatio, motion: 'none', scenesJson: JSON.stringify([
          { title: 'Actual aspect-ratio test', archetype: 'END_CARD_CTA', durationSec: 0.25 },
        ]),
      }, '720p', 24);
      const filePath = await resolveAssetPath(result.fileUrl);
      const output = JSON.parse(await runMediaCommand('ffprobe', [
        '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', filePath,
      ]));
      assert.equal(output.streams[0].width, width);
      assert.equal(output.streams[0].height, height);
    }
  });
});
