import { after, before, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../src/lib/account-admission/passwords';

let temp: string;
let db: PrismaClient;
let env: NodeJS.ProcessEnv;
before(async () => {
  temp = await mkdtemp(path.join(tmpdir(), 'arcade-upgrade-'));
  const url = `file:${path.join(temp, 'legacy.db')}`;
  env = { ...process.env, DATABASE_URL: url, PRISMA_SCHEMA_PATH: 'prisma/schema.prisma', ARCADE_STORAGE_DIR: path.join(temp, 'storage') };
  db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  const current = await readFile('prisma/migrations/sqlite/20260720000000_initial/migration.sql', 'utf8');
  const legacy = current
    .replace(/^\s*"dedupeKey" TEXT,\r?\n/m, '')
    .replace(/^\s*"consentAt" DATETIME,\r?\n/m, '')
    .replace(/^CREATE (?:UNIQUE )?INDEX "(?:AnalyticsEvent_dedupeKey_key|AnalyticsEvent_workspaceId_createdAt_idx|LeadCapture_workspaceId_createdAt_idx)"[^\n]+;$/gm, '');
  assert.notEqual(current, legacy);
  for (const statement of legacy.replace(/--[^\n]*/g, '').split(';').map((s) => s.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
  await db.$executeRawUnsafe('INSERT INTO "User" ("id","name","email","updatedAt") VALUES (?,?,?,CURRENT_TIMESTAMP)', 'real-operator', 'Existing operator', 'operator@upgrade.test');
  await db.$executeRawUnsafe('INSERT INTO "Workspace" ("id","name","slug","updatedAt") VALUES (?,?,?,CURRENT_TIMESTAMP)', 'real-workspace', 'Existing customer work', 'existing-work');
  await db.$executeRawUnsafe('INSERT INTO "AnalyticsEvent" ("id","workspaceId","assetType","assetId","assetTitle","visitorId","eventType") VALUES (?,?,?,?,?,?,?)', 'existing-event', 'real-workspace', 'FLOW', 'existing-flow', 'Existing story', 'anonymous-visitor', 'VIEW');
  await db.$executeRawUnsafe('INSERT INTO "LeadCapture" ("id","workspaceId","flowId","flowTitle","email") VALUES (?,?,?,?,?)', 'existing-lead', 'real-workspace', 'existing-flow', 'Existing story', 'lead@upgrade.test');
});
after(async () => { await db?.$disconnect(); if (temp) await rm(temp, { recursive: true, force: true }); });
function upgrade(apply = false) {
  const output = execFileSync('npx', ['tsx', 'scripts/upgrade-legacy-sqlite.ts', ...(apply ? ['--apply'] : [])], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(output.trim().split('\n').at(-1)!);
}
it('previews only five additive statements without modifying the legacy database', () => {
  const preview = upgrade();
  assert.equal(preview.apply, false); assert.equal(preview.statements.length, 5); assert.equal(preview.baselineRequired, true);
});
it('upgrades and baselines without deleting or replacing existing rows', async () => {
  const result = upgrade(true);
  assert.equal(result.appliedStatements, 5); assert.equal(result.rowsPreserved, true);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: 'real-operator' } })).name, 'Existing operator');
  assert.equal((await db.workspace.findUniqueOrThrow({ where: { id: 'real-workspace' } })).name, 'Existing customer work');
  assert.equal((await db.analyticsEvent.findUniqueOrThrow({ where: { id: 'existing-event' } })).dedupeKey, null);
  assert.equal((await db.leadCapture.findUniqueOrThrow({ where: { id: 'existing-lead' } })).consentAt, null);
  assert.equal((await readdir(path.join(temp, 'storage/database-backups'))).length, 1);
  const history = await db.$queryRawUnsafe<{ migration_name: string }[]>('SELECT migration_name FROM "_prisma_migrations"');
  assert.deepEqual(history.map((row) => row.migration_name), ['20260720000000_initial']);
});
it('is idempotent and refuses unrelated schema drift before making changes', async () => {
  assert.equal(upgrade(true).appliedStatements, 0);
  assert.equal((await readdir(path.join(temp, 'storage/database-backups'))).length, 1);
  await db.$executeRawUnsafe('ALTER TABLE "Workspace" ADD COLUMN "UnexpectedCustomField" TEXT');
  assert.throws(() => upgrade(true), /outside the five reviewed additive changes/);
  assert.equal(await db.workspace.count(), 1);
});
it('removes known demo records but preserves a seed account with a changed password', async () => {
  const secret = randomBytes(24).toString('base64url');
  await db.user.create({ data: { id: 'u_jack_wolf', name: 'Operator with a changed password', email: 'retained@cleanup.test', emailVerified: new Date(), passwordCredential: { create: { passwordHash: await hashPassword(secret) } } } });
  await db.workspace.create({ data: { id: 'fBtA4gu4pOa2JSDRyFh0', name: 'Known prototype workspace', slug: 'workspace-5p8xcsfv' } });
  await db.accountEmailOutbox.create({ data: { payload: '{}', expiresAt: new Date(Date.now() + 60000) } });
  execFileSync('npx', ['tsx', 'scripts/remove-demo-data.ts'], { env, stdio: 'pipe' });
  assert.equal(await db.workspace.count(), 1);
  assert.ok(await db.user.findUnique({ where: { id: 'real-operator' } }));
  assert.ok(await db.passwordCredential.findUnique({ where: { userId: 'u_jack_wolf' } }));
  assert.equal(await db.accountEmailOutbox.count(), 0);
});
it('removes the seed account only after verifying a supplied retired credential', async () => {
  const retired = randomBytes(24).toString('base64url');
  await db.passwordCredential.update({ where: { userId: 'u_jack_wolf' }, data: { passwordHash: await hashPassword(retired) } });
  const output = execFileSync('npx', ['tsx', 'scripts/remove-demo-data.ts', '--retired-password-stdin'], { env, input: retired, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const result = JSON.parse(output.trim());
  assert.equal(result.retiredCredentialDisabled, true); assert.equal(result.seedUserRemoved, true);
  assert.equal(await db.user.findUnique({ where: { id: 'u_jack_wolf' } }), null);
  assert.ok(await db.user.findUnique({ where: { id: 'real-operator' } }));
  assert.equal(await db.workspace.count(), 1);
});
it('disables a retired password without deleting real workspace membership or content', async () => {
  const retired = randomBytes(24).toString('base64url');
  await db.user.create({ data: { id: 'u_jack_wolf', name: 'Existing account', email: 'existing@cleanup.test', emailVerified: new Date(), passwordCredential: { create: { passwordHash: await hashPassword(retired) } }, memberships: { create: { workspaceId: 'real-workspace', role: 'OWNER' } }, sessions: { create: { sessionToken: randomBytes(32).toString('base64url'), expires: new Date(Date.now() + 60000) } } } });
  execFileSync('npx', ['tsx', 'scripts/remove-demo-data.ts', '--retired-password-stdin'], { env, input: retired, stdio: ['pipe', 'pipe', 'pipe'] });
  assert.ok(await db.user.findUnique({ where: { id: 'u_jack_wolf' } }));
  assert.equal(await db.passwordCredential.findUnique({ where: { userId: 'u_jack_wolf' } }), null);
  assert.equal(await db.session.count({ where: { userId: 'u_jack_wolf' } }), 0);
  assert.equal(await db.workspace.count(), 1);
  assert.equal(await db.workspaceMember.count({ where: { userId: 'u_jack_wolf' } }), 1);
});
