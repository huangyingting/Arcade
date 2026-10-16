import { Prisma, type AccountInvitation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { isValidAccountEmail, normalizeAccountEmail } from './policy';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateAccountInvitationInput = {
  email: string;
  invitedById?: string;
  expiresAt?: Date;
};

export type AccountInvitationGrant = {
  invitation: AccountInvitation;
  token: string;
  delivery: { queued: boolean; reason?: string };
};

export type PublicInvitationView = {
  id: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'invalid';
  maskedEmail: string | null;
  email?: string;
  expiresAt: Date | null;
};

function invitationExpiry(now: Date, requested?: Date): Date {
  const expiresAt =
    requested ?? new Date(now.getTime() + DEFAULT_INVITATION_TTL_MS);
  if (expiresAt.getTime() <= now.getTime()) {
    throw new AccountAdmissionError(
      400,
      'invalid_expiry',
      'Invitation expiry must be in the future.'
    );
  }
  return expiresAt;
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const result = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return result.count;
}

export async function createAccountInvitation(
  input: CreateAccountInvitationInput
): Promise<AccountInvitationGrant> {
  const normalizedEmail = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }

  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const expiresAt = invitationExpiry(now, input.expiresAt);

  try {
    await prisma.accountInvitation.updateMany({
      where: {
        activeForEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new AccountAdmissionError(
        409,
        'already_member',
        'An Arcade account already exists for this email.'
      );
    }

    const active = await prisma.accountInvitation.findUnique({
      where: { activeForEmail: normalizedEmail },
      select: { id: true },
    });
    if (active) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }

    let inviterId = input.invitedById;
    if (!inviterId) {
      const adminUser = await prisma.user.findFirst();
      inviterId = adminUser?.id;
    }

    const invitation = await prisma.accountInvitation.create({
      data: {
        email: input.email.trim(),
        normalizedEmail,
        activeForEmail: normalizedEmail,
        tokenHash,
        invitedById: inviterId || null,
        expiresAt,
      },
    });

    await prisma.accountEmailOutbox.create({
      data: {
        invitationId: invitation.id,
        payload: JSON.stringify({
          type: 'account_invitation',
          email: invitation.email,
          expiresAt: invitation.expiresAt.toISOString(),
        }),
        status: 'pending',
        expiresAt: invitation.expiresAt,
      },
    });

    return {
      invitation,
      token,
      delivery: { queued: true },
    };
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }
    throw error;
  }
}

export async function inspectAccountInvitation(
  token: string,
  now = new Date()
): Promise<PublicInvitationView> {
  const tokenHash = hashOpaqueToken(token);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return { id: '', status: 'invalid', maskedEmail: null, expiresAt: null };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    return {
      id: invitation.id,
      status: 'expired',
      maskedEmail: maskEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    id: invitation.id,
    status: invitation.status.toLowerCase() as PublicInvitationView['status'],
    maskedEmail: maskEmail(invitation.email),
    email: invitation.email,
    expiresAt: invitation.expiresAt,
  };
}

export async function revokeAccountInvitation(
  id: string
): Promise<AccountInvitation> {
  const now = new Date();
  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status === 'REVOKED') {
    return invitation;
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be revoked.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return updated;
}

export async function rotateAccountInvitation(
  id: string,
  expiresAt?: Date
): Promise<AccountInvitationGrant> {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const nextExpiry = invitationExpiry(now, expiresAt);

  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status !== 'PENDING' || invitation.expiresAt <= now) {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be rotated.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: { tokenHash, expiresAt: nextExpiry },
  });

  return {
    invitation: updated,
    token,
    delivery: { queued: true },
  };
}

export async function listAccountInvitations() {
  await expirePendingInvitations();
  return prisma.accountInvitation.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
      acceptedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
