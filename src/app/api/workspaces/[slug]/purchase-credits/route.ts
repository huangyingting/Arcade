import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json().catch(() => ({}));
  const creditsToAdd = Number(body.credits || 500);

  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      bonusCreditsBalance: workspace.bonusCreditsBalance + creditsToAdd,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      workspaceId: workspace.id,
      actorEmail: 'wlfjck@gmail.com',
      actionType: 'CREDIT_TOPUP',
      creditsDelta: creditsToAdd,
      description: `Purchased +${creditsToAdd} AI Credits Pack`,
    },
  });

  return NextResponse.json({ ok: true, workspace: updated });
}
