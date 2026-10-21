import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { chromium } from 'playwright';
import { blankStep, defaultDesign } from '../src/lib/content';
import { hashOpaqueToken } from '../src/lib/account-admission/tokens';

const root = process.cwd();
const password = `Validation-${randomBytes(16).toString('hex')}!`;
let temp = '';
let base = '';
let admin = '';
let other = '';
let viewer = '';
let workspace = '';
let foreignWorkspace = '';
let imageUrl = '';
let flowId = '';
let shareId = '';
let visualId = '';
let uploadedImage = Buffer.alloc(0);
let server: ChildProcess | undefined;
let db: PrismaClient;
let logs = '';
async function call<T = { error?: string }>(route: string, method = 'GET', body?: unknown, cookie = '', extraHeaders: Record<string, string> = {}) {
  const response = await fetch(`${base}${route}`, {
    method, redirect: 'manual',
    headers: { ...(cookie ? { cookie } : {}), ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...extraHeaders },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await response.text();
  let data: T;
  try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`${route}: expected JSON, received ${raw.slice(0, 120)}`); }
  return { response, data };
}
function status(response: Response, expected: number, detail?: unknown) { assert.equal(response.status, expected, JSON.stringify(detail)); }
function cookie(response: Response) {
  const value = response.headers.getSetCookie().find((c) => /^(?:__Secure-)?next-auth\.session-token=/.test(c));
  assert.ok(value, 'A real database session cookie is required.');
  return value.split(';')[0];
}

