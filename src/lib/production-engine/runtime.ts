import path from 'node:path';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { ProductionError } from './errors';
import {
  currentWorkspaceId, withWorkspaceStorage, workspaceStorageDirectory, assetDirectory,
  resolveAssetPath, writeAsset, type AssetKind,
} from './storage';
export { ProductionError } from './errors';
export { storageRoot } from './storage';

export interface EngineScope { workspaceId: string }
export function withEngineScope<T>(scope: EngineScope, callback: () => T): T {
  return withWorkspaceStorage(scope.workspaceId, callback);
}

export function requireEngineScope(scope?: EngineScope): EngineScope {
  const value = scope ?? { workspaceId: currentWorkspaceId() };
  if (!value || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.workspaceId)) {
    throw new ProductionError('An authorized workspaceId is required for engine assets.', 'WORKSPACE_REQUIRED', 403);
  }
  return value;
}

export async function workspaceDirectory(scope?: EngineScope): Promise<string> {
  const { workspaceId } = requireEngineScope(scope);
  return withWorkspaceStorage(workspaceId, workspaceStorageDirectory);
}

export async function createJob(scope?: EngineScope): Promise<{
  directory: string; publish: (name: string, kind?: AssetKind) => Promise<string>; cleanup: () => Promise<void>;
}> {
  const resolved = requireEngineScope(scope);
  const workspace = await withWorkspaceStorage(resolved.workspaceId, () => assetDirectory('exports'));
  const job = randomUUID();
  const directory = path.join(workspace, `.job-${job}`);
  await fs.mkdir(directory, { mode: 0o700 });
  return {
    directory,
    publish: async (name, kind = 'exports') => {
      if (!/^[a-zA-Z0-9_.-]+$/.test(name) || name.startsWith('.')) {
        throw new ProductionError('Invalid generated asset name.', 'INVALID_ASSET', 400);
      }
      return withWorkspaceStorage(resolved.workspaceId, async () =>
        writeAsset(kind, await fs.readFile(path.join(directory, name)), path.extname(name).slice(1)));
    },
    cleanup: () => fs.rm(directory, { recursive: true, force: true }),
  };
}

export async function readScopedAsset(url: string, scope?: EngineScope, maxBytes = 12 * 1024 * 1024): Promise<Buffer> {
  const resolved = requireEngineScope(scope);
  let handle: fs.FileHandle | undefined;
  try {
    const candidate = await withWorkspaceStorage(resolved.workspaceId, () => resolveAssetPath(url));
    handle = await fs.open(candidate, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size < 1 || stat.size > maxBytes) {
      throw new ProductionError('Asset is empty, too large, or not a regular file.', 'INVALID_ASSET', 422);
    }
    return await handle.readFile();
  } catch (error) {
    if (error instanceof ProductionError) throw error;
    throw new ProductionError('Workspace asset is unavailable. Upload or capture it before exporting.', 'ASSET_UNAVAILABLE', 422);
  } finally {
    await handle?.close();
  }
}

export function runMediaCommand(command: 'ffmpeg' | 'ffprobe', args: string[], timeout = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout, maxBuffer: 1024 * 1024, windowsHide: true }, (error, stdout) => {
      if (error) {
        reject(new ProductionError(
          'Media processing failed. Verify ffmpeg/ffprobe are installed and the supplied media is valid.',
          'MEDIA_PROCESSING_FAILED', 502
        ));
      } else resolve(stdout);
    });
  });
}

export function audioFormat(bytes: Buffer): 'mp3' | 'wav' | 'ogg' {
  if (bytes.length >= 4 && (bytes.subarray(0, 3).toString() === 'ID3' ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return 'mp3';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WAVE') return 'wav';
  if (bytes.subarray(0, 4).toString() === 'OggS') return 'ogg';
  throw new ProductionError('Only MP3, WAV, and Ogg audio files are supported.', 'INVALID_AUDIO', 422);
}

export async function probeDuration(file: string, format?: 'mp3' | 'wav' | 'ogg'): Promise<number> {
  const output = await runMediaCommand('ffprobe', [
    '-v', 'error', '-protocol_whitelist', 'file,pipe', ...(format ? ['-f', format] : []), '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ], 15_000);
  const duration = Number(output.trim());
  if (!Number.isFinite(duration) || duration <= 0 || duration > 180) {
    throw new ProductionError('Audio must contain between 0 and 180 seconds of playable audio.', 'INVALID_AUDIO');
  }
  return duration;
}

export function text(value: unknown, name: string, max = 4000, required = false): string {
  if (value === undefined || value === null) {
    if (!required) return '';
  } else if (typeof value === 'string' && value.length <= max && (!required || value.trim())) {
    return value.trim();
  }
  throw new ProductionError(`${name} must ${required ? 'be nonempty and ' : ''}contain at most ${max} characters.`, 'INVALID_INPUT', 400);
}

export function numberInRange(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new ProductionError(`${name} must be between ${min} and ${max}.`, 'INVALID_INPUT', 400);
  }
  return value;
}
