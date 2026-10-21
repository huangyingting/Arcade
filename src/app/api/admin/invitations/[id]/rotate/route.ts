import { NextResponse } from 'next/server';
import { rotateAccountInvitation, accountAdmissionSecretLink } from '@/lib/account-admission';
import { api, body, requireAdmin, text } from '@/lib/api';

export const POST = api<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireAdmin();
  const input = await body(request);
  const grant = await rotateAccountInvitation((await params).id, input.expiresAt ? new Date(text(input.expiresAt, 'Expiry', 100)) : undefined);
  return NextResponse.json({ ok: true, invitation: { id: grant.invitation.id, status: grant.invitation.status }, acceptUrl: accountAdmissionSecretLink('/invite', grant.token, request.url), delivery: grant.delivery });
});
