import { NextResponse } from 'next/server';
import { api, body, HttpError, throttle } from '@/lib/api';
import { flowAccess } from '@/lib/assets';
import { renderFlowVideoOrGif } from '@/lib/production-engine/media-renderer';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await flowAccess((await params).pid, true);
  await throttle(`render:${user.id}`, 10, 3600);
  const input = await body(request);
  if (!['mp4', 'gif'].includes(String(input.format))) throw new HttpError(400, 'Choose MP4 or GIF.');
  const rendered = await withWorkspaceStorage(workspace.id, () => renderFlowVideoOrGif(asset, input.format as 'mp4' | 'gif'));
  return NextResponse.json({ status: 'READY', ...rendered });
});
