import './environment';
import { prisma } from '../src/lib/prisma';
async function main() {
  const now = new Date();
  const [sessions, limits, registrations, invitations] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { expires: { lte: now } } }),
    prisma.requestLimit.deleteMany({ where: { resetsAt: { lte: now } } }),
    prisma.pendingRegistration.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.accountInvitation.updateMany({ where: { status: 'PENDING', expiresAt: { lte: now } }, data: { status: 'EXPIRED', tokenHash: null, activeForEmail: null } }),
  ]);
  await prisma.passwordCredential.updateMany({ where: { resetExpiresAt: { lte: now } }, data: { resetExpiresAt: null, resetTokenHash: null } });
  let events = 0; let leads = 0;
  const workspaces = await prisma.workspace.findMany({ select: { id: true, privacySettingsJson: true } });
  for (const workspace of workspaces) {
    const settings: { retentionDays?: number } = JSON.parse(workspace.privacySettingsJson);
    const days = settings.retentionDays ?? 365;
    if (!Number.isInteger(days) || days < 1 || days > 730) throw new Error(`Invalid privacy retention for workspace ${workspace.id}.`);
    const cutoff = new Date(now.getTime() - days * 86400000);
    const [e, l] = await prisma.$transaction([
      prisma.analyticsEvent.deleteMany({ where: { workspaceId: workspace.id, createdAt: { lt: cutoff } } }),
      prisma.leadCapture.deleteMany({ where: { workspaceId: workspace.id, createdAt: { lt: cutoff } } }),
    ]);
    events += e.count; leads += l.count;
  }
  console.log(JSON.stringify({ expiredSessions: sessions.count, expiredLimits: limits.count, expiredRegistrations: registrations.count, expiredInvitations: invitations.count, expiredEvents: events, expiredLeads: leads }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
