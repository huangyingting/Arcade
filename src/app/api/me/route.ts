import { NextResponse } from 'next/server';
import { api, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const GET = api(async () => {
  const user = await requireUser();
  const members = await prisma.workspaceMember.findMany({
    where: { userId: user.id }, include: { workspace: true }, orderBy: { joinedAt: 'asc' },
  });
  return NextResponse.json({ user, workspaces: members.map(({ workspace, role }) => ({ ...workspace, role })) });
});
