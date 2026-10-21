import './environment';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import { verifyPassword } from '../src/lib/account-admission/passwords';
import { storageRoot } from '../src/lib/production-engine/storage';

async function main() {
  const demoWorkspaceId = 'fBtA4gu4pOa2JSDRyFh0';
  const demoUserId = 'u_jack_wolf';
  const publicRoot = path.resolve('public/uploads');
  const storage = storageRoot();
  const retiredPassword = process.argv.includes('--retired-password-stdin') ? readFileSync(0, 'utf8').replace(/\r?\n$/, '') : '';
  if (process.argv.includes('--retired-password-stdin') && (!retiredPassword || retiredPassword.length > 128)) throw new Error('Supply the retired demonstration password on standard input.');
  const removed = process.argv.includes('--files-only') ? { databaseUntouched: true } : await prisma.$transaction(async (tx) => {
    const obsoleteEmailQueue = await tx.accountEmailOutbox.deleteMany();
    await tx.accountInvitation.deleteMany({ where: { id: { in: ['inv_accepted_jack', 'inv_pending_demo'] } } });
    const workspace = await tx.workspace.deleteMany({ where: { id: demoWorkspaceId, slug: 'workspace-5p8xcsfv' } });
    const user = await tx.user.findUnique({ where: { id: demoUserId }, include: { passwordCredential: true, memberships: true } });
    let userRemoved = false;
    const retiredCredential = Boolean(user?.passwordCredential && retiredPassword && await verifyPassword(retiredPassword, user.passwordCredential.passwordHash));
    if (retiredCredential) {
      await tx.accountInvitation.deleteMany({ where: { invitedById: demoUserId } });
      await tx.passwordCredential.delete({ where: { userId: demoUserId } });
      await tx.session.deleteMany({ where: { userId: demoUserId } });
      await tx.user.update({ where: { id: demoUserId }, data: { passwordHash: null } });
    }
    if (user && (!user.passwordCredential || retiredCredential) && !user.memberships.length) {
      await tx.user.delete({ where: { id: user.id } }); userRemoved = true;
    }
    return { workspacesRemoved: workspace.count, seedUserRemoved: userRemoved, retiredCredentialDisabled: retiredCredential, retainedCredentialedAccount: Boolean(user?.passwordCredential && !retiredCredential), obsoleteEmailQueueRemoved: obsoleteEmailQueue.count };
  });
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
