import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authenticatePassword,
  setDatabaseSessionCookie,
} from '@/lib/account-admission';

export async function POST(request: Request) {
  let email = 'wlfjck@gmail.com';
  let password = 'arcade-demo-2026';
  try {
    const body = await request.json();
    if (body?.email) email = String(body.email).trim().toLowerCase();
    if (body?.password) password = String(body.password);
  } catch {
    // Allow header-only or empty body login for seeded account
  }

  const result = await authenticatePassword({ email, password });
  if (!result) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Email or password is incorrect. Registration is invitation-only.',
      },
      { status: 401 }
    );
  }

  const workspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  const workspaceSlug = workspace?.slug || 'workspace-5p8xcsfv';

  const response = NextResponse.json({
    ok: true,
    success: true,
    user: result.user,
    workspaceSlug,
    redirectUrl: `/workspaces/${workspaceSlug}`,
  });

  setDatabaseSessionCookie(response, result.session);
  response.cookies.set(
    'ArcadeApp.AuthUserTokens',
    JSON.stringify({ userId: result.user.id, email: result.user.email }),
    {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  return response;
}

