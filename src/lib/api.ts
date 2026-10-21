import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIES } from '@/lib/account-admission/session';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'request_error') {
    super(message);
  }
}

export const publicUser = { id: true, name: true, email: true, image: true, role: true } as const;

export async function currentUser() {
  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const token = jar.get(name)?.value;
    if (!token) continue;
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: { select: publicUser } },
    });
    if (session && session.expires > new Date()) return session.user;
  }
  return null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Sign in to continue.', 'unauthorized');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'Admin') throw new HttpError(403, 'Administrator access is required.');
  return user;
}

export async function workspaceAccess(slugOrId: string, write = false, admin = false) {
  const user = await requireUser();
  if (!slugOrId) throw new HttpError(400, 'Choose a workspace.');
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspace: { OR: [{ slug: slugOrId }, { id: slugOrId }] } },
    include: { workspace: true },
  });
  if (!membership) throw new HttpError(404, 'Workspace not found.');
  if (write && !['OWNER', 'ADMIN', 'EDITOR'].includes(membership.role)) {
    throw new HttpError(403, 'Your workspace role is read-only.');
  }
  if (admin && !['OWNER', 'ADMIN'].includes(membership.role)) {
    throw new HttpError(403, 'Workspace administrator access is required.');
  }
  return { user, workspace: membership.workspace, role: membership.role };
}

export function workspaceQuery(request: Request) {
  return new URL(request.url).searchParams.get('workspaceSlug') || '';
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length') || 0) > 2_000_000) {
    throw new HttpError(413, 'Request is too large.');
  }
  let value: unknown;
  try { value = JSON.parse((await readBytes(request, 2_000_000)).toString('utf8')); }
  catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'A valid JSON body is required.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'A JSON object is required.');
  }
  if (JSON.stringify(value).length > 2_000_000) throw new HttpError(413, 'Request is too large.');
  return value as Record<string, unknown>;
}

export async function readBytes(request: Request, limit: number) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new HttpError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new HttpError(413, 'Request is too large.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export function passwordInput(value: unknown) {
  if (typeof value !== 'string' || !value || value.length > 128) throw new HttpError(400, 'Enter a password of at most 128 characters.');
  return value;
}
export function text(value: unknown, label: string, max = 500, required = true) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > max) {
    throw new HttpError(400, `${label} ${required ? 'is required and' : ''} must be at most ${max} characters.`);
  }
  return value.trim();
}

export function integer(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new HttpError(400, `${label} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export function jsonField(value: unknown, kind: 'array' | 'object', maxItems = 200): string {
  if (kind === 'array' ? !Array.isArray(value) : !value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, `Expected a JSON ${kind}.`);
  }
  if (Array.isArray(value) && value.length > maxItems) throw new HttpError(400, 'Too many items.');
  const serialized = JSON.stringify(value);
  if (serialized.length > 1_000_000) throw new HttpError(413, 'Content is too large.');
  return serialized;
}

export function safeLink(value: string) {
  if (!value) return '';
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(400, 'Enter a valid HTTP or HTTPS URL.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new HttpError(400, 'Only HTTP and HTTPS links without credentials are allowed.');
  }
  return url.href;
}

export async function throttle(key: string, limit = 10, seconds = 900) {
  const now = new Date();
  const entry = await prisma.requestLimit.upsert({
    where: { key },
    create: { key, count: 0, resetsAt: new Date(now.getTime() + seconds * 1000) },
    update: {},
  });
  await prisma.requestLimit.updateMany({
    where: { key, resetsAt: { lte: now } },
    data: { count: 0, resetsAt: new Date(now.getTime() + seconds * 1000) },
  });
  const result = await prisma.requestLimit.updateMany({
    where: { key, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  if (!result.count) throw new HttpError(429, 'Too many requests. Please try again later.', 'rate_limited');
  // Each key is a bounded account/resource identifier, not an untrusted IP header.
  return entry.resetsAt;
}

function verifyOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  const expected = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if ((origin && origin !== new URL(expected).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Cross-origin requests are not allowed.');
  }
}

type Handler<Context> = (request: Request, context: Context) => Promise<Response>;
export function api<Context = { params: Promise<Record<string, never>> }>(handler: Handler<Context>): Handler<Context> {
  return async (request, context) => {
    try {
      verifyOrigin(request);
      const response = await handler(request, context);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    } catch (error) {
      let status = 500;
      let message = 'The request could not be completed. Please try again.';
      let code = 'internal_error';
      if (error instanceof HttpError) ({ status, message, code } = error);
      else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') { status = 409; message = 'This record already exists.'; }
        if (error.code === 'P2025') { status = 404; message = 'Record not found.'; }
      } else if (error instanceof Error && 'status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 600) {
        status = error.status;
        message = error.message;
      }
      if (status === 500) console.error('[api]', request.method, new URL(request.url).pathname, error);
      return NextResponse.json({ error: message, code }, {
        status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '900' } : {}) },
      });
    }
  };
}