describe('production product contract against an isolated database', { concurrency: false, timeout: 300000 }, () => {
  before(async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'arcade-product-'));
    const listener = createServer();
    await new Promise<void>((resolve) => listener.listen(0, '127.0.0.1', resolve));
    const address = listener.address(); assert.ok(address && typeof address !== 'string');
    const port = address.port;
    await new Promise<void>((resolve) => listener.close(() => resolve()));
    base = `http://127.0.0.1:${port}`;
    const url = `file:${path.join(temp, 'test.db')}`;
    const env = {
      ...process.env, NODE_ENV: 'production', DATABASE_URL: url, NEXTAUTH_URL: base,
      NEXTAUTH_SECRET: randomBytes(48).toString('base64url'), ARCADE_STORAGE_DIR: path.join(temp, 'storage'),
      AZURE_OPENAI_ENDPOINT: '', AZURE_OPENAI_API_KEY: '', AZURE_OPENAI_DEPLOYMENT: '',
      AZURE_SPEECH_KEY: '', AZURE_SPEECH_REGION: '', EMAIL_DELIVERY_URL: '', EMAIL_DELIVERY_TOKEN: '',
      GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '',
    };
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: root, env, stdio: 'pipe' });
    execFileSync('npx', ['tsx', 'scripts/bootstrap-admin.ts', '--email', 'operator@studio.test', '--name', 'Studio operator', '--password-stdin'], { cwd: root, env, input: password, stdio: ['pipe', 'pipe', 'pipe'] });
    db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
    assert.equal(await db.workspace.count(), 0);
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout?.on('data', (b) => { logs = (logs + b).slice(-30000); });
    server.stderr?.on('data', (b) => { logs = (logs + b).slice(-30000); });
    let ready = false;
    for (let i = 0; i < 150; i++) {
      if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
      try { if ((await fetch(base)).ok) { ready = true; break; } } catch { /* Startup has not bound the port yet. */ }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, logs);
  }, { timeout: 90000 });

  after(async () => {
    if (server?.pid && server.exitCode === null) {
      server.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => { server?.kill('SIGKILL'); resolve(); }, 5000);
        server?.once('exit', () => { clearTimeout(timeout); resolve(); });
      });
    }
    await db?.$disconnect();
    if (temp) await rm(temp, { recursive: true, force: true });
  });

  it('rejects anonymous APIs, missing IDs, wrong passwords and cross-origin mutations', async () => {
    status((await call('/api/workspaces')).response, 401);
    status((await call('/api/me')).response, 401);
    status((await call('/api/auth/password/login', 'POST', { email: 'operator@studio.test', password: 'Incorrect-password!' })).response, 401);
    status((await call('/api/auth/password/login', 'POST', { email: 'operator@studio.test' })).response, 400);
    status((await call('/api/auth/password/login', 'POST', { email: 'operator@studio.test', password }, '', { origin: 'https://untrusted.example' })).response, 403);
    status((await call('/api/auth/register', 'POST', { email: 'uninvited@studio.test', password })).response, 400);
  });

  it('boots a real administrator and shares its database session with NextAuth', async () => {
    const result = await call('/api/auth/password/login', 'POST', { email: 'operator@studio.test', password });
    status(result.response, 200, result.data); admin = cookie(result.response);
    const me = await call<{ user: { role: string }; workspaces: unknown[] }>('/api/me', 'GET', undefined, admin);
    assert.equal(me.data.user.role, 'Admin'); assert.deepEqual(me.data.workspaces, []);
    const session = await call<{ user?: { email: string } }>('/api/auth/session', 'GET', undefined, admin);
    assert.equal(session.data.user?.email, 'operator@studio.test');
    assert.equal(JSON.stringify(me.data).includes('password'), false);
  });

  it('starts with empty account-owned workspaces', async () => {
    const result = await call<{ workspace: { id: string; slug: string } }>('/api/workspaces', 'POST', { name: 'Validation studio', slug: 'validation-studio' }, admin);
    status(result.response, 201, result.data); workspace = result.data.workspace.slug;
    const result2 = await call<{ workspace: { flows: unknown[]; promptVideos: unknown[]; members: unknown[] } }>(`/api/workspaces/${workspace}`, 'GET', undefined, admin);
    assert.deepEqual(result2.data.workspace.flows, []); assert.deepEqual(result2.data.workspace.promptVideos, []);
    assert.equal(result2.data.workspace.members.length, 1);
    assert.equal(JSON.stringify(result2.data).includes('password'), false);
    status((await call('/api/flows/not-an-id', 'GET', undefined, admin)).response, 404);
    status((await call('/api/public/flows/not-a-share')).response, 404);
  });

  it('consumes, rotates and revokes invitations without fake email delivery', async () => {
    async function register(email: string) {
      const invite = await call<{ acceptUrl: string; delivery: { queued: boolean } }>('/api/admin/invitations', 'POST', { email }, admin);
      status(invite.response, 201, invite.data); assert.equal(invite.data.delivery.queued, false);
      const token = new URL(invite.data.acceptUrl).pathname.split('/').at(-1);
      const accepted = await call('/api/auth/register', 'POST', { token, email, password, name: email.split('@')[0] });
      status(accepted.response, 201, accepted.data);
      status((await call('/api/auth/register', 'POST', { token, email, password, name: 'Repeated invitation' })).response, 410);
      return cookie(accepted.response);
    }
    other = await register('other@studio.test'); viewer = await register('viewer@studio.test');
    const invitation = await call<{ invitation: { id: string }; acceptUrl: string }>('/api/admin/invitations', 'POST', { email: 'rotated@studio.test' }, admin);
    const token = new URL(invitation.data.acceptUrl).pathname.split('/').at(-1);
    status((await call(`/api/admin/invitations/${invitation.data.invitation.id}/rotate`, 'POST', {}, admin)).response, 200);
    const oldLink = await call<{ invitation: { status: string } }>('/api/auth/invitation', 'POST', { token });
    status(oldLink.response, 200, oldLink.data); assert.equal(oldLink.data.invitation.status, 'invalid');
    status((await call(`/api/admin/invitations/${invitation.data.invitation.id}`, 'DELETE', undefined, admin)).response, 200);
    status((await call('/api/admin/invitations', 'GET', undefined, other)).response, 403);
    status((await call('/api/auth/password/forgot', 'POST', { email: 'operator@studio.test' })).response, 503);
  });

  it('enforces workspace isolation, membership and read-only permissions', async () => {
    const second = await call<{ workspace: { slug: string } }>('/api/workspaces', 'POST', { name: 'Other studio', slug: 'other-studio' }, other);
    status(second.response, 201, second.data); foreignWorkspace = second.data.workspace.slug;
    status((await call(`/api/workspaces/${workspace}`, 'GET', undefined, other)).response, 404);
    status((await call(`/api/search?workspaceSlug=${workspace}&q=`, 'GET', undefined, other)).response, 404);
    const member = await call(`/api/workspaces/${workspace}/members`, 'POST', { email: 'viewer@studio.test', role: 'VIEWER' }, admin);
    status(member.response, 201, member.data);
    status((await call(`/api/workspaces/${workspace}`, 'GET', undefined, viewer)).response, 200);
    status((await call('/api/flows', 'POST', { workspaceSlug: workspace, name: 'Forbidden' }, viewer)).response, 403);
    status((await call(`/api/workspaces/${workspace}/members`, 'POST', { email: 'other@studio.test', role: 'ADMIN' }, viewer)).response, 403);
    const own = await call<{ workspaces: { slug: string }[] }>('/api/workspaces', 'GET', undefined, other);
    assert.deepEqual(own.data.workspaces.map((w) => w.slug), [foreignWorkspace]);
    const added = await call<{ member: { id: string } }>(`/api/workspaces/${workspace}/members`, 'POST', { email: 'other@studio.test', role: 'EDITOR' }, admin);
    status(added.response, 201, added.data);
    status((await call(`/api/workspaces/${workspace}/members`, 'PATCH', { memberId: added.data.member.id, role: 'VIEWER' }, admin)).response, 200);
    status((await call(`/api/workspaces/${workspace}/members`, 'PATCH', { memberId: added.data.member.id, remove: true }, admin)).response, 200);
    status((await call(`/api/workspaces/${workspace}`, 'GET', undefined, other)).response, 404);
  });

  it('keeps uploaded media private until an actual asset is published', async () => {
    const browser = await chromium.launch({ headless: true });
    let png: Buffer;
    try { const page = await browser.newPage({ viewport: { width: 600, height: 400 } }); await page.setContent('<html><body style="background:#f5f4ec"><h1>Real uploaded content</h1><p>中文 日本語 한국어</p></body></html>'); png = await page.screenshot(); } finally { await browser.close(); }
    uploadedImage = png;
    const upload = await call<{ url: string }>('/api/uploads', 'POST', { workspaceSlug: workspace, filename: 'product.png', dataUrl: `data:image/png;base64,${png.toString('base64')}` }, admin);
    status(upload.response, 201, upload.data); imageUrl = upload.data.url;
    assert.ok(imageUrl.startsWith('/api/media/'));
    status(await fetch(base + imageUrl), 404);
    status(await fetch(base + imageUrl, { headers: { cookie: admin } }), 200);
    status(await fetch(base + imageUrl, { headers: { cookie: other } }), 404);
    status((await call('/api/uploads', 'POST', { workspaceSlug: workspace, filename: 'bad.html', dataUrl: 'data:text/html;base64,PGgxPkJhZDwvaDE+' }, admin)).response, 415);
    const created = await call<{ flow: { id: string; shareId: string; stepsJson: string; status: string } }>('/api/flows', 'POST', { workspaceSlug: workspace, name: 'A genuine walkthrough' }, admin);
    status(created.response, 201, created.data); flowId = created.data.flow.id; shareId = created.data.flow.shareId;
    assert.deepEqual(JSON.parse(created.data.flow.stepsJson), []); assert.equal(created.data.flow.status, 'DRAFT');
    status((await call(`/api/public/flows/${shareId}`)).response, 404);
    status((await call(`/api/flows/${flowId}`, 'PATCH', { status: 'PUBLISHED' }, admin)).response, 400);
    const step = { ...blankStep(0), title: 'The product', mediaUrl: imageUrl, mediaWidth: 600, mediaHeight: 400 };
    status((await call(`/api/flows/${flowId}`, 'PATCH', { steps: [step], status: 'PUBLISHED' }, admin)).response, 200);
    status((await call(`/api/public/flows/${shareId}`)).response, 200);
    const media = await fetch(base + imageUrl, { headers: { range: 'bytes=0-7' } });
    status(media, 206); assert.equal((await media.arrayBuffer()).byteLength, 8);
    status((await call(`/api/flows/${flowId}`, 'GET', undefined, other)).response, 404);
    status((await call(`/api/flows/${flowId}`, 'PATCH', { name: 'No' }, viewer)).response, 403);
    status((await call('/api/flows', 'POST', { workspaceSlug: foreignWorkspace, steps: [step] }, other)).response, 400);
  });

  it('publishes real collections and validates structure and media ownership', async () => {
    const collection = await call<{ collection: { id: string; shareId: string; itemsJson: string } }>('/api/collections', 'POST', { workspaceSlug: workspace, name: 'Customer stories' }, admin);
    status(collection.response, 201, collection.data); assert.deepEqual(JSON.parse(collection.data.collection.itemsJson), []);
    const id = collection.data.collection.id;
    status((await call(`/api/collections/${id}`, 'PATCH', { header: { title: 'Stories', subtitle: '', ctaLabel: '', ctaUrl: '' }, items: [{ assetType: 'FLOW', assetId: flowId }], status: 'PUBLISHED' }, admin)).response, 200);
    status((await call(`/api/public/collections/${collection.data.collection.shareId}`)).response, 200);
    status((await call(`/api/flows/${flowId}`, 'PATCH', { steps: [null] }, admin)).response, 400);
    status((await call(`/api/flows/${flowId}`, 'PATCH', { design: { ...defaultDesign, backgroundColor: 'url(https://untrusted.example)' } }, admin)).response, 400);
    status((await call(`/api/collections/${id}`, 'PATCH', { header: { title: 'Invalid', ctaUrl: 'javascript:alert(1)' } }, admin)).response, 400);
  });

  it('records consented leads and deduplicates actual viewer events', async () => {
    const first = await call('/api/analytics', 'POST', { assetId: shareId, eventType: 'VIEW', stepIndex: 0, durationMs: 0 });
    status(first.response, 200, first.data);
    const visitor = first.response.headers.getSetCookie().find((s) => s.startsWith('arcade-visitor='))?.split(';')[0]; assert.ok(visitor);
    status((await call('/api/analytics', 'POST', { assetId: shareId, eventType: 'VIEW', stepIndex: 0, durationMs: 0 }, visitor)).response, 200);
    assert.equal((await db.flow.findUniqueOrThrow({ where: { id: flowId } })).viewsCount, 1);
    const chapter = blankStep(1, true); chapter.title = 'Stay in touch';
    chapter.chapter = { ...chapter.chapter!, title: 'Stay in touch', interactionMode: 'form', formFields: [{ id: 'email-field', key: 'email', label: 'Email', placeholder: '', required: true }] };
    const original = await db.flow.findUniqueOrThrow({ where: { id: flowId } });
    status((await call(`/api/flows/${flowId}`, 'PATCH', { steps: [...JSON.parse(original.stepsJson), chapter] }, admin)).response, 200);
    status((await call('/api/leads', 'POST', { flowId: shareId, stepIndex: 1, email: 'customer@studio.test' })).response, 400);
    status((await call('/api/leads', 'POST', { flowId: shareId, stepIndex: 1, email: 'customer@studio.test', consent: true })).response, 201);
    const lead = await db.leadCapture.findFirstOrThrow(); assert.ok(lead.consentAt); assert.equal(lead.syncedToCrm, false);
    status((await call(`/api/leads?workspaceSlug=${workspace}`, 'GET', undefined, viewer)).response, 403);
    status((await call('/api/analytics', 'POST', { assetId: shareId, eventType: 'VIEW', stepIndex: 0 }, '', { dnt: '1' })).response, 204);
    status((await call(`/api/workspaces/${workspace}`, 'PATCH', { privacySettings: { showCookieBanner: true, retentionDays: 30 } }, admin)).response, 200);
    status((await call('/api/analytics', 'POST', { assetId: shareId, eventType: 'VIEW', stepIndex: 0 })).response, 204);
    const consented = await call('/api/analytics', 'POST', { assetId: shareId, eventType: 'STEP_VIEW', stepIndex: 0, durationMs: 1000, consent: true });
    status(consented.response, 200, consented.data);
    status((await call(`/api/workspaces/${workspace}`, 'PATCH', { privacySettings: { retentionDays: 731 } }, admin)).response, 400);
  });

  it('exports real visual pixels and rejects nonexistent canvases', async () => {
    const project = await call<{ project: { id: string; visualsJson: string } }>('/api/visual-projects', 'POST', { workspaceSlug: workspace, prompt: 'A real product headline' }, admin);
    status(project.response, 201, project.data); visualId = project.data.project.id;
    const visuals = JSON.parse(project.data.project.visualsJson);
    const rendered = await call<{ fileUrl: string }>(`/api/visual-projects/${visualId}/export`, 'POST', { visualId: visuals[0].id, format: 'png' }, admin);
    status(rendered.response, 200, rendered.data);
    const file = await fetch(base + rendered.data.fileUrl, { headers: { cookie: admin } });
    status(file, 200); assert.equal(file.headers.get('content-type'), 'image/png'); assert.ok((await file.arrayBuffer()).byteLength > 500);
    status(await fetch(base + rendered.data.fileUrl), 404);
    status((await call(`/api/visual-projects/${visualId}/export`, 'POST', { visualId: 'missing', format: 'png' }, admin)).response, 404);
  });

  it('invalidates stale video exports and reports unavailable providers truthfully', async () => {
    const owner = await db.user.findUniqueOrThrow({ where: { email: 'operator@studio.test' } });
    const ws = await db.workspace.findUniqueOrThrow({ where: { slug: workspace } });
    const scenes = [{ sceneId: 'scene_one', sceneNumber: 1, archetype: 'HERO_SPLIT', title: 'Actual video', durationSec: 1, startSec: 0, screenshotUrl: '' }];
    const values = { colors: { BackgroundPrimary: '#24251f', TextPrimary: '#faf8ef', AccentPrimary: '#dc7250' }, scenes: { scene_one: { TitleText: 'Actual video', SubtitleText: 'A real render', NarrationText: '', CtaUrl: '' } } };
    const timeline = { totalDurationSec: 1, fps: 30, scenesTrack: [{ ...scenes[0], id: 'scene_one' }], voiceoverTrack: [], musicTrack: [], sfxTrack: [], panZoomTrack: [] };
    const video = await db.promptVideo.create({ data: { workspaceId: ws.id, createdById: owner.id, name: 'Real render fixture', prompt: 'User-authored validation composition', scenesJson: JSON.stringify(scenes), designValuesJson: JSON.stringify(values), timelineJson: JSON.stringify(timeline), durationSec: 1 } });
    const render = await call<{ exportItem: { fileUrl: string } }>(`/api/prompt-videos/${video.id}/export`, 'POST', { resolution: '720p', fps: 30 }, admin);
    status(render.response, 200, render.data);
    status((await call(`/api/prompt-videos/${video.id}`, 'PATCH', { status: 'PUBLISHED' }, admin)).response, 200);
    status((await call(`/api/public/videos/${video.shareId}`)).response, 200);
    values.scenes.scene_one.TitleText = 'Changed composition';
    status((await call(`/api/prompt-videos/${video.id}`, 'PATCH', { designValues: values }, admin)).response, 200);
    const changed = await db.promptVideo.findUniqueOrThrow({ where: { id: video.id } }); assert.equal(changed.status, 'DRAFT'); assert.deepEqual(JSON.parse(changed.exportsJson), []);
    status((await call(`/api/public/videos/${video.shareId}`)).response, 404);
    status((await call(`/api/prompt-videos/${video.id}`, 'PATCH', { status: 'PUBLISHED' }, admin)).response, 400);
    status(await fetch(base + render.data.exportItem.fileUrl), 404);
    status((await call('/api/prompt-videos', 'POST', { workspaceSlug: workspace, prompt: 'No provider means no fake video' }, admin)).response, 503);
    status((await call(`/api/workspaces/${workspace}/purchase-credits`, 'POST', {}, admin)).response, 501);
    status((await call(`/api/workspaces/${workspace}/upgrade`, 'POST', {}, admin)).response, 501);
  });

  it('renders a distinctive responsive interface with real sign-in and project navigation', async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const artifacts = process.env.ARCADE_TEST_ARTIFACTS;
    if (artifacts) await mkdir(artifacts, { recursive: true });
    try {
      await page.goto(base); await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.fonts.check('16px "Mona Sans"')), true);
      if (artifacts) await page.screenshot({ path: path.join(artifacts, 'production-home-desktop.png'), fullPage: true });
      await page.goto(`${base}/auth`);
      await page.getByLabel(/email/i).fill('operator@studio.test'); await page.getByLabel(/^password$/i).fill(password);
      await page.locator('form button').last().click();
      await page.waitForURL(`**/workspaces/${workspace}`);
      await page.getByRole('heading', { name: /make your product/i }).waitFor();
      if (artifacts) await page.screenshot({ path: path.join(artifacts, 'production-workspace-desktop.png'), fullPage: true });
      await page.getByLabel(/project name/i).fill('Browser-created walkthrough');
      await page.getByRole('button', { name: /create walkthrough/i }).click();
      await page.waitForURL('**/flows/*/edit');
      await page.getByRole('button', { name: 'Add step', exact: true }).click();
      const upload = page.waitForResponse((response) => response.url().endsWith('/api/uploads') && response.status() === 201);
      await page.locator('input[type=file]').setInputFiles({ name: 'browser-upload.png', mimeType: 'image/png', buffer: uploadedImage });
      await upload; await page.locator('img[src^="/api/media/"]').first().waitFor();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByText('All changes saved.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Publish', exact: true }).click();
      await page.getByRole('button', { name: 'Unpublish', exact: true }).waitFor();
      if (artifacts) await page.screenshot({ path: path.join(artifacts, 'production-flow-editor.png'), fullPage: true });
      const opened = context.waitForEvent('page');
      await page.getByRole('link', { name: /view published/i }).click();
      const shared = await opened;
      await shared.getByRole('heading', { name: 'Browser-created walkthrough' }).waitFor();
      await shared.getByRole('button', { name: 'Continue without', exact: true }).click();
      if (artifacts) await shared.screenshot({ path: path.join(artifacts, 'production-published-flow.png'), fullPage: true });
      await shared.close();
      for (const url of [`/flows/${flowId}/edit`, `/visual-projects/${visualId}/edit`, `/share/${shareId}`, `/share/${shareId}/guide`]) {
        await page.goto(base + url); await page.waitForTimeout(500);
        assert.equal(await page.locator('body').innerText().then((text) => /jack wolf|whoami\.genisisiq\.com|demo-invite-token/.test(text)), false);
      }
      await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${base}/workspaces/${workspace}`);
      await page.getByRole('heading', { name: /make your product/i }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'No horizontal mobile overflow.');
      if (artifacts) await page.screenshot({ path: path.join(artifacts, 'production-workspace-mobile.png'), fullPage: true });
      assert.deepEqual(errors, []);
    } finally { await context.close(); await browser.close(); }
  }, { timeout: 90000 });

  it('revokes public media on unpublish and database sessions on logout', async () => {
    status((await call(`/api/flows/${flowId}`, 'PATCH', { status: 'DRAFT' }, admin)).response, 200);
    status((await call(`/api/public/flows/${shareId}`)).response, 404);
    status(await fetch(base + imageUrl), 404);
    status((await call('/api/auth/logout', 'POST', undefined, admin)).response, 200);
    status((await call('/api/me', 'GET', undefined, admin)).response, 401);
    const session = await call<{ user?: unknown }>('/api/auth/session', 'GET', undefined, admin); assert.equal(session.data.user, undefined);
  });

  it('consumes password resets once and revokes existing sessions', async () => {
    const token = randomBytes(32).toString('base64url');
    const user = await db.user.findUniqueOrThrow({ where: { email: 'other@studio.test' } });
    await db.passwordCredential.update({ where: { userId: user.id }, data: { resetTokenHash: hashOpaqueToken(token), resetExpiresAt: new Date(Date.now() + 60000) } });
    const nextPassword = `${password}-reset`;
    status((await call('/api/auth/password/reset', 'POST', { token, password: nextPassword })).response, 200);
    status((await call('/api/auth/password/reset', 'POST', { token, password: nextPassword })).response, 410);
    status((await call('/api/me', 'GET', undefined, other)).response, 401);
    status((await call('/api/auth/password/login', 'POST', { email: 'other@studio.test', password })).response, 401);
    status((await call('/api/auth/password/login', 'POST', { email: 'other@studio.test', password: nextPassword })).response, 200);
  });
});
