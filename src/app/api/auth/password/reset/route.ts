import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/account-admission';
import { api, body, passwordInput, text, throttle } from '@/lib/api';

export const POST = api(async (request) => {
  const input = await body(request);
  const token = text(input.token, 'Reset token', 256);
  await throttle(`reset:${createHash('sha256').update(token).digest('hex')}`, 8);
  await resetPassword({ token, password: passwordInput(input.password) });
  return NextResponse.json({ ok: true });
});
