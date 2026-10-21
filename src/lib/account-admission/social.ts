import { prisma } from '@/lib/prisma';
import { isValidAccountEmail, normalizeAccountEmail } from './policy';

export function verifiedProviderEmail(
  provider: string,
  profile: Record<string, unknown> | undefined
): string | null {
  if (!profile) return null;
  if (provider === 'google') {
    const email = typeof profile.email === 'string' ? profile.email : '';
    const verified = profile.email_verified === true;
    return verified && isValidAccountEmail(email) ? normalizeAccountEmail(email) : null;
  }
  return null;
}

export async function authorizeSocialSignIn(params: {
  provider: string;
  providerAccountId: string;
  type?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  sessionState?: string;
  profile?: Record<string, unknown>;
  userName?: string | null;
  userImage?: string | null;
}): Promise<true | string> {
  const now = new Date();

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    return true;
  }

  const verifiedEmail = verifiedProviderEmail(params.provider, params.profile);
  if (!verifiedEmail) {
    return '/auth?error=OAuthEmailUnverified';
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: verifiedEmail },
  });

  if (existingUser) {
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        type: params.type || 'oauth',
        provider: params.provider,
        providerAccountId: params.providerAccountId,
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        expires_at: params.expiresAt,
        token_type: params.tokenType,
        scope: params.scope,
        id_token: params.idToken,
        session_state: params.sessionState,
      },
    });
    if (!existingUser.emailVerified) await prisma.user.update({ where: { id: existingUser.id }, data: { emailVerified: now } });
    return true;
  }

  const invitation = await prisma.accountInvitation.findUnique({
    where: { activeForEmail: verifiedEmail },
  });

  if (invitation && invitation.status === 'PENDING' && invitation.expiresAt > now) {
    const displayName =
      params.userName?.trim() ||
      (typeof params.profile?.name === 'string' && params.profile.name.trim()) ||
      verifiedEmail.split('@')[0];

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.accountInvitation.updateMany({
        where: { id: invitation.id, activeForEmail: verifiedEmail, status: 'PENDING', expiresAt: { gt: now } },
        data: { status: 'ACCEPTED', acceptedAt: now, activeForEmail: null, tokenHash: null },
      });
      if (!claimed.count) throw new Error('The account invitation is no longer active.');
      const user = await tx.user.create({
        data: {
          email: verifiedEmail,
          name: displayName,
          image: params.userImage || null,
          role: 'Creator',
          emailVerified: now,
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          type: params.type || 'oauth',
          provider: params.provider,
          providerAccountId: params.providerAccountId,
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
          expires_at: params.expiresAt,
          token_type: params.tokenType,
          scope: params.scope,
          id_token: params.idToken,
          session_state: params.sessionState,
        },
      });

      await tx.accountInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
          acceptedAt: now,
          activeForEmail: null,
          tokenHash: null,
        },
      });
    });

    return true;
  }

  return '/auth?error=InvitationRequired';
}
