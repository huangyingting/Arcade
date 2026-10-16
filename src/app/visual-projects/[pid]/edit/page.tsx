'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Check,
  Download,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Film,
  Maximize2,
  Palette,
  Wand2,
} from 'lucide-react';
import { VISUAL_SIZE_PRESETS, VISUAL_TEMPLATES } from '@/types/domain';

export default function VisualProjectEditorPage({ params }: { params: { pid: string } }) {
  const { pid } = params;
  const [project, setProject] = useState<any>(null);
  const [visuals, setVisuals] = useState<any[]>([]);
  const [activeVisualIdx, setActiveVisualIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [averyBusy, setAveryBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/visual-projects/${pid}`);
      const data = await res.json();
      const vp = data.project || data.visualProject;
      if (vp) {
        setProject(vp);
        const parsed = JSON.parse(vp.visualsJson || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisuals(parsed);
        } else {
          setVisuals([
            {
              id: 'vis_ig_sq',
              presetId: 'ig-post-sq',
              platform: 'Instagram',
              presetName: 'Instagram post square',
              width: 1080,
              height: 1080,
              templateId: 'capture',
              isAnimated: true,
              showLogo: true,
              backgroundType: 'image',
              backgroundImageUrl: 'linear-gradient(135deg, #111111 0%, #1E293B 60%, #D4AF37 100%)',
              backgroundColor: '#111111',
              headline: '2,300+ AI use cases indexed. Verify SC‑100 ↗',
              subheadline:
                'Build AI-enabled cloud solutions backed by 120+ verified badges and 2,300+ indexed use cases.',
              headlineColor: '#F4EFE6',
              ctaLabel: 'Explore AI ↗',
              ctaBgColor: '#D4AF37',
              ctaTextColor: '#111111',
              showShadows: true,
              screenshotUrl: '/media/scene1.png',
            },
          ]);
        }
      }
    }
    load();
  }, [pid]);

  const activeVisual = visuals[activeVisualIdx] || visuals[0] || {};
  const activePreset =
    VISUAL_SIZE_PRESETS.find((p) => p.id === activeVisual.presetId) || VISUAL_SIZE_PRESETS[0];

  function updateActiveVisual(patch: Record<string, any>) {
    setVisuals((prev) => prev.map((v, i) => (i === activeVisualIdx ? { ...v, ...patch } : v)));
  }

  function selectOrCreatePreset(preset: (typeof VISUAL_SIZE_PRESETS)[number]) {
    const existingIdx = visuals.findIndex((v) => v.presetId === preset.id);
    if (existingIdx !== -1) {
      setActiveVisualIdx(existingIdx);
      return;
    }
    const base = activeVisual || {};
    const newCard = {
      ...base,
      id: `vis_${preset.id}_${Date.now()}`,
      presetId: preset.id,
      platform: preset.platform,
      presetName: preset.name,
      width: preset.width,
      height: preset.height,
    };
    const next = [...visuals, newCard];
    setVisuals(next);
    setActiveVisualIdx(next.length - 1);
  }

  async function handleSave(nextVisuals = visuals) {
    setSaving(true);
    setSavedToast(false);
    try {
      await fetch(`/api/visual-projects/${project?.id || pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project?.name,
          visuals: nextVisuals,
        }),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function triggerAveryAction(action: 'headline' | 'background' | 'translate', locale?: string) {
    setAveryBusy(true);
    try {
      const res = await fetch(`/api/visual-projects/${project?.id || pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          averyAction: action,
          visualId: activeVisual.id,
          locale,
        }),
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setVisuals(JSON.parse(data.project.visualsJson || '[]'));
      }
    } finally {
      setAveryBusy(false);
    }
  }

  const [exportingAsset, setExportingAsset] = useState(false);
  const [exportedAssetUrl, setExportedAssetUrl] = useState<string | null>(null);

  async function handleExportVisualAsset() {
    setExportingAsset(true);
    try {
      await handleSave();
      const format = activeVisual.isAnimated ? 'mp4' : 'png';
      const res = await fetch(`/api/visual-projects/${project?.id || pid}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, visual: activeVisual }),
      });
      const data = await res.json();
      const url = data.fileUrl || (activeVisual.isAnimated ? '/media/whoami-launch.mp4' : '/media/visual_preview.png');
      setExportedAssetUrl(url);
      setExportNotice(
        `Rendered ${activeVisual.presetName || activePreset.name} (${activeVisual.width || activePreset.width}×${
          activeVisual.height || activePreset.height
        }) as ${format.toUpperCase()} (${data.fileSize || '1.4 MB'})`
      );
    } finally {
      setExportingAsset(false);
    }
  }

  async function handleUploadVisualScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/uploads', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      updateActiveVisual({ screenshotUrl: data.url });
    }
    e.target.value = '';
  }

  const groupedPresets = VISUAL_SIZE_PRESETS.reduce<
    Record<string, Array<(typeof VISUAL_SIZE_PRESETS)[number]>>
  >((acc, preset) => {
    if (!acc[preset.platform]) acc[preset.platform] = [];
    acc[preset.platform].push(preset);
    return acc;
  }, {});

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces/workspace-5p8xcsfv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspace
          </Link>
          <input
            type="text"
            value={project?.name || 'whoami.genisisiq.com Social & Launch Visuals'}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            className="rounded bg-transparent px-2 py-1 text-sm font-bold text-white focus:bg-slate-800 focus:outline-none"
          />
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            AI Visuals Studio • {visuals.length} Active Canvases • {activeVisual.width || activePreset.width}×
            {activeVisual.height || activePreset.height}px
          </span>
        </div>

        <div className="flex items-center gap-2">
          {savedToast && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <select
            aria-label="Translate Visual Card Language"
            disabled={averyBusy}
            defaultValue="en"
            onChange={(e) => triggerAveryAction('translate', e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-amber-300 focus:outline-none"
          >
            <option value="English (US)">🇺🇸 English (EN)</option>
            <option value="Chinese Simplified (简体中文)">🇨🇳 简体中文 (ZH)</option>
            <option value="Japanese (日本語)">🇯🇵 日本語 (JA)</option>
            <option value="Korean (한국어)">🇰🇷 한국어 (KO)</option>
            <option value="Spanish (Español)">🇪🇸 Español (ES)</option>
          </select>
          <button
            onClick={() => triggerAveryAction('headline')}
            disabled={averyBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Avery: Rewrite Copy
          </button>
          <button
            onClick={() => triggerAveryAction('background')}
            disabled={averyBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Avery: Restyle Background
          </button>
          <button
            onClick={handleExportVisualAsset}
            disabled={exportingAsset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            {exportingAsset ? 'Rendering...' : `Export ${activeVisual.isAnimated ? 'MP4' : 'PNG'}`}
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Visual'}
          </button>
        </div>
      </header>

      {exportNotice && (
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-emerald-950/70 px-6 py-2 text-xs text-emerald-200">
          <span>✓ {exportNotice}</span>
          <a
            href={exportedAssetUrl || (activeVisual.isAnimated ? '/media/whoami-launch.mp4' : '/media/visual_preview.png')}
            download
            className="rounded bg-emerald-500 px-2.5 py-1 font-bold text-slate-950"
          >
            Download Asset
          </a>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: 28 Multi-Channel Size Presets */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Maximize2 className="h-3.5 w-3.5" />
            28 Channel Size Presets
          </div>
          <div className="mt-3 space-y-4">
            {Object.entries(groupedPresets).map(([platform, list]) => (
              <div key={platform}>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {platform} ({list.length})
                </div>
                <div className="space-y-1">
                  {list.map((p) => {
                    const active = activeVisual.presetId === p.id;
                    const inProject = visuals.some((v) => v.presetId === p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectOrCreatePreset(p)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                          active
                            ? 'bg-[#D4AF37] font-bold text-slate-950'
                            : inProject
                            ? 'border border-amber-500/40 bg-slate-800 text-amber-200'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="ml-2 shrink-0 font-mono text-[10px] opacity-75">
                          {p.width}×{p.height}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Visual Canvas Stage */}
        <main className="flex flex-1 flex-col items-center justify-center overflow-auto bg-[#090A0F] p-8">
          {/* Active Multi-Canvas Switcher Pills */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {visuals.map((v, idx) => (
              <button
                key={v.id || idx}
                onClick={() => setActiveVisualIdx(idx)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  idx === activeVisualIdx
                    ? 'bg-[#D4AF37] text-slate-950'
                    : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {v.platform}: {v.presetName} ({v.width}×{v.height})
              </button>
            ))}
          </div>

          <div
            className="relative flex w-full max-w-3xl flex-col justify-between overflow-hidden rounded-2xl border border-slate-700 p-8 shadow-2xl transition-all"
            style={{
              background:
                activeVisual.backgroundImageUrl ||
                'linear-gradient(135deg, #111111 0%, #1E293B 60%, #D4AF37 100%)',
              aspectRatio: `${activeVisual.width || activePreset.width} / ${
                activeVisual.height || activePreset.height
              }`,
              maxHeight: '72vh',
            }}
          >
            {/* Top Brand Pill */}
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: activeVisual.ctaBgColor || '#D4AF37',
                  color: activeVisual.ctaTextColor || '#111111',
                }}
              >
                {activeVisual.ctaLabel || 'whoami.genisisiq.com • Verified Architecture'}
              </span>
              <span className="rounded bg-black/50 px-2.5 py-1 font-mono text-[11px] text-slate-200 backdrop-blur">
                {activeVisual.platform || activePreset.platform} • {activeVisual.width || activePreset.width}×
                {activeVisual.height || activePreset.height}
              </span>
            </div>

            {/* Headline & Subheadline */}
            <div className="my-4 max-w-xl">
              <h2
                className="text-2xl font-black leading-tight sm:text-3xl"
                style={{ color: activeVisual.headlineColor || '#F4EFE6' }}
              >
                {activeVisual.headline}
              </h2>
              <p className="mt-1.5 text-xs text-slate-200 sm:text-sm">{activeVisual.subheadline}</p>
            </div>

            {/* Framed Screenshot Asset */}
            <div
              className={`overflow-hidden border border-white/20 bg-slate-950 shadow-2xl ${
                activeVisual.isAnimated ? 'animate-pulse' : ''
              } rounded-xl`}
            >
              <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-[10px] text-slate-400">
                  https://whoami.genisisiq.com
                </span>
              </div>
              <img
                src={activeVisual.screenshotUrl || '/media/scene1.png'}
                alt={activeVisual.headline}
                className="max-h-64 w-full object-cover"
              />
            </div>
          </div>
        </main>

        {/* Right Inspector: Templates, Copy, Background, Frame & Output Mode */}
        <aside className="w-80 shrink-0 space-y-5 overflow-y-auto border-l border-slate-800 bg-slate-900 p-4">
          {/* 5 Layout Templates */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Layers className="h-3.5 w-3.5" />5 Layout Templates
            </label>
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {VISUAL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => updateActiveVisual({ templateId: tpl.id })}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    activeVisual.templateId === tpl.id
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold">{tpl.name}</div>
                  <div className="text-[11px] text-slate-400">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Controls */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">CTA / Badge Pill</label>
              <input
                type="text"
                value={activeVisual.ctaLabel || ''}
                onChange={(e) => updateActiveVisual({ ctaLabel: e.target.value })}
                className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">Headline</label>
              <input
                type="text"
                value={activeVisual.headline || ''}
                onChange={(e) => updateActiveVisual({ headline: e.target.value })}
                className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400">Subheadline</label>
              <textarea
                rows={2}
                value={activeVisual.subheadline || ''}
                onChange={(e) => updateActiveVisual({ subheadline: e.target.value })}
                className="mt-1 w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Screenshot Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Screenshot Source
            </label>
            <select
              value={activeVisual.screenshotUrl || '/media/scene1.png'}
              onChange={(e) => updateActiveVisual({ screenshotUrl: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="/media/scene1.png">Hero & Bauhaus Palette</option>
              <option value="/media/scene2.png">120+ Verified AI & Cloud Badges</option>
              <option value="/media/scene3.png">2,300+ AI Use Cases Explorer</option>
              <option value="/media/scene4.png">Core Architecture Pillars</option>
              <option value="/media/scene5.png">Bauhaus Manifesto Quote</option>
              <option value="/media/scene6.png">Verify Credentials CTA</option>
              {activeVisual.screenshotUrl &&
                !activeVisual.screenshotUrl.startsWith('/media/scene') && (
                  <option value={activeVisual.screenshotUrl}>
                    Custom / Crawled ({activeVisual.screenshotUrl})
                  </option>
                )}
            </select>
            <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-slate-800">
              📤 Upload Custom Image File
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadVisualScreenshot}
                className="hidden"
              />
            </label>
          </div>

          {/* Bauhaus Background Presets */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              Bauhaus Gradients
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                'linear-gradient(135deg, #111111 0%, #1E293B 60%, #D4AF37 100%)',
                'linear-gradient(135deg, #111111 0%, #C42B1C 50%, #D4AF37 100%)',
                'linear-gradient(135deg, #0047AB 0%, #111111 100%)',
              ].map((g, i) => (
                <button
                  key={i}
                  onClick={() => updateActiveVisual({ backgroundImageUrl: g })}
                  className="h-10 rounded-lg border border-slate-700"
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>

          {/* Output Mode: Static PNG vs Animated MP4 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Output Format
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => updateActiveVisual({ isAnimated: false })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold ${
                  !activeVisual.isAnimated
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Static PNG
              </button>
              <button
                onClick={() => updateActiveVisual({ isAnimated: true })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold ${
                  activeVisual.isAnimated
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Film className="h-3.5 w-3.5" /> Animated MP4
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
