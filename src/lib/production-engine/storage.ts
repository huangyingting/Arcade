import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ProductionError } from './errors';

// Callers must authorize membership/publication access before entering this scope.
// Assets are private: ARCADE_STORAGE_DIR/<workspaceId>/<kind>/<UUID>.<ext>.
export type AssetKind = 'captures' | 'audio' | 'exports' | 'files';
const scopes = new AsyncLocalStorage<{ workspaceId: string }>();
const kinds: AssetKind[] = ['captures', 'audio', 'exports', 'files'];
const extensions = ['png', 'jpg', 'jpeg', 'webp', 'mp3', 'wav', 'mp4', 'gif', 'pdf', 'txt', 'csv', 'json', 'webm'];

export function currentWorkspaceId(): string {
  const id = scopes.getStore()?.workspaceId;
  if (!id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
    throw new ProductionError('An authorized workspace storage context is required.', 'WORKSPACE_REQUIRED', 403);
  }
  return id;
}

export function withWorkspaceStorage<T>(workspaceId: string, callback: () => T): T {
  if (typeof workspaceId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(workspaceId)) {
    throw new ProductionError('Invalid workspace storage identifier.', 'WORKSPACE_REQUIRED', 403);
  }
  return scopes.run({ workspaceId }, callback);
}

export function storageRoot(): string {
  const root = path.resolve(process.env.ARCADE_STORAGE_DIR || './storage');
  const publicRoot = path.resolve(process.cwd(), 'public');
  if (root === publicRoot || root.startsWith(`${publicRoot}${path.sep}`)) {
    throw new ProductionError('ARCADE_STORAGE_DIR must be outside public/.', 'INVALID_STORAGE_CONFIG', 503);
  }
  return root;
}

export async function workspaceStorageDirectory(): Promise<string> {
  const root = storageRoot();
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const realRoot = await fs.realpath(root);
  const publicRoot = await fs.realpath(path.resolve(process.cwd(), 'public')).catch(() => path.resolve(process.cwd(), 'public'));
  if (realRoot === publicRoot || realRoot.startsWith(`${publicRoot}${path.sep}`)) {
    throw new ProductionError('Storage resolves to a publicly accessible directory.', 'INVALID_STORAGE_CONFIG', 503);
  }
  const directory = path.join(realRoot, currentWorkspaceId());
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const realDirectory = await fs.realpath(directory);
  if (realDirectory !== directory) {
    throw new ProductionError('Workspace storage must not be a symbolic link.', 'UNSAFE_ASSET', 403);
  }
  return realDirectory;
}

export async function assetDirectory(kind: AssetKind): Promise<string> {
  if (!kinds.includes(kind)) throw new ProductionError('Unsupported asset kind.', 'INVALID_ASSET', 400);
  const directory = path.join(await workspaceStorageDirectory(), kind);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  if (await fs.realpath(directory) !== directory) {
    throw new ProductionError('Asset directories must not be symbolic links.', 'UNSAFE_ASSET', 403);
  }
  return directory;
}

export async function writeAsset(kind: AssetKind, buffer: Uint8Array, ext: string): Promise<string> {
  const workspaceId = currentWorkspaceId();
  const extension = typeof ext === 'string' ? ext.toLowerCase().replace(/^\./, '') : '';
  if (!extensions.includes(extension) || !(buffer instanceof Uint8Array) || !buffer.byteLength || buffer.byteLength > 256 * 1024 * 1024) {
    throw new ProductionError('Asset type or size is unsupported (maximum 256 MB).', 'INVALID_ASSET', 400);
  }
  const name = `${randomUUID()}.${extension}`;
  const directory = await assetDirectory(kind);
  await fs.writeFile(path.join(directory, name), buffer, { flag: 'wx', mode: 0o600 });
  return `/api/media/${encodeURIComponent(workspaceId)}/${kind}/${name}`;
}

export async function resolveAssetPath(assetUrl: string): Promise<string> {
  const workspaceId = currentWorkspaceId();
  if (typeof assetUrl !== 'string' || assetUrl.length > 2048) {
    throw new ProductionError('Invalid private asset URL.', 'UNSAFE_ASSET', 400);
  }
  const match = assetUrl.match(/^\/api\/media\/([a-zA-Z0-9_-]{1,100})\/(captures|audio|exports|files)\/([a-f0-9-]{36}\.[a-z0-9]{2,5})$/);
  if (!match || match[1] !== workspaceId) {
    throw new ProductionError('Asset must belong to the authorized workspace.', 'UNSAFE_ASSET', 403);
  }
  const directory = await assetDirectory(match[2] as AssetKind);
  const candidate = path.join(directory, match[3]);
  let realPath: string;
  try { realPath = await fs.realpath(candidate); }
  catch { throw new ProductionError('Workspace asset is unavailable.', 'ASSET_UNAVAILABLE', 404); }
  if (realPath !== candidate) throw new ProductionError('Asset links are not permitted.', 'UNSAFE_ASSET', 403);
  return realPath;
}
