import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, throttle } from '@/lib/api';
import { videoAccess } from '@/lib/assets';
import { renderPromptVideoMp4 } from '@/lib/production-engine/media-renderer';
import { withWorkspaceStorage } from '@/lib/production-engine/storage';

export const POST = api<{ params: Promise<{ pid: string }> }>(async (request, { params }) => {
  const { asset, workspace, user } = await videoAccess((await params).pid, true);
  await throttle(`render:${user.id}`, 10, 3600);
  const input = await body(request);
  const resolution = input.resolution ?? '1080p';
  const fps = input.fps ?? 30;
  if (!['720p', '1080p', '4K'].includes(String(resolution)) || ![30, 60].includes(Number(fps))) throw new HttpError(400, 'Unsupported render settings.');
  const rendered = await withWorkspaceStorage(workspace.id, () => renderPromptVideoMp4(asset, resolution as '720p' | '1080p' | '4K', Number(fps)));
  const exportItem = { id: crypto.randomUUID(), resolution, fps, status: 'READY', ...rendered, createdAt: new Date().toISOString() };
  const exports = [exportItem, ...JSON.parse(asset.exportsJson)].slice(0, 20);
  const saved = await prisma.promptVideo.updateMany({ where: { id: asset.id, currentVersion: asset.currentVersion }, data: { exportsJson: JSON.stringify(exports) } });
  if (!saved.count) throw new HttpError(409, 'The composition changed while rendering. Render the latest version before publishing.');
  return NextResponse.json({ exportItem, exports });
});
