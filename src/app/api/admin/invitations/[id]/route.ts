import { NextResponse } from 'next/server';
import { revokeAccountInvitation } from '@/lib/account-admission';

export async function DELETE(
  _request: Request,
  { params: rawParams }: { params: Promise<{ id: string }> }
) {
  const params = await rawParams;
  try {
    const invitation = await revokeAccountInvitation(params.id);
    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        acceptedAt: invitation.acceptedAt,
        revokedAt: invitation.revokedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not revoke invitation.' },
      { status: err?.status || 400 }
    );
  }
}
