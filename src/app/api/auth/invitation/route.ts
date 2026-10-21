import { NextResponse } from 'next/server';
import { inspectAccountInvitation } from '@/lib/account-admission';
import { api, body, text } from '@/lib/api';

export const POST = api(async (request) => {
  const input = await body(request);
  return NextResponse.json({ mode: 'invitation-only', invitation: await inspectAccountInvitation(text(input.token, 'Invitation token', 256)) });
});
