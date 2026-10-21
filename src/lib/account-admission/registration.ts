import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import {
  accountAdmissionMode,
  isValidAccountEmail,
  normalizeAccountEmail,
} from './policy';
import { createDatabaseSession } from './session';
import { hashOpaqueToken } from './tokens';

export type RegistrationInput = {
  email: string;
  password: string;
  name?: string | null;
};

export type InvitationRegistrationInput = RegistrationInput & {
  token: string;
};

function normalizedName(name: string | null | undefined): string {
  const value = name?.trim();
  return value ? value.slice(0, 120) : 'Arcade Creator';
}

function registrationEmail(email: string): string {
  if (!isValidAccountEmail(email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }
  return normalizeAccountEmail(email);
}

export async function registerWithInvitation(
  input: InvitationRegistrationInput
) {
  if (accountAdmissionMode() !== 'invitation-only') {
    throw new AccountAdmissionError(
      409,
      'mode_mismatch',
      'Invitation registration is not enabled.'
    );
  }

  const normalizedEmail = registrationEmail(input.email);
  const tokenHash = hashOpaqueToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
  });
  if (!invitation || invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      410,
      'invalid_invitation',
      'This invitation is invalid or no longer active.'
    );
  }

  if (invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, tokenHash, status: 'PENDING', expiresAt: { lte: now } },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This invitation has expired.'
    );
  }

  if (invitation.normalizedEmail !== normalizedEmail) {
    throw new AccountAdmissionError(
      403,
      'email_mismatch',
      'The invitation does not match this email address.'
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'An Arcade account already exists for this email.'
    );
  }

  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash, expiresAt: { gt: now } },
      data: { status: 'ACCEPTED', acceptedAt: now, activeForEmail: null, tokenHash: null },
    });
    if (!claimed.count) throw new AccountAdmissionError(410, 'invalid_invitation', 'This invitation is no longer active.');
    const created = await tx.user.create({
    data: {
      email: normalizedEmail,
      emailVerified: now,
      name: normalizedName(input.name),
      role: 'Creator',
      passwordCredential: {
        create: { passwordHash, passwordChangedAt: now },
      },
    },
    });
    await tx.accountInvitation.update({ where: { id: invitation.id }, data: { acceptedById: created.id } });
    return created;
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session };
}
