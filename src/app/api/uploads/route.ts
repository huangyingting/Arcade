import { NextResponse } from 'next/server';
import { api, HttpError, readBytes, requireUser, text, throttle, workspaceAccess } from '@/lib/api';
import { withWorkspaceStorage, writeAsset } from '@/lib/production-engine/storage';

const maxUpload = 20 * 1024 * 1024;
function extension(buffer: Buffer): string {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') return 'wav';
  if (buffer.toString('ascii', 4, 8) === 'ftyp') return 'mp4';
  if (buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 255 && (buffer[1] & 224) === 224)) return 'mp3';
  throw new HttpError(415, 'Upload a PNG, JPEG, WebP, MP4, WAV or MP3 file. Active content such as SVG and HTML is not supported.');
}

export const POST = api(async (request) => {
  const user = await requireUser();
  await throttle(`upload:${user.id}`, 100, 3600);
  const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data');
  const bytes = await readBytes(request, (multipart ? maxUpload : Math.ceil(maxUpload * 4 / 3)) + 100_000);
  let buffer: Buffer;
  let slug: string;
  if (multipart) {
    const parsed = new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type')! } });
    const form = await parsed.formData();
    slug = text(form.get('workspaceSlug'), 'Workspace', 100);
    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'Choose a file to upload.');
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    let input: Record<string, unknown>;
    try { input = JSON.parse(bytes.toString('utf8')); } catch { throw new HttpError(400, 'Invalid upload request.'); }
    slug = text(input.workspaceSlug, 'Workspace', 100);
    const dataUrl = typeof input.dataUrl === 'string' ? input.dataUrl : '';
    const match = dataUrl.match(/^data:[\w.+/-]+;base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) throw new HttpError(400, 'Invalid base64 file.');
    buffer = Buffer.from(match[1], 'base64');
  }
  if (!buffer.length || buffer.length > maxUpload) throw new HttpError(413, 'Files must be between 1 byte and 20 MB.');
  const { workspace } = await workspaceAccess(slug, true);
  const ext = extension(buffer);
  const url = await withWorkspaceStorage(workspace.id, () => writeAsset('files', buffer, ext));
  return NextResponse.json({ ok: true, url, size: buffer.length }, { status: 201 });
});
