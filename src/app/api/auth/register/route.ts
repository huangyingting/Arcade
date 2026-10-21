import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { registerWithInvitation, setDatabaseSessionCookie } from '@/lib/account-admission';
import { api, body, passwordInput, text, throttle } from '@/lib/api';

export const POST = api(async (request) => {
  const input = await body(request);
  const token = text(input.token, 'Invitation token', 256);
  await throttle(`register:${createHash('sha256').update(token).digest('hex')}`, 8);
  const result = await registerWithInvitation({
    token, email: text(input.email, 'Email', 254),
    password: passwordInput(input.password), name: text(input.name, 'Name', 120),
  });
  const response = NextResponse.json({ ok: true, redirectUrl: '/workspaces/create' }, { status: 201 });
  setDatabaseSessionCookie(response, result.session);
  return response;
});
