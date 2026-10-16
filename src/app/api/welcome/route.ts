import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingRole: body.role || user.onboardingRole,
        onboardingGoalsJson: JSON.stringify(body.goals || ['Interactive Demos', 'AI Videos', 'AI Visuals']),
      },
    });
  }
  const workspace = await prisma.workspace.findFirst();
  return NextResponse.json({
    ok: true,
    redirectUrl: `/workspaces/${workspace?.slug || 'workspace-5p8xcsfv'}/home`,
  });
}
