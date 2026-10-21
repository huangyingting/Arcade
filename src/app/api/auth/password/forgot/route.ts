import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { accountAdmissionSecretLink, requestPasswordReset } from '@/lib/account-admission';
import { api, body, text, throttle } from '@/lib/api';
import { requireEmailDelivery, sendEmail } from '@/lib/email';

export const POST = api(async (request) => {
  requireEmailDelivery();
  const input = await body(request);
  const email = text(input.email, 'Email', 254).toLowerCase();
  await throttle(`recovery:${createHash('sha256').update(email).digest('hex')}`, 3, 3600);
  const reset = await requestPasswordReset(email);
  if (reset) await sendEmail({
    to: reset.email, subject: 'Reset your Arcade password',
    text: `Use this one-time link within one hour to reset your password:\n${accountAdmissionSecretLink('/reset-password', reset.token, request.url)}\n\nIf you did not request this, ignore this email.`,
  });
  return NextResponse.json({ ok: true, message: 'If an account exists, a password reset email has been sent.' }, { status: 202 });
});
