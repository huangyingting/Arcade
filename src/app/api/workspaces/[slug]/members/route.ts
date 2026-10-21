import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, publicUser, text, workspaceAccess } from '@/lib/api';
import { isValidAccountEmail } from '@/lib/account-admission/policy';

type Context = { params: Promise<{ slug: string }> };
export const POST = api<Context>(async (request, { params }) => {
  const { workspace, role } = await workspaceAccess((await params).slug, true, true);
  const input = await body(request);
  const email = text(input.email, 'Email', 254).toLowerCase();
  if (!isValidAccountEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  const memberRole = text(input.role, 'Workspace role', 20);
  if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(memberRole)) throw new HttpError(400, 'Choose an administrator, editor or viewer role.');
  if (memberRole === 'ADMIN' && role !== 'OWNER') throw new HttpError(403, 'Only a workspace owner can appoint an administrator.');
  const target = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  if (!target?.emailVerified) throw new HttpError(400, 'This person needs an accepted account invitation before joining a workspace. Ask your deployment administrator to invite them first.');
  const member = await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: target.id, role: memberRole }, include: { user: { select: publicUser } } });
  return NextResponse.json({ member }, { status: 201 });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { workspace, role, user } = await workspaceAccess((await params).slug, true, true);
  const input = await body(request);
  const id = text(input.memberId, 'Member ID', 100);
  const member = await prisma.workspaceMember.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!member) throw new HttpError(404, 'Member not found.');
  if (member.role === 'OWNER' || member.userId === user.id) throw new HttpError(403, 'Owners and your own membership cannot be changed here.');
  if ((member.role === 'ADMIN' || input.role === 'ADMIN') && role !== 'OWNER') throw new HttpError(403, 'Only a workspace owner can change administrators.');
  if (input.remove === true) {
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({ where: { userId: member.userId, team: { workspaceId: workspace.id } } });
      await tx.workspaceMember.delete({ where: { id: member.id } });
    });
    return NextResponse.json({ ok: true });
  }
  if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(String(input.role))) throw new HttpError(400, 'Choose an administrator, editor or viewer role.');
  return NextResponse.json({ member: await prisma.workspaceMember.update({ where: { id: member.id }, data: { role: String(input.role) }, include: { user: { select: publicUser } } }) });
});
