import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export default async function WorkspaceEntry() {
  const user = await currentUser();
  if (!user) redirect('/auth');
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id }, include: { workspace: true }, orderBy: { joinedAt: 'asc' },
  });
  redirect(member ? `/workspaces/${member.workspace.slug}` : '/workspaces/create');
}
