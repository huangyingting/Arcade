'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { ArrowRight, CheckCircle2, Globe, Sparkles } from 'lucide-react';

export default function ProductSlugPage({ params: rawParams }: { params: Promise<{ slug: string }> }) {
  const params = React.use(rawParams);
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('https://whoami.genisisiq.com');
  const [creating, setCreating] = useState(false);

  const titleMap: Record<
    string,
    {
      title: string;
      subtitle: string;
      ctaUrl: string;
      shareUrl: string;
      previewImg: string;
      features: string[];
    }
  > = {
    'interactive-demos': {
      title: 'Interactive Product Demos',
      subtitle:
        'Build step-by-step interactive walkthroughs with auto-detected button hotspots, callouts, pan & zoom, branching chapters, and 36-language localization.',
      ctaUrl: '/flows/4fLyMFzH8BjqgKQF4Bd6/edit',
      shareUrl: '/share/319HqogqYEOZH11srxTM',
      previewImg: '/media/scene1.png',
      features: [
        'Live Playwright URL Crawler & Auto-Hotspot Coordinates',
        'Pan & Zoom Keyframes, Blur Redaction & HTML Page Morphing',
        'In-Player Lead Capture Forms & 36-Language Auto-Translation',
        'Real FFmpeg 1080p MP4 & Animated GIF Export',
      ],
    },
    videos: {
      title: 'Custom-Code AI Launch Videos',
      subtitle:
        'Turn any product URL into a 60fps programmatic video with a 7-stage agentic pipeline, Design schema inspector, and 5-track NLE timeline.',
      ctaUrl: '/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit',
      shareUrl: '/share/videos/qGe4L499rr5AsLtm6F4q',
      previewImg: '/media/scene2.png',
      features: [
        '7-Stage Agentic Pipeline (Understand → Storyboard → Script → Scenes → Voiceover → SFX)',
        '6-Color Parametric Bauhaus Design Schema & Per-Scene Typography Inspector',
        '5-Track Non-Linear Editor (Scenes, Pan/Zoom, ElevenLabs Voiceover, Music, SFX)',
        'Real Playwright + FFmpeg H.264 MP4 Rendering (720p, 1080p, 4K)',
      ],
    },
    visuals: {
      title: 'Multi-Channel AI Visuals',
      subtitle:
        'Generate 28 social, ad, and hero visual formats from your Brand Kit with Avery AI headline and background generation.',
      ctaUrl: '/visual-projects/mVkkeVB4j15x799NHwBH/edit',
      shareUrl: '/visual-projects/mVkkeVB4j15x799NHwBH/edit',
      previewImg: '/media/visual_preview.png',
      features: [
        '28 Exact Pixel Presets Across Instagram, LinkedIn, X, Facebook, TikTok, YouTube & Ads',
        'Avery AI Copywriting & Bauhaus Gradient Restyling',
        'Custom Image Upload & Live Website Screenshot Extraction',
        'Real Playwright Lossless PNG & FFmpeg Animated MP4 Export',
      ],
    },
  };

  const info = titleMap[params.slug] || titleMap['interactive-demos'];

  async function handleGenerateFromUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setCreating(true);
    try {
      if (params.slug === 'videos') {
        const res = await fetch('/api/prompt-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: urlInput.trim(), durationSec: 30 }),
        });
        const data = await res.json();
        router.push(`/prompt-videos/custom/${data.video?.id || 'qGe4L499rr5AsLtm6F4q'}/edit`);
      } else if (params.slug === 'visuals') {
        const res = await fetch('/api/visual-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteUrl: urlInput.trim() }),
        });
        const data = await res.json();
        router.push(`/visual-projects/${data.project?.id || 'mVkkeVB4j15x799NHwBH'}/edit`);
      } else {
        const res = await fetch('/api/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceUrl: urlInput.trim() }),
        });
        const data = await res.json();
        router.push(`/flows/${data.flow?.id || '4fLyMFzH8BjqgKQF4Bd6'}/edit`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" /> Arcade Product Suite
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-950 sm:text-5xl">{info.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{info.subtitle}</p>

          {/* Live URL Generator Form */}
          <form
            onSubmit={handleGenerateFromUrl}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter any URL (e.g. https://whoami.genisisiq.com)"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Crawling & Building...' : 'Generate from URL →'}
            </button>
          </form>

          <div className="mt-4 flex justify-center gap-4">
            <Link
              href={info.ctaUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Open Seeded Studio Editor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={info.shareUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:underline"
            >
              View Live Public Player ↗
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Production Capabilities</h2>
            <ul className="space-y-3">
              {info.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
            <img src={info.previewImg} alt={info.title} className="w-full object-cover" />
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
