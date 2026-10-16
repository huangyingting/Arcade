'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  FolderKanban,
  Play,
  Film,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function CollectionEditorPage({ params: rawParams }: { params: Promise<{ pid: string }> }) {
  const { pid } = React.use(rawParams);
  const [collection, setCollection] = useState<any>(null);
  const [header, setHeader] = useState<any>({
    title: 'whoami.genisisiq.com — Doers, Not Talkers',
    subtitle: 'Interactive tour, 30s AI launch video, and 16s teaser film for Yi-Ting Huang.',
    ctaLabel: 'Open Live Portfolio ↗',
    ctaUrl: 'https://whoami.genisisiq.com',
  });
  const [items, setItems] = useState<any[]>([]);
  const [flowsCatalog, setFlowsCatalog] = useState<any[]>([]);
  const [videosCatalog, setVideosCatalog] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/collections/${pid}`);
      const data = await res.json();
      if (data.flows) setFlowsCatalog(data.flows);
      if (data.videos) setVideosCatalog(data.videos);
      if (data.collection) {
        setCollection(data.collection);
        setHeader((prev: any) => ({ ...prev, ...JSON.parse(data.collection.headerJson || '{}') }));
        setItems(JSON.parse(data.collection.itemsJson || '[]'));
      }
    }
    load();
  }, [pid]);

  function resolveItemMeta(item: any) {
    const type = item.assetType || item.type || 'FLOW';
    if (type === 'FLOW') {
      const f = flowsCatalog.find((x) => x.id === item.assetId);
      return {
        type: 'FLOW',
        title: item.title || f?.name || 'whoami.genisisiq.com Interactive Tour',
        subtitle: f?.description || '5 Interactive Steps • Hotspots & AI Voiceover',
        thumbnailUrl: f?.thumbnailUrl || '/media/scene1.png',
        href: `/share/${f?.shareId || '319HqogqYEOZH11srxTM'}`,
      };
    } else {
      const v = videosCatalog.find((x) => x.id === item.assetId);
      return {
        type: 'VIDEO',
        title: item.title || v?.name || 'whoami.genisisiq.com Launch Video',
        subtitle: `${v?.durationSec || 30}s Remotion Launch Video • 1080p MP4`,
        thumbnailUrl: v?.thumbnailUrl || '/media/scene2.png',
        href: `/share/videos/${v?.shareId || item.assetId || 'qGe4L499rr5AsLtm6F4q'}`,
      };
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedToast(false);
    try {
      await fetch(`/api/collections/${collection?.id || pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collection?.name,
          header,
          items,
        }),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    setItems(next.map((it, i) => ({ ...it, order: i })));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces/workspace-5p8xcsfv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspace
          </Link>
          <FolderKanban className="h-4 w-4 text-amber-400" />
          <input
            type="text"
            value={collection?.name || 'whoami.genisisiq.com Executive Launch Hub'}
            onChange={(e) => setCollection({ ...collection, name: e.target.value })}
            className="rounded bg-transparent px-2 py-1 text-sm font-bold text-white focus:bg-slate-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {savedToast && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <Link
            href={`/share/collections/${collection?.shareId || 'whoami-showcase'}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Open Public Showcase <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Collection'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Settings & Asset Adder */}
        <aside className="w-80 shrink-0 space-y-5 overflow-y-auto border-r border-slate-800 bg-slate-900 p-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Showcase Header Title
            </label>
            <input
              type="text"
              value={header.title || ''}
              onChange={(e) => setHeader({ ...header, title: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Showcase Subtitle
            </label>
            <textarea
              rows={3}
              value={header.subtitle || ''}
              onChange={(e) => setHeader({ ...header, subtitle: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Add Asset to Collection
            </div>
            <button
              onClick={() =>
                setItems([
                  ...items,
                  {
                    id: `ci_${Date.now()}`,
                    assetType: 'FLOW',
                    assetId: '4fLyMFzH8BjqgKQF4Bd6',
                    order: items.length,
                  },
                ])
              }
              className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              Add Interactive Demo Flow
            </button>
            <button
              onClick={() =>
                setItems([
                  ...items,
                  {
                    id: `ci_${Date.now()}`,
                    assetType: 'VIDEO',
                    assetId: 'qGe4L499rr5AsLtm6F4q',
                    order: items.length,
                  },
                ])
              }
              className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-amber-400" />
              Add 30s AI Launch Video
            </button>
          </div>
        </aside>

        {/* Main Collection Preview */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
              Multi-Asset Collection Hub ({items.length} Assets)
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white">{header.title}</h1>
            <p className="mt-2 text-sm text-slate-400">{header.subtitle}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {items.map((item, idx) => {
                const meta = resolveItemMeta(item);
                return (
                  <div
                    key={item.id || idx}
                    className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                  >
                    <img
                      src={meta.thumbnailUrl}
                      alt={meta.title}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">
                          {meta.type === 'FLOW' ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            <Film className="h-3 w-3" />
                          )}
                          {meta.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItem(idx, -1)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(idx, 1)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-bold text-white">{meta.title}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{meta.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
