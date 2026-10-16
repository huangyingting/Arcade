import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import {
  accountAdmissionMode,
  isValidAccountEmail,
  normalizeAccountEmail,
} from './policy';
import { createDatabaseSession } from './session';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const PUBLIC_REGISTRATION_TTL_MS = 24 * 60 * 60 * 1000;

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
    await prisma.accountInvitation.update({
      where: { id: invitation.id },
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

  const defaultWorkspace = await prisma.workspace.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      emailVerified: now,
      name: normalizedName(input.name),
      role: 'Creator',
      passwordHash,
      passwordCredential: {
        create: { passwordHash, passwordChangedAt: now },
      },
    },
  });

  if (defaultWorkspace) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: defaultWorkspace.id,
        userId: user.id,
        role: 'CREATOR',
      },
    });
  }

  await prisma.accountInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      acceptedById: user.id,
      acceptedAt: now,
      activeForEmail: null,
      tokenHash: null,
    },
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session, workspaceSlug: defaultWorkspace?.slug || 'workspace-5p8xcsfv' };
}

export async function beginPublicRegistration(input: RegistrationInput) {
  if (accountAdmissionMode() !== 'public') {
    throw new AccountAdmissionError(
      403,
      'invitation_required',
      'An invitation is required to create an account.'
    );
  }

  const normalizedEmail = registrationEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PUBLIC_REGISTRATION_TTL_MS);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existing) {
    return { token: null, email: null, expiresAt };
  }

  await prisma.pendingRegistration.upsert({
    where: { normalizedEmail },
    create: {
      email: input.email.trim(),
      normalizedEmail,
      name: normalizedName(input.name),
      passwordHash,
      tokenHash,
      expiresAt,
    },
    update: {
      email: input.email.trim(),
      name: normalizedName(input.name),
      passwordHash,
      tokenHash,
      expiresAt,
    },
  });

  return { token, email: normalizedEmail, expiresAt };
}
