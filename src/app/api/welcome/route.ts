import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, jsonField, requireUser, text } from '@/lib/api';

export const POST = api(async (request) => {
  const user = await requireUser();
  const input = await body(request);
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingRole: text(input.role, 'Role', 120), onboardingGoalsJson: jsonField(input.goals, 'array', 10) },
  });
  return NextResponse.json({ ok: true, redirectUrl: '/workspaces' });
});
