import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  let flow = await prisma.flow.findFirst({
    where: {
      OR: [{ id: params.pid }, { shareId: params.pid }],
    },
    include: {
      brandKit: true,
      workspace: true,
    },
  });

  if (!flow) {
    flow = await prisma.flow.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: {
        brandKit: true,
        workspace: true,
      },
    });
  }

  return NextResponse.json({ flow });
}

export async function PUT(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  return updateFlow(request, params.pid);
}

export async function PATCH(
  request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  return updateFlow(request, params.pid);
}

async function updateFlow(request: Request, pid: string) {
  const body = await request.json();
  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: pid }, { shareId: pid }] },
  });
  if (!flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.description === 'string') data.description = body.description;
  if (typeof body.status === 'string') data.status = body.status;
  if (typeof body.visibility === 'string') data.visibility = body.visibility;
  if (typeof body.brandKitId === 'string') data.brandKitId = body.brandKitId;
  if (body.steps) data.stepsJson = JSON.stringify(body.steps);
  if (body.design) data.designJson = JSON.stringify(body.design);
  if (body.variables) data.variablesJson = JSON.stringify(body.variables);
  if (body.translations) data.translationsJson = JSON.stringify(body.translations);
  if (body.menu) data.menuJson = JSON.stringify(body.menu);
  if (body.tags) data.tagsJson = JSON.stringify(body.tags);

  const updated = await prisma.flow.update({
    where: { id: flow.id },
    data,
    include: { brandKit: true },
  });

  return NextResponse.json({ flow: updated });
}

export async function DELETE(
  _request: Request,
  { params: rawParams }: { params: Promise<{ pid: string }> }
) {
  const params = await rawParams;
  const flow = await prisma.flow.findFirst({
    where: { OR: [{ id: params.pid }, { shareId: params.pid }] },
  });
  if (flow) {
    await prisma.flow.update({
      where: { id: flow.id },
      data: { status: 'DELETED' },
    });
  }
  return NextResponse.json({ ok: true });
}
