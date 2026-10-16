'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderPlus,
  Layers,
  Video,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function TeamLibraryPage({
  params,
}: {
  params: { workspaceSlug: string; teamSlug: string };
}) {
  const { workspaceSlug, teamSlug } = params;
  const [filterType, setFilterType] = useState<'ALL' | 'FLOW' | 'VIDEO' | 'VISUAL' | 'COLLECTION'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [query, setQuery] = useState('');
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setWorkspace(d.workspace));
  }, [workspaceSlug]);

  const items = [
    ...(workspace?.promptVideos || []).map((v: any) => ({
      id: v.id,
      type: 'VIDEO',
      badge: `AI Video • ${v.durationSec}s`,
      name: v.name,
      thumb: v.thumbnailUrl || '/media/scene1.png',
      editHref: `/prompt-videos/custom/${v.id}/edit`,
      shareHref: `/share/videos/${v.shareId}`,
      updatedAt: v.updatedAt,
    })),
    ...(workspace?.flows || []).map((f: any) => ({
      id: f.id,
      type: 'FLOW',
      badge: 'Interactive Demo',
      name: f.name,
      thumb: f.thumbnailUrl || '/media/scene1.png',
      editHref: `/flows/${f.id}/edit`,
      shareHref: `/share/${f.shareId}`,
      updatedAt: f.updatedAt,
    })),
    ...(workspace?.visualProjects || []).map((vp: any) => ({
      id: vp.id,
      type: 'VISUAL',
      badge: 'AI Visuals',
      name: vp.name,
      thumb: vp.thumbnailUrl || '/media/visual_preview.png',
      editHref: `/visual-projects/${vp.id}/edit`,
      shareHref: `/visual-projects/${vp.id}/edit`,
      updatedAt: vp.updatedAt,
    })),
    ...(workspace?.collections || []).map((c: any) => ({
      id: c.id,
      type: 'COLLECTION',
      badge: 'Collection',
      name: c.name,
      thumb: '/media/scene2.png',
      editHref: `/collections/${c.id}/edit`,
      shareHref: `/share/collections/${c.shareId}`,
      updatedAt: c.updatedAt,
    })),
  ].filter(
    (item) =>
      (filterType === 'ALL' || item.type === filterType) &&
      (!query || item.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Library — {teamSlug === 'me' ? 'jack wolf (Personal)' : teamSlug}
            </h1>
            <p className="text-xs text-slate-500">
              Organize your Interactive Demos, AI Launch Videos, Multi-Format Visuals, and Collections.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter library..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'VIDEO', 'FLOW', 'VISUAL', 'COLLECTION'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filterType === f
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All Assets' : f}
            </button>
          ))}
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-5 sm:grid-cols-3' : 'space-y-3'}>
          {items.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition"
            >
              {viewMode === 'grid' && (
                <img src={item.thumb} alt={item.name} className="h-40 w-full object-cover" />
              )}
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="truncate">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    {item.badge}
                  </span>
                  <h3 className="mt-1.5 font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                  <Link href={item.editHref} className="text-indigo-600 hover:underline">
                    Edit →
                  </Link>
                  <Link href={item.shareHref} className="text-slate-400 hover:text-slate-900">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
