import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase().trim();

  const [flows, videos, visuals, collections, brandKits] = await Promise.all([
    prisma.flow.findMany({ where: { status: { not: 'DELETED' } } }),
    prisma.promptVideo.findMany({ where: { status: { not: 'DELETED' } } }),
    prisma.visualProject.findMany({ where: { status: { not: 'DELETED' } } }),
    prisma.collection.findMany({ where: { status: { not: 'DELETED' } } }),
    prisma.brandKit.findMany(),
  ]);

  const results = [
    ...flows.map((f) => ({
      id: f.id,
      type: 'Interactive Demo',
      title: f.name,
      url: `/flows/${f.id}/edit`,
      shareUrl: `/share/${f.shareId}`,
      updatedAt: f.updatedAt,
    })),
    ...videos.map((v) => ({
      id: v.id,
      type: 'AI Video',
      title: v.name,
      url: `/prompt-videos/custom/${v.id}/edit`,
      shareUrl: `/share/videos/${v.shareId}`,
      updatedAt: v.updatedAt,
    })),
    ...visuals.map((vp) => ({
      id: vp.id,
      type: 'AI Visuals',
      title: vp.name,
      url: `/visual-projects/${vp.id}/edit`,
      shareUrl: `/visual-projects/${vp.id}/edit`,
      updatedAt: vp.updatedAt,
    })),
    ...collections.map((c) => ({
      id: c.id,
      type: 'Collection',
      title: c.name,
      url: `/collections/${c.id}/edit`,
      shareUrl: `/share/collections/${c.shareId}`,
      updatedAt: c.updatedAt,
    })),
    ...brandKits.map((bk) => ({
      id: bk.id,
      type: 'Brand Kit',
      title: bk.name,
      url: `/workspaces/workspace-5p8xcsfv/settings/brand-kits/${bk.id}`,
      shareUrl: `/workspaces/workspace-5p8xcsfv/settings/brand-kits/${bk.id}`,
      updatedAt: bk.updatedAt,
    })),
  ].filter((item) => !q || item.title.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));

  return NextResponse.json({ results });
}
