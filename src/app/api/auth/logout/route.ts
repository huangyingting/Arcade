import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIES } from '@/lib/account-admission/session';
import { api } from '@/lib/api';

export const POST = api(async () => {
  const jar = await cookies();
  const tokens = SESSION_COOKIES.map((name) => jar.get(name)?.value).filter((token): token is string => Boolean(token));
  if (tokens.length) await prisma.session.deleteMany({ where: { sessionToken: { in: tokens } } });
  const response = NextResponse.json({ ok: true });
  for (const name of [...SESSION_COOKIES, 'ArcadeApp.AuthUserTokens']) response.cookies.delete(name);
  return response;
});
