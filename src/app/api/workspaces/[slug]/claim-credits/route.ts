import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  { params: rawParams }: { params: Promise<{ slug: string }> }
) {
  const params = await rawParams;
  const workspace = await prisma.workspace.findFirst({
    where: { OR: [{ slug: params.slug }, { id: params.slug }] },
  });
  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const checklist = JSON.parse(workspace.onboardingChecklistJson || '{}');
  checklist.brandKit = true;
  checklist.video = true;
  checklist.demo = true;
  checklist.visuals = true;
  checklist.share = true;
  checklist.claimedBonus = true;

  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      bonusCreditsBalance: workspace.bonusCreditsBalance + 200,
      onboardingChecklistJson: JSON.stringify(checklist),
    },
  });

  await prisma.creditTransaction.create({
    data: {
      workspaceId: workspace.id,
      actorEmail: 'wlfjck@gmail.com',
      actionType: 'ONBOARDING_BONUS_CLAIM',
      creditsDelta: 200,
      description: 'Claimed 200 Bonus AI Credits for completing Getting Started checklist',
    },
  });

  return NextResponse.json({
    ok: true,
    workspace: updated,
    remainingCredits: updated.monthlyCreditsQuota + updated.bonusCreditsBalance - updated.usedCreditsThisCycle,
  });
}
