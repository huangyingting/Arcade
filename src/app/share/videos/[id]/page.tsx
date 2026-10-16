'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, Sparkles, Play } from 'lucide-react';

export default function PublicVideoSharePage({ params: rawParams }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(rawParams);
  const [video, setVideo] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/prompt-videos/${id}`);
      const data = await res.json();
      if (data.video) {
        setVideo(data.video);
        setScenes(JSON.parse(data.video.scenesJson || '[]'));
      }
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37] font-black text-slate-950">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold">{video?.name || 'whoami.genisisiq.com Launch Video'}</h1>
            <p className="text-[11px] text-slate-400">
              AI Launch Video • {video?.durationSec || 30}s • 1080p @ {video?.fps || 30}fps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/media/whoami-launch.mp4"
            download="whoami-genisisiq-launch.mp4"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            Download MP4
          </a>
          <a
            href="https://whoami.genisisiq.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-slate-950"
          >
            Explore whoami.genisisiq.com <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          <video
            src="/media/whoami-launch.mp4"
            poster="/media/scene1.png"
            controls
            autoPlay
            className="aspect-video w-full bg-black"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-4 w-4" />
            Scene Breakdown ({scenes.length} Remotion Scenes)
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {scenes.map((s, idx) => (
              <div key={s.sceneId || idx} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <img
                  src={s.screenshotUrl || `/media/scene${(idx % 6) + 1}.png`}
                  alt={s.title}
                  className="h-28 w-full object-cover"
                />
                <div className="p-3">
                  <div className="text-[10px] font-bold uppercase text-amber-400">
                    Scene {s.sceneNumber || idx + 1} • {s.archetype}
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-white">{s.title}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                    {s.durationSec || 5}s @ 30fps
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
