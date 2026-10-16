import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params: rawParams }: { params: Promise<{ slug: string }> }
) {
  const params = await rawParams;
  const body = await request.json().catch(() => ({}));
  const planTier = (body.planTier || 'GROWTH').toUpperCase();
  const billingInterval = body.billingInterval || 'annual';

  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const newQuota = planTier === 'GROWTH' ? 800 : planTier === 'PRO' ? 500 : planTier === 'ENTERPRISE' ? 5000 : 200;

  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      planTier,
      billingInterval,
      monthlyCreditsQuota: newQuota,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      workspaceId: workspace.id,
      actorEmail: 'wlfjck@gmail.com',
      actionType: 'PLAN_UPGRADE',
      creditsDelta: newQuota - workspace.monthlyCreditsQuota,
      description: `Upgraded workspace plan to ${planTier} (${billingInterval})`,
    },
  });

  return NextResponse.json({ ok: true, workspace: updated });
}
