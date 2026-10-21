import './environment';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import { storageRoot } from '../src/lib/production-engine/storage';

const schema = 'prisma/schema.prisma';
const baseline = '20260720000000_initial';
const approved = [
  'ALTER TABLE "AnalyticsEvent" ADD COLUMN "dedupeKey" TEXT',
  'ALTER TABLE "LeadCapture" ADD COLUMN "consentAt" DATETIME',
  'CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key" ON "AnalyticsEvent"("dedupeKey")',
  'CREATE INDEX "AnalyticsEvent_workspaceId_createdAt_idx" ON "AnalyticsEvent"("workspaceId", "createdAt")',
  'CREATE INDEX "LeadCapture_workspaceId_createdAt_idx" ON "LeadCapture"("workspaceId", "createdAt")',
];
function statements(sql: string) {
  return sql.replace(/--[^\n]*/g, '').split(';').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
}
function cli(args: string[]) {
  return execFileSync('npx', ['prisma', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function diff() {
  return statements(cli(['migrate', 'diff', '--from-config-datasource', '--to-schema', schema, '--script']));
}
async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith('file:') || url === 'file::memory:') throw new Error('This upgrade supports an existing file-backed SQLite installation only.');
  if (process.env.PRISMA_SCHEMA_PATH && process.env.PRISMA_SCHEMA_PATH !== schema) throw new Error('Select the SQLite schema before running this upgrade.');
  const file = url.slice(5);
  const database = path.isAbsolute(file) ? file : path.resolve('prisma', file);
  const changes = diff();
  if (changes.some((change) => !approved.includes(change))) throw new Error('The database has differences outside the five reviewed additive changes. No changes were applied; review its schema separately.');
  const historyExists = await prisma.$queryRaw<{ name: string }[]>`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'`;
  const history = historyExists.length ? await prisma.$queryRawUnsafe<{ migration_name: string; finished_at: unknown; rolled_back_at: unknown }[]>('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"') : [];
  if (history.some((row) => row.migration_name !== baseline || !row.finished_at || row.rolled_back_at)) throw new Error('Unexpected migration history. Review it before baselining this installation.');
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ apply: false, statements: changes, baselineRequired: !history.length }));
    return;
  }
  let backup: string | null = null;
  if (changes.length || !history.length) {
    const directory = path.join(storageRoot(), 'database-backups');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    backup = path.join(directory, `${path.basename(database)}-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
    await prisma.$executeRawUnsafe('VACUUM INTO ?', backup);
    await chmod(backup, 0o600);
  }
  if (changes.length) {
    await prisma.$transaction(async (tx) => {
      const tables = await tx.$queryRaw<{ name: string }[]>`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations' ORDER BY name`;
      const countRows = async () => {
        const result: Record<string, string> = {};
        for (const { name } of tables) {
          const identifier = `"${name.replace(/"/g, '""')}"`;
          const [row] = await tx.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*) AS count FROM ${identifier}`);
          result[name] = String(row.count);
        }
        return JSON.stringify(result);
      };
      const before = await countRows();
      for (const statement of changes) await tx.$executeRawUnsafe(statement);
      if (before !== await countRows()) throw new Error('Row counts changed during the upgrade; rolling back.');
      const integrity = await tx.$queryRawUnsafe<{ integrity_check: string }[]>('PRAGMA integrity_check');
      if (integrity.some((row) => row.integrity_check !== 'ok')) throw new Error('SQLite integrity verification failed; rolling back.');
      const foreignKeys = await tx.$queryRawUnsafe<unknown[]>('PRAGMA foreign_key_check');
      if (foreignKeys.length) throw new Error('Foreign-key verification failed; rolling back.');
    }, { timeout: 60000 });
  }
  if (diff().length) throw new Error('Schema verification failed. The baseline has not been recorded.');
  if (!history.length) cli(['migrate', 'resolve', '--applied', baseline]);
  await chmod(database, 0o600);
  console.log(JSON.stringify({ ok: true, appliedStatements: changes.length, rowsPreserved: true, backup, baseline }));
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
