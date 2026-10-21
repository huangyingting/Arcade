import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { publishedFlow } from '@/lib/published';
import { prisma } from '@/lib/prisma';

export const GET = api<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const { workspaceId, ...flow } = await publishedFlow((await params).id);
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { privacySettingsJson: true } });
  const settings: { collectViewerAnalytics?: boolean; showCookieBanner?: boolean } = JSON.parse(workspace.privacySettingsJson);
  return NextResponse.json({ flow: { ...flow, privacy: { enabled: settings.collectViewerAnalytics !== false, requireConsent: settings.showCookieBanner === true } } });
});
