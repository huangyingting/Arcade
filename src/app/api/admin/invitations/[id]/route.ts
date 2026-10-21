import { NextResponse } from 'next/server';
import { revokeAccountInvitation } from '@/lib/account-admission';
import { api, requireAdmin } from '@/lib/api';

export const DELETE = api<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  await requireAdmin();
  const invitation = await revokeAccountInvitation((await params).id);
  return NextResponse.json({ ok: true, invitation: { id: invitation.id, email: invitation.email, status: invitation.status } });
});
