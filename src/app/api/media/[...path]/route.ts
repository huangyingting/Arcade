import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { prisma } from '@/lib/prisma';
import { api, currentUser, HttpError } from '@/lib/api';
import { resolveAssetPath, withWorkspaceStorage } from '@/lib/production-engine/storage';

const types: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', wav: 'audio/wav', mp3: 'audio/mpeg' };

export const GET = api<{ params: Promise<{ path: string[] }> }>(async (request, { params }) => {
  const parts = (await params).path;
  if (parts.length !== 3 || !parts.every((p) => /^[\w.-]+$/.test(p) && !p.includes('..'))) throw new HttpError(404, 'Media not found.');
  const [workspaceId, kind, filename] = parts;
  const url = `/api/media/${workspaceId}/${kind}/${filename}`;
  const user = await currentUser();
  const member = user ? await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: user.id } }, select: { id: true } }) : null;
  if (!member) {
    const needle = JSON.stringify(url);
    const [flow, video] = await Promise.all([
      prisma.flow.findFirst({ where: { workspaceId, status: 'PUBLISHED', visibility: { in: ['PUBLIC', 'LINK_ONLY'] }, OR: [{ stepsJson: { contains: needle } }, { translationsJson: { contains: needle } }, { thumbnailUrl: url }] }, select: { id: true } }),
      prisma.promptVideo.findFirst({ where: { workspaceId, status: 'PUBLISHED', OR: [{ exportsJson: { contains: needle } }, { thumbnailUrl: url }] }, select: { id: true } }),
    ]);
    if (!flow && !video) throw new HttpError(404, 'Media not found.');
  }
  let file: string;
  try { file = await withWorkspaceStorage(workspaceId, () => resolveAssetPath(url)); }
  catch (error) {
    if (error instanceof Error && 'status' in error && [400, 403, 404].includes(Number(error.status))) throw new HttpError(404, 'Media not found.');
    throw error;
  }
  const info = await stat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new HttpError(404, 'Media not found.');
    throw error;
  });
  const type = types[filename.split('.').at(-1) || ''];
  if (!type || !info.isFile()) throw new HttpError(404, 'Media not found.');
  let start = 0;
  let end = info.size - 1;
  const range = request.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    if (start > end || start < 0 || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
  }
  const stream = createReadStream(file, { start, end });
  request.signal.addEventListener('abort', () => stream.destroy(), { once: true });
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: range ? 206 : 200,
    headers: {
      'Content-Type': type, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes',
      'Content-Disposition': `${new URL(request.url).searchParams.get('download') === '1' ? 'attachment' : 'inline'}; filename="${filename}"`,
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${info.size}` } : {}),
    },
  });
});
