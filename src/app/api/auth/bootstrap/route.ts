import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  AccountAdmissionError,
  bootstrapAdmin,
  getBootstrapStatus,
} from '@/lib/account-admission';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getBootstrapStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not inspect bootstrap status.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await getServerSession(authOptions);
    const isAdminSession = (session?.user as any)?.role === 'Admin';

    const result = await bootstrapAdmin({
      email: String(body.email || ''),
      password: String(body.password || ''),
      name: body.name ? String(body.name) : null,
      setupToken: body.setupToken ? String(body.setupToken) : null,
      allowExistingAdmin: isAdminSession,
    });

    return NextResponse.json(
      {
        ok: true,
        created: result.created,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        redirectTo: '/admin/invitations',
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AccountAdmissionError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'Bootstrap failed.' },
      { status: 500 }
    );
  }
}
