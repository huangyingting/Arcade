import { NextResponse } from 'next/server';
import { api, body, HttpError, throttle } from '@/lib/api';
import { visualAccess } from '@/lib/assets';
import { renderVisualCardExport } from '@/lib/production-engine/media-renderer';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';
import type { VisualCanvasItem } from '@/types/domain';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await visualAccess((await params).pid, true);
  await throttle(`render:${user.id}`, 10, 3600);
  const input = await body(request);
  if (!['png', 'mp4'].includes(String(input.format))) throw new HttpError(400, 'Choose PNG or MP4.');
  const visuals: VisualCanvasItem[] = JSON.parse(asset.visualsJson);
  const visual = visuals.find((v) => v.id === input.visualId);
  if (!visual) throw new HttpError(404, 'Save and select a visual before exporting.');
  const rendered = await withWorkspaceStorage(workspace.id, () => renderVisualCardExport(visual, input.format as 'png' | 'mp4'));
  return NextResponse.json({ status: 'READY', ...rendered });
});
