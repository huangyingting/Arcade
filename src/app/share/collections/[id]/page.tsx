'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Play, Film, Sparkles } from 'lucide-react';

export default function PublicCollectionSharePage({ params: rawParams }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(rawParams);
  const [collection, setCollection] = useState<any>(null);
  const [header, setHeader] = useState<any>({});
  const [items, setItems] = useState<any[]>([]);
  const [flowsCatalog, setFlowsCatalog] = useState<any[]>([]);
  const [videosCatalog, setVideosCatalog] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/collections/${id}`);
      const data = await res.json();
      if (data.flows) setFlowsCatalog(data.flows);
      if (data.videos) setVideosCatalog(data.videos);
      if (data.collection) {
        setCollection(data.collection);
        setHeader(JSON.parse(data.collection.headerJson || '{}'));
        setItems(JSON.parse(data.collection.itemsJson || '[]'));
      }
    }
    load();
  }, [id]);

  function resolveItemMeta(item: any) {
    if (!item) return null;
    const type = item.assetType || item.type || 'FLOW';
    if (type === 'FLOW') {
      const f = flowsCatalog.find((x) => x.id === item.assetId);
      return {
        type: 'FLOW',
        title: item.title || f?.name || 'whoami.genisisiq.com Interactive Tour',
        subtitle: f?.description || '5 Interactive Steps • Hotspots & AI Voiceover',
        thumbnailUrl: f?.thumbnailUrl || '/media/scene1.png',
        shareHref: `/share/${f?.shareId || '319HqogqYEOZH11srxTM'}`,
      };
    } else {
      const v = videosCatalog.find((x) => x.id === item.assetId);
      return {
        type: 'VIDEO',
        title: item.title || v?.name || 'whoami.genisisiq.com Launch Video',
        subtitle: `${v?.durationSec || 30}s Remotion Launch Video • 1080p MP4`,
        thumbnailUrl: v?.thumbnailUrl || '/media/scene2.png',
        shareHref: `/share/videos/${v?.shareId || item.assetId || 'qGe4L499rr5AsLtm6F4q'}`,
      };
    }
  }

  const activeMeta = resolveItemMeta(items[activeIdx] || items[0]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37] font-black text-slate-950">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold">
              {header.title || collection?.name || 'whoami.genisisiq.com Showcase'}
            </h1>
            <p className="text-[11px] text-slate-400">
              Curated Product Demo & AI Video Hub • {items.length} Assets
            </p>
          </div>
        </div>
        <a
          href={header.ctaUrl || 'https://whoami.genisisiq.com'}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-slate-950"
        >
          {header.ctaLabel || 'Open whoami.genisisiq.com ↗'} <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Executive Launch Showcase
          </span>
          <h2 className="mt-3 text-3xl font-extrabold">
            {header.title || collection?.name || 'whoami.genisisiq.com Showcase'}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">{header.subtitle}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Asset Playlist */}
          <div className="space-y-3 lg:col-span-4">
            {items.map((item, idx) => {
              const meta = resolveItemMeta(item);
              if (!meta) return null;
              return (
                <button
                  key={item.id || idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    activeIdx === idx
                      ? 'border-amber-400 bg-slate-900 shadow-lg'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={meta.thumbnailUrl}
                    alt={meta.title}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">
                      {meta.type === 'FLOW' ? (
                        <Play className="h-3 w-3" />
                      ) : (
                        <Film className="h-3 w-3" />
                      )}
                      {meta.type}
                    </div>
                    <div className="truncate text-xs font-bold text-white">{meta.title}</div>
                    <div className="truncate text-[11px] text-slate-400">{meta.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Stage */}
          <div className="lg:col-span-8">
            {activeMeta && (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
                {activeMeta.type === 'VIDEO' ? (
                  <video
                    src="/media/whoami-launch.mp4"
                    poster={activeMeta.thumbnailUrl}
                    controls
                    autoPlay
                    className="aspect-video w-full bg-black"
                  />
                ) : (
                  <div className="relative aspect-video w-full">
                    <img
                      src={activeMeta.thumbnailUrl}
                      alt={activeMeta.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 p-6 text-center backdrop-blur-sm">
                      <h3 className="text-2xl font-bold text-white">{activeMeta.title}</h3>
                      <p className="mt-1 text-xs text-slate-300">{activeMeta.subtitle}</p>
                      <Link
                        href={activeMeta.shareHref}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Launch Interactive Flow
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
