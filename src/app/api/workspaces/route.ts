import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, requireUser, text, throttle } from '@/lib/api';

export const GET = api(async () => {
  const user = await requireUser();
  const members = await prisma.workspaceMember.findMany({
    where: { userId: user.id }, include: { workspace: { include: { teams: true, brandKits: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  return NextResponse.json({ workspaces: members.map(({ workspace, role }) => ({ ...workspace, role })) });
});

export const POST = api(async (request) => {
  const user = await requireUser();
  await throttle(`workspace:${user.id}`, 10, 3600);
  const input = await body(request);
  const name = text(input.name, 'Workspace name', 100);
  const slug = input.slug === undefined
    ? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'studio'}-${randomBytes(3).toString('hex')}`
    : text(input.slug, 'Workspace URL', 64);
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slug) || ['create', 'api', 'admin'].includes(slug)) {
    throw new HttpError(400, 'Use 3–64 lowercase letters, numbers and hyphens for the workspace URL.');
  }
  const workspace = await prisma.workspace.create({
    data: {
      name, slug,
      members: { create: { userId: user.id, role: 'OWNER' } },
      teams: { create: { name: 'Personal', slug: 'me', isPersonal: true, members: { create: { userId: user.id } } } },
    },
  });
  return NextResponse.json({ workspace }, { status: 201 });
});
