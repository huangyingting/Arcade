'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Play,
  ArrowRight,
  Layers,
  Video,
  Image as ImageIcon,
  Wand2,
  CheckCircle2,
  Globe,
  Shield,
  BarChart3,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { UI_DICTIONARY, SupportedUiLang, getSavedUiLang } from '@/lib/i18n';

export default function MarketingHomePage() {
  const router = useRouter();
  const [activeHeroTab, setActiveHeroTab] = useState<'demo' | 'video' | 'visuals'>('demo');
  const [promptUrl, setPromptUrl] = useState('https://whoami.genisisiq.com');
  const [stepIdx, setStepIdx] = useState(0);
  const [lang, setLang] = useState<SupportedUiLang>('en');

  useEffect(() => {
    setLang(getSavedUiLang());
    const handler = (e: Event) => {
      const next = (e as CustomEvent<SupportedUiLang>).detail;
      if (next) setLang(next);
    };
    window.addEventListener('arcade-lang-change', handler);
    return () => window.removeEventListener('arcade-lang-change', handler);
  }, []);

  const t = UI_DICTIONARY[lang] || UI_DICTIONARY.en;

  const previewSteps = [
    {
      title: '1. Hero Overview — Doers, Not Talkers',
      subtitle: '120+ Verified AI & Cloud Badges + 2,300+ Indexed Use Cases',
      img: '/media/scene1.png',
      hotspot: { x: '68%', y: '72%', label: 'Explore 120+ Verified Credentials →' },
    },
    {
      title: '2. Cryptographically Verified Credentials Matrix',
      subtitle: 'SC-100 Cybersecurity Architect, AZ-305, Generative AI Leader & 120+ Badges',
      img: '/media/scene2.png',
      hotspot: { x: '52%', y: '56%', label: 'Verify SC-100 & Cloud Badges ↗' },
    },
    {
      title: '3. 2,300+ Enterprise AI Use Cases Explorer',
      subtitle: 'Filter by Cloud Provider, Industry Vertical, and Architecture Pattern',
      img: '/media/scene3.png',
      hotspot: { x: '44%', y: '48%', label: 'Launch Architecture Blueprint' },
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.heroBadge}</span>
            <Link href="/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit" className="underline ml-1">
              {t.openStudio} →
            </Link>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
            {t.heroTitlePrefix}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            {t.heroSubtitle}
          </p>

          {/* Instant URL / AI Studio Launcher */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:flex-row">
            <input
              type="text"
              value={promptUrl}
              onChange={(e) => setPromptUrl(e.target.value)}
              placeholder="Paste any website URL (e.g. https://whoami.genisisiq.com)"
              className="flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none"
            />
            <button
              onClick={() => router.push('/workspaces/workspace-5p8xcsfv')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              <Wand2 className="h-4 w-4" />
              Generate in Studio
            </button>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Get started free
            </Link>
          </div>

          {/* Interactive Product Switcher Tabs */}
          <div className="mt-10 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveHeroTab('demo')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeHeroTab === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4 text-indigo-600" />
              Interactive Demo
            </button>
            <button
              onClick={() => setActiveHeroTab('video')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeHeroTab === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="h-4 w-4 text-violet-600" />
              AI Launch Video (30s)
            </button>
            <button
              onClick={() => setActiveHeroTab('visuals')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeHeroTab === 'visuals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              Multi-Format AI Visuals
            </button>
          </div>

          {/* Live Interactive Hero Showcase */}
          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="ml-2 rounded-md bg-slate-800 px-2.5 py-1 font-mono text-slate-200">
                  https://whoami.genisisiq.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/flows/4fLyMFzH8BjqgKQF4Bd6/edit"
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Open in Flow Editor ↗
                </Link>
                <Link
                  href="/share/319HqogqYEOZH11srxTM"
                  className="text-amber-400 hover:text-amber-300 font-medium"
                >
                  Full Share Player ↗
                </Link>
              </div>
            </div>

            {activeHeroTab === 'demo' && (
              <div className="relative">
                <img
                  src={previewSteps[stepIdx].img}
                  alt={previewSteps[stepIdx].title}
                  className="h-[480px] w-full object-cover"
                />
                <button
                  onClick={() => setStepIdx((stepIdx + 1) % previewSteps.length)}
                  style={{
                    left: previewSteps[stepIdx].hotspot.x,
                    top: previewSteps[stepIdx].hotspot.y,
                  }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border-2 border-amber-400 bg-slate-950/95 px-4 py-2 text-xs font-semibold text-white shadow-2xl hover:scale-105 transition"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400" />
                  </span>
                  <span>{previewSteps[stepIdx].hotspot.label}</span>
                </button>
                <div className="flex items-center justify-between bg-slate-900/95 px-6 py-3 text-left text-white">
                  <div>
                    <div className="text-sm font-semibold">{previewSteps[stepIdx].title}</div>
                    <div className="text-xs text-slate-400">{previewSteps[stepIdx].subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {previewSteps.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setStepIdx(idx)}
                        className={`h-2.5 rounded-full transition-all ${
                          stepIdx === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeHeroTab === 'video' && (
              <div className="relative bg-slate-950 p-6">
                <video
                  src="/media/whoami-launch.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  className="mx-auto h-[440px] w-full rounded-xl object-cover border border-slate-800"
                />
                <div className="mt-4 flex items-center justify-between text-left text-xs text-slate-300">
                  <div>
                    <span className="font-semibold text-amber-400">6 Bauhaus Scenes • 30s • 1080p 30FPS</span> — Generated from <code className="text-white">whoami.genisisiq.com</code> Brand Kit
                  </div>
                  <Link
                    href="/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit"
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500"
                  >
                    Edit in 5-Track NLE Studio <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {activeHeroTab === 'visuals' && (
              <div className="grid grid-cols-1 gap-6 bg-slate-950 p-8 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-500/30 p-6 text-left text-white">
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                    Instagram Post Square • 1080 × 1080
                  </span>
                  <h3 className="mt-4 text-2xl font-bold text-amber-50">
                    2,300+ AI use cases indexed. Verify SC‑100 ↗
                  </h3>
                  <img
                    src="/media/scene1.png"
                    alt="Visual Preview"
                    className="mt-4 h-56 w-full rounded-lg object-cover border border-amber-400/40 shadow-lg"
                  />
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 text-left text-white">
                  <div>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
                      28 Multi-Channel Size Presets
                    </span>
                    <h3 className="mt-3 text-xl font-bold">
                      One Brand Kit → Every Social, Ad & Hero Format
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Instagram, LinkedIn, X (Twitter), Facebook, TikTok, YouTube, Pinterest, Display Ads, and Website Hero banners with Avery AI headline & gradient generation.
                    </p>
                  </div>
                  <Link
                    href="/visual-projects/mVkkeVB4j15x799NHwBH/edit"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Open AI Visuals Editor <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            One platform for every product story
          </h2>
          <p className="mt-3 text-slate-600">
            Explore all live modules seeded with real <code className="font-mono text-indigo-600">whoami.genisisiq.com</code> data.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Interactive Demo Flow Editor</h3>
            <p className="mt-2 text-sm text-slate-600">
              Hotspots, tooltips, pan & zoom keyframes, multi-choice chapters, HTML/image redaction, 11 ElevenLabs voices, and 36-language AI translation.
            </p>
            <Link
              href="/flows/4fLyMFzH8BjqgKQF4Bd6/edit"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Launch Flow Editor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Custom-Code AI Video & 5-Track NLE</h3>
            <p className="mt-2 text-sm text-slate-600">
              7-stage agentic pipeline, parametric Design schema inspector, `@Scene` chat edits, and 5-track timeline (Pan & Zoom, Voiceover, Scenes, Music, SFX).
            </p>
            <Link
              href="/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Launch AI Video Studio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">13-Tab Autonomous Brand Kit</h3>
            <p className="mt-2 text-sm text-slate-600">
              Extracts Brand Overview, Voice & Tone, Colors, Typography, Logos, Designs, Shadows, Corners, Motion, Voiceover, Music, Screenshots, and Media from any URL.
            </p>
            <Link
              href="/workspaces/workspace-5p8xcsfv/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Inspect whoami Brand Kit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
