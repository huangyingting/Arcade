import React from 'react';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { ExternalLink, Play, Layers, Image as ImageIcon } from 'lucide-react';

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-950">Customer Showcase Gallery</h1>
          <p className="mt-3 text-slate-600">
            Explore real interactive demos, AI launch videos, and visual campaigns generated from <code className="text-indigo-600">whoami.genisisiq.com</code>.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src="/media/scene1.png" alt="Demo" className="h-52 w-full object-cover" />
            <div className="p-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                <Layers className="h-3.5 w-3.5" /> Interactive Demo (5 Steps)
              </span>
              <h3 className="mt-3 text-lg font-bold">whoami.genisisiq.com — Interactive Architecture Tour</h3>
              <p className="mt-1 text-xs text-slate-600">
                Hotspots, pan & zoom, branching chapter, and ElevenLabs narration.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/share/319HqogqYEOZH11srxTM" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Play Share Link ↗
                </Link>
                <Link href="/flows/4fLyMFzH8BjqgKQF4Bd6/edit" className="text-xs font-semibold text-slate-600 hover:underline">
                  Open in Editor →
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src="/media/scene2.png" alt="Video" className="h-52 w-full object-cover" />
            <div className="p-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                <Play className="h-3.5 w-3.5" /> AI Launch Video (30s • 6 Scenes)
              </span>
              <h3 className="mt-3 text-lg font-bold">whoami.genisisiq.com Launch Video (Bauhaus Edition)</h3>
              <p className="mt-1 text-xs text-slate-600">
                Custom-code Remotion scenes, Brand Kit palette, and 5-track NLE timeline.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/share/videos/qGe4L499rr5AsLtm6F4q" className="text-xs font-semibold text-violet-600 hover:underline">
                  Watch Video ↗
                </Link>
                <Link href="/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit" className="text-xs font-semibold text-slate-600 hover:underline">
                  Edit in Studio →
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src="/media/visual_preview.png" alt="Visuals" className="h-52 w-full object-cover" />
            <div className="p-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ImageIcon className="h-3.5 w-3.5" /> Multi-Channel Visuals (28 Presets)
              </span>
              <h3 className="mt-3 text-lg font-bold">2,300+ AI Use Cases Social Campaign</h3>
              <p className="mt-1 text-xs text-slate-600">
                Instagram Square, LinkedIn Landscape, and X Post presets with Avery AI copy.
              </p>
              <div className="mt-4 flex gap-3">
                <Link href="/visual-projects/mVkkeVB4j15x799NHwBH/edit" className="text-xs font-semibold text-emerald-600 hover:underline">
                  Open Visuals Editor ↗
                </Link>
                <Link href="/share/collections/whoami-showcase" className="text-xs font-semibold text-slate-600 hover:underline">
                  View Collection →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
