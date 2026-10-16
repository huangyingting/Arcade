import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { createDatabaseSession } from './session';
import { normalizeAccountEmail } from './policy';
import { hashPassword, verifyPassword } from './passwords';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function authenticatePassword(input: {
  email: string;
  password: string;
}) {
  const normalizedEmail = normalizeAccountEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });

  if (!user) return null;

  if (user.passwordCredential?.passwordHash) {
    const valid = await verifyPassword(
      input.password,
      user.passwordCredential.passwordHash
    );
    if (!valid) return null;
  } else {
    // Verify against dummy hash for timing safety, or fallback to legacy passwordHash
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    if (user.passwordHash && user.passwordHash !== input.password) {
      return null;
    }
  }

  const session = await createDatabaseSession(user.id);
  return { user, session };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeAccountEmail(email);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });
  if (!user?.email || !user.passwordCredential) return null;

  await prisma.passwordCredential.update({
    where: { userId: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetExpiresAt: expiresAt,
    },
  });

  return { token, email: user.email, expiresAt };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  const tokenHash = hashOpaqueToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const credential = await prisma.passwordCredential.findUnique({
    where: { resetTokenHash: tokenHash },
    select: { id: true, userId: true, resetExpiresAt: true },
  });

  if (!credential) {
    throw new AccountAdmissionError(
      410,
      'invalid_reset',
      'This password reset link is invalid or no longer active.'
    );
  }

  if (!credential.resetExpiresAt || credential.resetExpiresAt <= now) {
    await prisma.passwordCredential.update({
      where: { id: credential.id },
      data: { resetTokenHash: null, resetExpiresAt: null },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This password reset link has expired.'
    );
  }

  await prisma.passwordCredential.update({
    where: { id: credential.id },
    data: {
      passwordHash,
      passwordChangedAt: now,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
  });
  await prisma.session.deleteMany({ where: { userId: credential.userId } });
  return { userId: credential.userId };
}
