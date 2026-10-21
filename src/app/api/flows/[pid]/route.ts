import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, text } from '@/lib/api';
import { assetStatus, brandKitForWorkspace, flowAccess, validateContent } from '@/lib/assets';
import { validateDesign, validateSteps } from '@/lib/validation';
import type { FlowStep } from '@/types/domain';

type Context = { params: Promise<{ pid: string }> };
export const GET = api<Context>(async (_request, { params }) => {
  const { asset, workspace, role } = await flowAccess((await params).pid);
  return NextResponse.json({ flow: { ...asset, workspace: { slug: workspace.slug, name: workspace.name }, role } });
});
export const PATCH = api<Context>(async (request, { params }) => {
  const { asset, workspace } = await flowAccess((await params).pid, true);
  const input = await body(request);
  const data: Record<string, unknown> = {};
  if ('name' in input) data.name = text(input.name, 'Demo name', 200);
  if ('description' in input) data.description = text(input.description, 'Description', 4000, false);
  if ('brandKitId' in input) data.brandKitId = (await brandKitForWorkspace(input.brandKitId, workspace.id))?.id ?? null;
  if ('visibility' in input) {
    if (!['PUBLIC', 'LINK_ONLY', 'PRIVATE'].includes(String(input.visibility))) throw new HttpError(400, 'Invalid visibility.');
    data.visibility = input.visibility;
  }
  for (const [key, kind] of Object.entries({ steps: 'array', design: 'object', variables: 'array', translations: 'object', menu: 'object', tags: 'array' }) as [string, 'array' | 'object'][]) {
    if (key in input) data[`${key}Json`] = validateContent(input[key], workspace.id, kind);
  }
  if ('steps' in input) data.stepsJson = validateSteps(input.steps, workspace.id);
  if (typeof data.stepsJson === 'string') {
    const steps: FlowStep[] = JSON.parse(data.stepsJson);
    data.thumbnailUrl = steps.find((step) => step.type === 'IMAGE' && step.mediaUrl)?.mediaUrl || null;
  }
  if ('design' in input) data.designJson = validateDesign(input.design, workspace.id);
  if ('status' in input) {
    const status = assetStatus(input.status);
    if (status === 'PUBLISHED') {
      const steps = input.steps ?? JSON.parse(asset.stepsJson);
      validateSteps(steps, workspace.id, true);
      data.visibility = input.visibility || (asset.visibility === 'PRIVATE' ? 'LINK_ONLY' : asset.visibility);
    }
    if ('translations' in input) throw new HttpError(400, 'Use the translation endpoint to generate validated translations.');
    if ('steps' in input && JSON.stringify(input.steps) !== asset.stepsJson) data.translationsJson = '{}';
    data.status = status;
  }
  const flow = await prisma.flow.update({ where: { id: asset.id }, data });
  return NextResponse.json({ flow });
});
export const PUT = PATCH;
export const DELETE = api<Context>(async (_request, { params }) => {
  const { asset } = await flowAccess((await params).pid, true);
  await prisma.flow.update({ where: { id: asset.id }, data: { status: 'DELETED', visibility: 'PRIVATE' } });
  return NextResponse.json({ ok: true });
});
