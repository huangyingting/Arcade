import { NextResponse } from 'next/server';
import {
  accountAdmissionSecretLink,
  rotateAccountInvitation,
} from '@/lib/account-admission';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : undefined;

    const grant = await rotateAccountInvitation(params.id, expiresAt);
    const acceptUrl = accountAdmissionSecretLink(
      '/invite',
      grant.token,
      request.url
    );

    return NextResponse.json({
      ok: true,
      invitation: {
        id: grant.invitation.id,
        email: grant.invitation.email,
        status: grant.invitation.status,
        expiresAt: grant.invitation.expiresAt,
        createdAt: grant.invitation.createdAt,
        acceptedAt: grant.invitation.acceptedAt,
        revokedAt: grant.invitation.revokedAt,
      },
      token: grant.token,
      acceptUrl,
      delivery: grant.delivery,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not rotate invitation.' },
      { status: err?.status || 400 }
    );
  }
}
