import { prisma } from '@/lib/prisma';
import { HttpError, jsonField, safeLink, text, workspaceAccess } from '@/lib/api';

export const editableStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED'] as const;

export async function flowAccess(id: string, write = false) {
  const asset = await prisma.flow.findUnique({ where: { id } });
  if (!asset) throw new HttpError(404, 'Demo not found.');
  const access = await workspaceAccess(asset.workspaceId, write);
  return { ...access, asset };
}
export async function videoAccess(id: string, write = false) {
  const asset = await prisma.promptVideo.findUnique({ where: { id } });
  if (!asset) throw new HttpError(404, 'Video not found.');
  const access = await workspaceAccess(asset.workspaceId, write);
  return { ...access, asset };
}
export async function visualAccess(id: string, write = false) {
  const asset = await prisma.visualProject.findUnique({ where: { id } });
  if (!asset) throw new HttpError(404, 'Visual project not found.');
  const access = await workspaceAccess(asset.workspaceId, write);
  return { ...access, asset };
}
export async function collectionAccess(id: string, write = false) {
  const asset = await prisma.collection.findUnique({ where: { id } });
  if (!asset) throw new HttpError(404, 'Collection not found.');
  const access = await workspaceAccess(asset.workspaceId, write);
  return { ...access, asset };
}
export async function brandAccess(id: string, write = false) {
  const asset = await prisma.brandKit.findUnique({ where: { id } });
  if (!asset) throw new HttpError(404, 'Brand kit not found.');
  const access = await workspaceAccess(asset.workspaceId, write);
  return { ...access, asset };
}

export async function brandKitForWorkspace(id: unknown, workspaceId: string) {
  if (!id) return prisma.brandKit.findFirst({ where: { workspaceId, isDefault: true } });
  const kit = await prisma.brandKit.findFirst({ where: { id: text(id, 'Brand kit', 100), workspaceId } });
  if (!kit) throw new HttpError(400, 'Choose a brand kit from this workspace.');
  return kit;
}

export function brandAccent(kit: { colorsJson: string } | null) {
  if (!kit) return null;
  const colors: { hex?: string; role?: string }[] = JSON.parse(kit.colorsJson);
  return (colors.find((color) => /primary|accent/i.test(color.role || '')) || colors[0])?.hex || null;
}

export function assetStatus(value: unknown) {
  if (!editableStatuses.includes(value as typeof editableStatuses[number])) throw new HttpError(400, 'Invalid asset status.');
  return value as typeof editableStatuses[number];
}

export function validateContent(value: unknown, workspaceId: string, kind: 'array' | 'object' = 'object') {
  const serialized = jsonField(value, kind);
  let nodes = 0;
  const visit = (entry: unknown, key = '', depth = 0) => {
    if (++nodes > 20000 || depth > 20) throw new HttpError(400, 'Content is too complex.');
    if (typeof entry === 'string') {
      if (entry.startsWith('/api/media/') && !entry.startsWith(`/api/media/${workspaceId}/`)) {
        throw new HttpError(400, 'Media must belong to this workspace.');
      }
      if (/^(?:mediaUrl|imageUrl|screenshotUrl|backgroundImageUrl|audioUrl|fileUrl|downloadUrl|thumbnailUrl|logoUrl|lightLogoUrl|darkLogoUrl)$/i.test(key) && entry) {
        if (!entry.startsWith(`/api/media/${workspaceId}/`) || entry.includes('..') || entry.includes('?') || entry.includes('#')) {
          throw new HttpError(400, 'Use media uploaded or captured in this workspace.');
        }
      }
      if (/^(?:targetUrl|ctaUrl|primaryCtaUrl)$/i.test(key)) safeLink(entry);
    } else if (Array.isArray(entry)) entry.forEach((item) => visit(item, key, depth + 1));
    else if (entry && typeof entry === 'object') Object.entries(entry).forEach(([childKey, item]) => visit(item, childKey, depth + 1));
  };
  visit(value);
  return serialized;
}

export async function validateCollectionItems(items: unknown, workspaceId: string) {
  jsonField(items, 'array', 100);
  if (!Array.isArray(items)) throw new HttpError(400, 'Collection items must be a list.');
  const checked = [];
  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== 'object' || !('assetType' in item) || !('assetId' in item)) {
      throw new HttpError(400, 'Invalid collection item.');
    }
    const id = text(item.assetId, 'Asset ID', 100);
    const found = item.assetType === 'FLOW'
      ? await prisma.flow.findFirst({ where: { id, workspaceId, status: 'PUBLISHED', visibility: { in: ['PUBLIC', 'LINK_ONLY'] } } })
      : item.assetType === 'VIDEO'
        ? await prisma.promptVideo.findFirst({ where: { id, workspaceId, status: 'PUBLISHED' } })
        : null;
    if (!found) throw new HttpError(400, 'Collections can contain only published demos and videos from this workspace.');
    checked.push({ id: `${item.assetType}-${id}`, assetType: item.assetType, assetId: id, order: index });
  }
  return JSON.stringify(checked);
}
