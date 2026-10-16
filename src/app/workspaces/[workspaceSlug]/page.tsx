'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Video,
  Layers,
  Image as ImageIcon,
  FolderPlus,
  Wand2,
  CheckCircle2,
  ExternalLink,
  Play,
  Palette,
  Globe,
  Clock,
  Coins,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { UI_DICTIONARY, SupportedUiLang, getSavedUiLang } from '@/lib/i18n';

export default function WorkspaceHomePage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const { workspaceSlug } = params;
  const router = useRouter();
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

  const [activeTab, setActiveTab] = useState<'video' | 'demo' | 'visuals' | 'collection'>('video');
  const [prompt, setPrompt] = useState(
    'Create a high-impact launch video for https://whoami.genisisiq.com highlighting 120+ verified AI & cloud badges and 2,300+ indexed enterprise AI use cases.'
  );
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [durationSec, setDurationSec] = useState(30);
  const [visualCategory, setVisualCategory] = useState('social_announcement');
  const [generating, setGenerating] = useState(false);

  const [workspace, setWorkspace] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [visualProjects, setVisualProjects] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [brandKits, setBrandKits] = useState<any[]>([]);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [brandKitUrl, setBrandKitUrl] = useState('https://whoami.genisisiq.com');
  const [extractingBrandKit, setExtractingBrandKit] = useState(false);

  async function loadWorkspace() {
    const res = await fetch(`/api/workspaces/${workspaceSlug}`);
    const data = await res.json();
    if (data.workspace) {
      setWorkspace(data.workspace);
      setFlows(data.workspace.flows || []);
      setVideos(data.workspace.promptVideos || []);
      setVisualProjects(data.workspace.visualProjects || []);
      setCollections(data.workspace.collections || []);
      setBrandKits(data.workspace.brandKits || []);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [workspaceSlug]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      if (activeTab === 'video') {
        const res = await fetch('/api/prompt-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio,
            durationSec,
            brandKitId: brandKits[0]?.id,
          }),
        });
        const data = await res.json();
        if (data.video?.id) {
          router.push(`/prompt-videos/custom/${data.video.id}/edit`);
        }
      } else if (activeTab === 'demo') {
        const res = await fetch('/api/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'whoami.genisisiq.com Interactive Walkthrough',
            prompt,
          }),
        });
        const data = await res.json();
        if (data.flow?.id) {
          router.push(`/flows/${data.flow.id}/edit`);
        }
      } else if (activeTab === 'visuals') {
        const res = await fetch('/api/visual-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: visualCategory,
            prompt,
            brandKitId: brandKits[0]?.id,
          }),
        });
        const data = await res.json();
        const vpId = data.visualProject?.id || data.project?.id;
        if (vpId) {
          router.push(`/visual-projects/${vpId}/edit`);
        }
      } else {
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prompt.slice(0, 60) || 'Product Launch Collection',
          }),
        });
        const data = await res.json();
        if (data.collection?.id) {
          router.push(`/collections/${data.collection.id}/edit`);
        }
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleExtractBrandKit() {
    setExtractingBrandKit(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/brand-kits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brandKitUrl }),
      });
      const data = await res.json();
      if (data.brandKit?.id) {
        router.push(`/workspaces/${workspaceSlug}/settings/brand-kits/${data.brandKit.id}`);
      }
    } finally {
      setExtractingBrandKit(false);
    }
  }

  async function handleClaimCredits() {
    setClaimingBonus(true);
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/claim-credits`, {
        method: 'POST',
      });
      await loadWorkspace();
    } finally {
      setClaimingBonus(false);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-8 py-8">
        {/* Top Greeting + Quick Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t.wsWelcome}
            </h1>
            <p className="text-sm text-slate-500">
              {t.wsSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/workspaces/${workspaceSlug}/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Palette className="h-3.5 w-3.5 text-amber-600" />
              whoami.genisisiq.com Brand Kit (13 Tabs)
            </Link>
            <Link
              href="/flows/4fLyMFzH8BjqgKQF4Bd6/edit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> New Arcade
            </Link>
          </div>
        </div>

        {/* 4-Tab AI Studio Composer Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/30 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              {[
                { id: 'video', label: t.tabVideo, icon: Video },
                { id: 'demo', label: t.tabDemo, icon: Layers },
                { id: 'visuals', label: t.tabVisuals, icon: ImageIcon },
                { id: 'collection', label: t.tabCollection, icon: FolderPlus },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5 text-indigo-600" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Brand Kit: whoami.genisisiq.com
              </span>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="mt-4 space-y-3">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Paste a website URL or describe your product launch..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 shadow-2xs focus:border-indigo-600 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {activeTab === 'video' && (
                  <>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
                    >
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Vertical</option>
                      <option value="1:1">1:1 Square</option>
                    </select>
                    <select
                      value={durationSec}
                      onChange={(e) => setDurationSec(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
                    >
                      <option value={15}>15s Fast Teaser (4 Scenes)</option>
                      <option value={30}>30s Product Launch (6 Scenes)</option>
                      <option value={45}>45s Deep Dive</option>
                    </select>
                  </>
                )}

                {activeTab === 'visuals' && (
                  <select
                    value={visualCategory}
                    onChange={(e) => setVisualCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
                  >
                    <option value="social_announcement">Social Announcement</option>
                    <option value="product_benefits">Product Benefits</option>
                    <option value="feature_highlight">Feature Highlight</option>
                    <option value="website_hero">Website Hero Banner</option>
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" />
                {generating ? 'Synthesizing with Avery AI...' : `Generate ${activeTab.toUpperCase()} (50 credits)`}
              </button>
            </div>
          </form>
        </div>

        {/* 5-Step Getting Started Checklist + Claim 200 Bonus Credits + Autonomous Brand Kit Extractor */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Getting Started Checklist (5 / 5 Completed)
                </h2>
                <p className="text-xs text-slate-500">
                  Complete all 5 onboarding steps to unlock +200 bonus AI Studio credits.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClaimCredits}
                disabled={claimingBonus}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Coins className="h-3.5 w-3.5" />
                {claimingBonus ? 'Claiming...' : 'Claim 200 Bonus Credits'}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
              {[
                { label: '1. Extract Brand Kit', href: `/workspaces/${workspaceSlug}/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0` },
                { label: '2. Generate AI Video', href: '/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit' },
                { label: '3. Record Demo Flow', href: '/flows/4fLyMFzH8BjqgKQF4Bd6/edit' },
                { label: '4. Create AI Visuals', href: '/visual-projects/mVkkeVB4j15x799NHwBH/edit' },
                { label: '5. Share Public Link', href: '/share/319HqogqYEOZH11srxTM' },
              ].map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/70"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{step.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Autonomous URL -> Brand Kit Extractor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600">
              <Globe className="h-4 w-4" />
              <span>Autonomous Brand Kit Extractor</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Crawl any URL to populate all 13 Brand Kit tabs automatically.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={brandKitUrl}
                onChange={(e) => setBrandKitUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleExtractBrandKit}
                disabled={extractingBrandKit}
                className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {extractingBrandKit ? 'Crawling...' : 'Extract'}
              </button>
            </div>
          </div>
        </div>

        {/* All Seeded Projects Grid (Interactive Demos, AI Videos, AI Visuals, Collections) */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Studio Creations (whoami.genisisiq.com)
            </h2>
            <Link
              href={`/workspaces/${workspaceSlug}/teams/me`}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Open Full Library →
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Launch Videos */}
            {videos.map((v) => (
              <div
                key={v.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition"
              >
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={v.thumbnailUrl || '/media/scene1.png'}
                    alt={v.name}
                    className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-600/95 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Video className="h-3 w-3" /> AI Launch Video • {v.durationSec}s
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{v.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{v.prompt}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                    <Link
                      href={`/prompt-videos/custom/${v.id}/edit`}
                      className="text-indigo-600 hover:underline"
                    >
                      Open Studio & 5-Track NLE →
                    </Link>
                    <Link
                      href={`/share/videos/${v.shareId}`}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Share ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Interactive Demo Flows */}
            {flows.map((f) => (
              <div
                key={f.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition"
              >
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={f.thumbnailUrl || '/media/scene1.png'}
                    alt={f.name}
                    className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-600/95 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Layers className="h-3 w-3" /> Interactive Demo
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{f.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{f.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                    <Link
                      href={`/flows/${f.id}/edit`}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit Flow →
                    </Link>
                    <div className="flex gap-3">
                      <Link
                        href={`/share/${f.shareId}/guide`}
                        className="text-emerald-600 hover:underline"
                      >
                        Guide ↗
                      </Link>
                      <Link
                        href={`/share/${f.shareId}`}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        Share ↗
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Visual Projects */}
            {visualProjects.map((vp) => (
              <div
                key={vp.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition"
              >
                <div className="relative h-44 bg-slate-950">
                  <img
                    src={vp.thumbnailUrl || '/media/visual_preview.png'}
                    alt={vp.name}
                    className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[10px] font-bold text-white">
                    <ImageIcon className="h-3 w-3" /> AI Visuals (28 Presets)
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{vp.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{vp.prompt}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                    <Link
                      href={`/visual-projects/${vp.id}/edit`}
                      className="text-indigo-600 hover:underline"
                    >
                      Open Canvas Editor →
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Collections */}
            {collections.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition"
              >
                <div className="relative h-44 bg-gradient-to-br from-slate-900 via-indigo-950 to-amber-700 p-5 flex items-end text-white">
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-slate-950">
                    Collection Showcase
                  </span>
                  <div className="font-bold text-base">{c.name}</div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500">
                    Multi-asset showcase hub combining interactive demos and AI launch videos.
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold">
                    <Link
                      href={`/collections/${c.id}/edit`}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit Collection →
                    </Link>
                    <Link
                      href={`/share/collections/${c.shareId}`}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      Public Hub ↗
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
