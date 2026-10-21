import { NextResponse } from 'next/server';
import { accountAdmissionSecretLink, createAccountInvitation, listAccountInvitations } from '@/lib/account-admission';
import { api, body, requireAdmin, text, throttle } from '@/lib/api';

export const GET = api(async () => {
  await requireAdmin();
  return NextResponse.json({ mode: 'invitation-only', invitations: await listAccountInvitations() });
});
export const POST = api(async (request) => {
  const user = await requireAdmin();
  await throttle(`invitation:${user.id}`, 50, 3600);
  const input = await body(request);
  const grant = await createAccountInvitation({
    email: text(input.email, 'Email', 254), invitedById: user.id,
    expiresAt: input.expiresAt ? new Date(text(input.expiresAt, 'Expiry', 100)) : undefined,
  });
  return NextResponse.json({
    ok: true, invitation: { id: grant.invitation.id, email: grant.invitation.email, status: grant.invitation.status, expiresAt: grant.invitation.expiresAt, createdAt: grant.invitation.createdAt },
    acceptUrl: accountAdmissionSecretLink('/invite', grant.token, request.url), delivery: grant.delivery,
  }, { status: 201 });
});
