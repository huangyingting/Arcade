import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const leads = await prisma.leadCapture.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
  }

  const lead = await prisma.leadCapture.create({
    data: {
      workspaceId: workspace.id,
      flowId: body.flowId || '4fLyMFzH8BjqgKQF4Bd6',
      flowTitle: body.flowTitle || 'whoami.genisisiq.com Interactive Tour',
      email: body.email || 'prospect@enterprise.io',
      fullName: body.fullName || 'Enterprise Prospect',
      company: body.company || (body.email ? body.email.split('@')[1] : 'Enterprise Corp'),
      role: body.role || 'Solutions Architect',
      stepsCompleted: Number(body.stepsCompleted || 5),
      totalSteps: Number(body.totalSteps || 5),
      syncedToCrm: true,
    },
  });

  return NextResponse.json({ ok: true, lead });
}
