import './environment';
import { existsSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

async function main() {
  const demoWorkspaceId = 'fBtA4gu4pOa2JSDRyFh0';
  const demoUserId = 'u_jack_wolf';
  const removed = process.argv.includes('--files-only') ? { databaseUntouched: true } : await prisma.$transaction(async (tx) => {
    await tx.accountInvitation.deleteMany({ where: { id: { in: ['inv_accepted_jack', 'inv_pending_demo'] } } });
    const workspace = await tx.workspace.deleteMany({ where: { id: demoWorkspaceId, slug: 'workspace-5p8xcsfv' } });
    const user = await tx.user.findUnique({ where: { id: demoUserId }, include: { passwordCredential: true, memberships: true } });
    let userRemoved = false;
    if (user && !user.passwordCredential && !user.memberships.length) {
      await tx.user.delete({ where: { id: user.id } }); userRemoved = true;
    }
    return { workspacesRemoved: workspace.count, seedUserRemoved: userRemoved, retainedCredentialedAccount: Boolean(user?.passwordCredential) };
  });
  const publicRoot = path.resolve('public/uploads');
  const storage = path.resolve(process.env.ARCADE_STORAGE_DIR || 'storage');
  if (storage === path.resolve('public') || storage.startsWith(path.resolve('public') + path.sep)) throw new Error('Private storage must not be inside public/.');
  const quarantine = path.join(storage, 'legacy-quarantine', new Date().toISOString().replace(/[:.]/g, '-'));
  let moved = 0;
  for (const name of ['captures', 'audio', 'exports', 'files']) {
    const source = path.join(publicRoot, name);
    if (!existsSync(source)) continue;
    await mkdir(quarantine, { recursive: true });
    await rename(source, path.join(quarantine, name)); moved++;
  }
  console.log(JSON.stringify({ ...removed, publicUploadDirectoriesQuarantined: moved }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
