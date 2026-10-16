import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/account-admission';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    const password = String(body.password || '');
    await resetPassword({ token, password });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Password reset failed.' },
      { status: err?.status || 400 }
    );
  }
}
