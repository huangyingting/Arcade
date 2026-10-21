import { randomUUID, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, integer, text, throttle, workspaceAccess, workspaceQuery } from '@/lib/api';
import { publishedFlow } from '@/lib/published';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request));
  const where = { workspaceId: workspace.id };
  const [events, flows, videos, leads] = await Promise.all([
    prisma.analyticsEvent.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.flow.findMany({ where: { ...where, status: { not: 'DELETED' } }, select: { id: true, name: true, viewsCount: true, completionsCount: true, shareId: true } }),
    prisma.promptVideo.findMany({ where: { ...where, status: { not: 'DELETED' } }, select: { id: true, name: true, viewsCount: true, shareId: true } }),
    prisma.leadCapture.findMany({ where, select: { id: true, flowId: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);
  return NextResponse.json({ events, flows, videos, leads });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const flow = await publishedFlow(text(input.assetId, 'Published demo', 100));
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: flow.workspaceId } });
  const privacy = JSON.parse(workspace.privacySettingsJson);
  if (privacy.collectViewerAnalytics === false || request.headers.get('dnt') === '1') return new NextResponse(null, { status: 204 });
  if (privacy.showCookieBanner === true && input.consent !== true) return new NextResponse(null, { status: 204 });
  if (!['VIEW', 'STEP_VIEW', 'COMPLETED'].includes(String(input.eventType))) throw new HttpError(400, 'Invalid event type.');
  const jar = await cookies();
  const stored = jar.get('arcade-visitor')?.value;
  const visitorId = stored && /^[a-f0-9-]{36}$/.test(stored) ? stored : randomUUID();
  await throttle(`view:${createHash('sha256').update(flow.id + visitorId).digest('hex')}`, 200, 3600);
  const steps: unknown[] = JSON.parse(flow.stepsJson);
  const stepIndex = integer(input.stepIndex ?? 0, 'Step index', 0, Math.max(0, steps.length - 1));
  const durationMs = integer(input.durationMs ?? 0, 'Duration', 0, 3_600_000);
  if (input.eventType === 'COMPLETED' && stepIndex !== steps.length - 1) throw new HttpError(400, 'Complete the final step first.');
  const dedupeKey = ['VIEW', 'COMPLETED'].includes(String(input.eventType))
    ? createHash('sha256').update(`${flow.id}:${visitorId}:${input.eventType}:${Math.floor(Date.now() / 86_400_000)}`).digest('hex') : null;
  try { await prisma.$transaction(async (tx) => {
    await tx.analyticsEvent.create({ data: {
      workspaceId: flow.workspaceId, assetType: 'FLOW', assetId: flow.id, assetTitle: flow.name,
      visitorId, eventType: String(input.eventType), stepIndex, durationMs, dedupeKey,
    } });
    if (input.eventType === 'VIEW') await tx.flow.update({ where: { id: flow.id }, data: { viewsCount: { increment: 1 } } });
    if (input.eventType === 'COMPLETED' && stepIndex === steps.length - 1) await tx.flow.update({ where: { id: flow.id }, data: { completionsCount: { increment: 1 } } });
  }); } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && dedupeKey)) throw error;
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set('arcade-visitor', visitorId, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 86400 });
  return response;
});
