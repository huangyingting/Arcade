import { NextResponse } from 'next/server';
import {
  accountAdmissionMode,
  accountAdmissionSecretLink,
  createAccountInvitation,
  listAccountInvitations,
} from '@/lib/account-admission';

export async function GET() {
  const invitations = await listAccountInvitations();
  return NextResponse.json({
    mode: accountAdmissionMode(),
    invitations,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : undefined;

    const grant = await createAccountInvitation({
      email,
      expiresAt,
    });

    const acceptUrl = accountAdmissionSecretLink(
      '/invite',
      grant.token,
      request.url
    );

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not create invitation.' },
      { status: err?.status || 400 }
    );
  }
}
