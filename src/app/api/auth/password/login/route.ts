import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticatePassword, setDatabaseSessionCookie } from '@/lib/account-admission';
import { api, body, HttpError, passwordInput, text, throttle } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const POST = api(async (request) => {
  const input = await body(request);
  const email = text(input.email, 'Email', 254).toLowerCase();
  const password = passwordInput(input.password);
  await throttle(`login:${createHash('sha256').update(email).digest('hex')}`);
  const result = await authenticatePassword({ email, password });
  if (!result) throw new HttpError(401, 'Email or password is incorrect.');
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: result.user.id }, include: { workspace: true }, orderBy: { joinedAt: 'asc' },
  });
  const response = NextResponse.json({
    ok: true,
    user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
    redirectUrl: member ? `/workspaces/${member.workspace.slug}` : '/workspaces/create',
  });
  setDatabaseSessionCookie(response, result.session);
  return response;
});
