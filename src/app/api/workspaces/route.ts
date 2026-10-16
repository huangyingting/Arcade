import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const workspaces = await prisma.workspace.findMany({
    include: {
      teams: true,
      brandKits: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = (body.name || 'New Workspace').trim();
  const rawSlug = (body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
  const slug = rawSlug || `workspace-${Math.random().toString(36).slice(2, 8)}`;

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'wlfjck@gmail.com', name: 'jack wolf' },
    });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      iconUrl: body.iconUrl || null,
      planTier: 'FREE',
      monthlyCreditsQuota: 200,
      bonusCreditsBalance: 0,
      usedCreditsThisCycle: 0,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
      teams: {
        create: {
          name: 'Just me',
          slug: 'me',
          isPersonal: true,
        },
      },
    },
  });

  return NextResponse.json({ workspace });
}
