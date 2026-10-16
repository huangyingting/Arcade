import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIES, SESSION_COOKIE_NAME } from '@/lib/account-admission';

export async function POST() {
  const cookieStore = cookies();
  for (const name of SESSION_COOKIES) {
    const token = cookieStore.get(name)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { sessionToken: token } });
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
