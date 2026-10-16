'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  Sparkles,
  RefreshCw,
  Save,
  Check,
  Volume2,
  Music,
  Image as ImageIcon,
  Film,
  Type,
  Layers,
  Box,
  CornerUpRight,
  Zap,
  FileText,
  MessageSquareQuote,
  ShieldCheck,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { ELEVENLABS_VOICES } from '@/types/domain';

const BRAND_KIT_TABS = [
  { id: 'overview', label: 'Brand Overview', icon: FileText },
  { id: 'voice', label: 'Voice & Tone', icon: MessageSquareQuote },
  { id: 'colors', label: 'Colors', icon: Palette },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'logos', label: 'Logos', icon: ShieldCheck },
  { id: 'designs', label: 'Designs', icon: Layers },
  { id: 'shadows', label: 'Shadow', icon: Box },
  { id: 'corners', label: 'Corner', icon: CornerUpRight },
  { id: 'motion', label: 'Motion', icon: Zap },
  { id: 'voiceover', label: 'Voiceover', icon: Volume2 },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'media', label: 'Media', icon: Film },
] as const;

export default function BrandKitEditorPage({
  params,
}: {
  params: { workspaceSlug: string; brandKitId: string };
}) {
  const { workspaceSlug, brandKitId } = params;
  const [activeTab, setActiveTab] = useState<(typeof BRAND_KIT_TABS)[number]['id']>('overview');
  const [brandKit, setBrandKit] = useState<any>(null);

  // Exact 13 Prisma BrandKit JSON states
  const [sources, setSources] = useState<any[]>([]);
  const [logos, setLogos] = useState<any>({});
  const [colors, setColors] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any>({});
  const [photography, setPhotography] = useState<any[]>([]);
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [illustrations, setIllustrations] = useState<any[]>([]);
  const [product, setProduct] = useState<any>({});
  const [voice, setVoice] = useState<any>({});
  const [tones, setTones] = useState<any[]>([]);
  const [demoSettings, setDemoSettings] = useState<any>({});
  const [sharePage, setSharePage] = useState<any>({});
  const [customElements, setCustomElements] = useState<any[]>([]);

  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [recrawling, setRecrawling] = useState(false);

  async function loadBrandKit() {
    const res = await fetch(`/api/brand-kits/${brandKitId}`);
    const data = await res.json();
    if (data.brandKit) {
      const bk = data.brandKit;
      setBrandKit(bk);
      setSources(JSON.parse(bk.sourcesJson || '[]'));
      setLogos(JSON.parse(bk.logosJson || '{}'));
      const parsedColors = JSON.parse(bk.colorsJson || '[]');
      setColors(Array.isArray(parsedColors) ? parsedColors : []);
      setFonts(JSON.parse(bk.fontsJson || '{}'));
      setPhotography(JSON.parse(bk.photographyJson || '[]'));
      setBackgrounds(JSON.parse(bk.backgroundsJson || '[]'));
      setIllustrations(JSON.parse(bk.illustrationsJson || '[]'));
      setProduct(JSON.parse(bk.productJson || '{}'));
      setVoice(JSON.parse(bk.voiceJson || '{}'));
      setTones(JSON.parse(bk.tonesJson || '[]'));
      setDemoSettings(JSON.parse(bk.demoSettingsJson || '{}'));
      setSharePage(JSON.parse(bk.sharePageJson || '{}'));
      setCustomElements(JSON.parse(bk.customElementsJson || '[]'));
    }
  }

  useEffect(() => {
    loadBrandKit();
  }, [brandKitId]);

  async function handleSave() {
    setSaving(true);
    setSavedNotice(false);
    try {
      await fetch(`/api/brand-kits/${brandKit?.id || brandKitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brandKit?.name,
          sourceUrl: brandKit?.sourceUrl,
          sources,
          logos,
          colors,
          fonts,
          photography,
          backgrounds,
          illustrations,
          product,
          voice,
          tones,
          demoSettings,
          sharePage,
          customElements,
        }),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleRecrawl(customUrl?: string) {
    setRecrawling(true);
    try {
      await fetch(`/api/brand-kits/${brandKit?.id || brandKitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resyncUrl: customUrl || brandKit?.sourceUrl || 'https://whoami.genisisiq.com',
        }),
      });
      setNewSourceUrl('');
      await loadBrandKit();
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setRecrawling(false);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href={`/workspaces/${workspaceSlug}/settings/general`} className="hover:underline">
                Settings
              </Link>
              <span>/</span>
              <span>Brand Kits</span>
              <span>/</span>
              <span className="font-semibold text-slate-900">
                {brandKit?.name || 'whoami.genisisiq.com'}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                {brandKit?.name || 'whoami.genisisiq.com'} Brand Kit
              </h1>
              {brandKit?.isDefault && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Default Brand Kit
                </span>
              )}
              <a
                href={brandKit?.sourceUrl || 'https://whoami.genisisiq.com'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                {brandKit?.sourceUrl || 'https://whoami.genisisiq.com'}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Saved to Database
              </span>
            )}
            <button
              onClick={() => handleRecrawl()}
              disabled={recrawling}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${recrawling ? 'animate-spin' : ''}`} />
              {recrawling ? 'Re-Extracting Brand...' : 'Re-Extract from URL'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Brand Kit'}
            </button>
          </div>
        </header>

        {/* 13-Tab Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Tab Navigation */}
          <aside className="w-60 overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              13 Brand Sections
            </div>
            <div className="space-y-0.5">
              {BRAND_KIT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Tab Inspector */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-4xl">
              {/* TAB 1: BRAND OVERVIEW & SOURCES */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600">
                      <Sparkles className="h-4 w-4" />
                      AI Brand Intelligence • {brandKit?.sourceUrl || 'https://whoami.genisisiq.com'}
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      Product Overview, ICP & Synced Sources
                    </h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Product / Brand Name
                        </label>
                        <input
                          type="text"
                          value={product.productName || ''}
                          onChange={(e) => setProduct({ ...product, productName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Hero Tagline
                        </label>
                        <input
                          type="text"
                          value={product.tagline || ''}
                          onChange={(e) => setProduct({ ...product, tagline: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700">
                        Value Proposition Summary
                      </label>
                      <textarea
                        rows={3}
                        value={product.description || ''}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    {/* ICP Profiles */}
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Ideal Customer Profiles (ICP)
                      </h3>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        {(product.icp || []).map((item: any, idx: number) => (
                          <div key={item.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                            <input
                              type="text"
                              value={item.role || ''}
                              onChange={(e) => {
                                const next = [...(product.icp || [])];
                                next[idx] = { ...item, role: e.target.value };
                                setProduct({ ...product, icp: next });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                            />
                            <textarea
                              rows={2}
                              value={item.painPoint || ''}
                              onChange={(e) => {
                                const next = [...(product.icp || [])];
                                next[idx] = { ...item, painPoint: e.target.value };
                                setProduct({ ...product, icp: next });
                              }}
                              className="mt-1 w-full bg-transparent text-xs text-slate-600 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Messaging Pillars */}
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Key Messaging Pillars
                      </h3>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        {(product.keyMessaging || []).map((km: any, idx: number) => (
                          <div key={km.id || idx} className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
                            <input
                              type="text"
                              value={km.title || ''}
                              onChange={(e) => {
                                const next = [...(product.keyMessaging || [])];
                                next[idx] = { ...km, title: e.target.value };
                                setProduct({ ...product, keyMessaging: next });
                              }}
                              className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                            />
                            <textarea
                              rows={2}
                              value={km.body || ''}
                              onChange={(e) => {
                                const next = [...(product.keyMessaging || [])];
                                next[idx] = { ...km, body: e.target.value };
                                setProduct({ ...product, keyMessaging: next });
                              }}
                              className="mt-1 w-full bg-transparent text-xs text-slate-700 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Indexed Sources Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Synced Knowledge Sources</h3>
                        <p className="text-xs text-slate-500">
                          URLs crawled to extract logos, Bauhaus colors, screenshots, and messaging.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://whoami.genisisiq.com/..."
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          onClick={() => newSourceUrl && handleRecrawl(newSourceUrl)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Index URL
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 divide-y divide-slate-100">
                      {sources.map((src: any) => (
                        <div key={src.id} className="flex items-center justify-between py-2.5 text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                              {src.status || 'Synced'}
                            </span>
                            <span className="font-mono font-semibold text-slate-900">{src.url}</span>
                          </div>
                          <span className="text-slate-500">
                            {src.pagesIndexed || 6} pages indexed • {src.type || 'Website'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VOICE & TONE */}
              {activeTab === 'voice' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Brand Voice & Channel Tones</h2>
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700">Voice Summary</label>
                      <input
                        type="text"
                        value={voice.summary || ''}
                        onChange={(e) => setVoice({ ...voice, summary: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-semibold text-slate-700">Voice Traits</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(voice.traits || []).map((trait: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-amber-300"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="text-xs font-bold uppercase text-emerald-800">Writing Do&apos;s</div>
                        <ul className="mt-2 space-y-1.5 text-xs text-emerald-950">
                          {(voice.dos || []).map((d: string, i: number) => (
                            <li key={i}>• {d}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                        <div className="text-xs font-bold uppercase text-rose-800">Writing Don&apos;ts</div>
                        <ul className="mt-2 space-y-1.5 text-xs text-rose-950">
                          {(voice.donts || []).map((d: string, i: number) => (
                            <li key={i}>• {d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900">Channel-Specific Tones ({tones.length})</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {tones.map((t: any, idx: number) => (
                        <div key={t.id || idx} className="rounded-xl border border-slate-200 p-4">
                          <input
                            type="text"
                            value={t.name || ''}
                            onChange={(e) => {
                              const next = [...tones];
                              next[idx] = { ...t, name: e.target.value };
                              setTones(next);
                            }}
                            className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                          />
                          <textarea
                            rows={2}
                            value={t.description || ''}
                            onChange={(e) => {
                              const next = [...tones];
                              next[idx] = { ...t, description: e.target.value };
                              setTones(next);
                            }}
                            className="mt-1 w-full text-xs text-slate-600 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BAUHAUS COLORS */}
              {activeTab === 'colors' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Bauhaus Multi-Palette Tokens</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Extracted from whoami.genisisiq.com and synchronized across AI Videos, Flows, and Visuals.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setColors([
                          ...colors,
                          { id: `c_${Date.now()}`, role: 'Custom Token', name: 'New Brand Color', hex: '#D4AF37' },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Color
                    </button>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {colors.map((c: any, idx: number) => (
                      <div key={c.id || idx} className="rounded-xl border border-slate-200 p-4">
                        <div
                          className="h-20 w-full rounded-lg border border-slate-200 shadow-inner"
                          style={{ backgroundColor: c.hex || '#111111' }}
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] font-semibold uppercase text-slate-400">{c.role}</div>
                            <input
                              type="text"
                              value={c.name || ''}
                              onChange={(e) => {
                                const next = [...colors];
                                next[idx] = { ...c, name: e.target.value };
                                setColors(next);
                              }}
                              className="text-xs font-bold text-slate-900 focus:outline-none"
                            />
                          </div>
                          <input
                            type="color"
                            value={c.hex || '#111111'}
                            onChange={(e) => {
                              const next = [...colors];
                              next[idx] = { ...c, hex: e.target.value };
                              setColors(next);
                            }}
                            className="h-8 w-8 cursor-pointer rounded border border-slate-200"
                          />
                        </div>
                        <input
                          type="text"
                          value={c.hex || ''}
                          onChange={(e) => {
                            const next = [...colors];
                            next[idx] = { ...c, hex: e.target.value };
                            setColors(next);
                          }}
                          className="mt-2 w-full rounded border border-slate-200 px-2.5 py-1 font-mono text-xs uppercase"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TYPOGRAPHY */}
              {activeTab === 'typography' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Typography Hierarchy</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    {[
                      { key: 'headingFont', label: 'Display / Heading Font', weightKey: 'headingWeight' },
                      { key: 'bodyFont', label: 'Body Copy Font', weightKey: 'bodyWeight' },
                      { key: 'monoFont', label: 'Monospace / Credential Font', weightKey: '' },
                    ].map((f) => (
                      <div key={f.key} className="rounded-xl border border-slate-200 p-4">
                        <label className="block text-xs font-semibold text-slate-700">{f.label}</label>
                        <input
                          type="text"
                          value={fonts[f.key] || 'Inter'}
                          onChange={(e) => setFonts({ ...fonts, [f.key]: e.target.value })}
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                        />
                        <p className="mt-3 text-lg font-bold text-slate-900">
                          Doers, not talkers. 120+ Badges.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: LOGOS */}
              {activeTab === 'logos' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Brand Logos & Monogram</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-950 p-6 text-white">
                      <div className="text-xs font-semibold text-slate-400">Dark Surface Wordmark</div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37] font-black text-slate-950">
                          {logos.iconText || 'W'}
                        </div>
                        <span className="text-lg font-bold tracking-tight">
                          {logos.brandMonogram || 'YI-TING HUANG'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={logos.brandMonogram || ''}
                        onChange={(e) => setLogos({ ...logos, brandMonogram: e.target.value })}
                        className="mt-4 w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-[#F4EFE6] p-6 text-slate-900">
                      <div className="text-xs font-semibold text-slate-500">Light Surface Mark</div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 font-black text-[#D4AF37]">
                          {logos.iconText || 'W'}
                        </div>
                        <span className="text-lg font-bold tracking-tight">whoami.genisisiq.com</span>
                      </div>
                      <input
                        type="text"
                        value={logos.lightLogoUrl || '/media/scene1.png'}
                        onChange={(e) => setLogos({ ...logos, lightLogoUrl: e.target.value })}
                        className="mt-4 w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DESIGNS, BACKGROUNDS & ILLUSTRATIONS */}
              {activeTab === 'designs' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Bauhaus Gradients & Backgrounds ({backgrounds.length})</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {backgrounds.map((bg: any, idx: number) => (
                        <div key={bg.id || idx} className="overflow-hidden rounded-xl border border-slate-200">
                          <div className="h-24 w-full" style={{ background: bg.style || bg.hex }} />
                          <div className="p-3">
                            <div className="text-xs font-bold text-slate-900">{bg.name}</div>
                            <div className="mt-0.5 truncate font-mono text-[10px] text-slate-500">{bg.style}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900">Illustration Styles & Custom Overlays</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {illustrations.map((il: any) => (
                        <div key={il.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-bold text-slate-900">{il.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{il.style}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SHADOW */}
              {activeTab === 'shadows' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Demo Wrapper & Elevation Shadow</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {['browser_dark', 'browser_light', 'floating_glass'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setDemoSettings({ ...demoSettings, wrapperStyle: style })}
                        className={`rounded-xl border p-5 text-left transition ${
                          demoSettings.wrapperStyle === style
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-bold capitalize">{style.replace('_', ' ')}</div>
                        <div className="mt-1 text-xs opacity-75">Bauhaus Studio Frame</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: CORNER */}
              {activeTab === 'corners' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Hotspot & Callout Styling</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Default Hotspot Color</label>
                      <input
                        type="text"
                        value={demoSettings.hotspotColor || '#D4AF37'}
                        onChange={(e) => setDemoSettings({ ...demoSettings, hotspotColor: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Callout Theme</label>
                      <select
                        value={demoSettings.calloutTheme || 'dark'}
                        onChange={(e) => setDemoSettings({ ...demoSettings, calloutTheme: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="dark">Obsidian Dark (#111111)</option>
                        <option value="light">Warm Ivory (#F4EFE6)</option>
                        <option value="brand">Bauhaus Gold (#D4AF37)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: MOTION */}
              {activeTab === 'motion' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Remotion Camera & Transition Physics</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Controls pan-and-zoom camera curves and kinetic typography spring physics.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {['beacon', 'pulse_ring', 'Bauhaus_spring'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setDemoSettings({ ...demoSettings, hotspotStyle: style })}
                        className={`rounded-xl border p-4 text-left ${
                          demoSettings.hotspotStyle === style
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-bold capitalize">{style.replace('_', ' ')}</div>
                        <div className="mt-1 text-xs opacity-75">30 FPS Remotion Spring</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 10: VOICEOVER */}
              {activeTab === 'voiceover' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Default ElevenLabs AI Voiceover</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {ELEVENLABS_VOICES.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{v.name}</div>
                          <div className="text-xs text-slate-500">
                            {v.accent} • {v.tone}
                          </div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 11: MUSIC */}
              {activeTab === 'music' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Background Music & Audio Ducking</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Default soundtrack: Bauhaus Minimal Pulse (120 BPM) at 35% ducked level during voiceover.
                  </p>
                  <audio controls src="/media/voiceover-sample.wav" className="mt-4 w-full" />
                </div>
              )}

              {/* TAB 12: SCREENSHOTS & PHOTOGRAPHY */}
              {activeTab === 'screenshots' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Extracted Product Screenshots ({photography.length})
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Captured live from whoami.genisisiq.com and ready for Flow Steps, AI Videos, and Visuals.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPhotography([
                          ...photography,
                          {
                            id: `ph_${Date.now()}`,
                            title: 'Bauhaus Manifesto View',
                            url: '/media/scene5.png',
                          },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Screenshot
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {photography.map((shot: any, idx: number) => (
                      <div key={shot.id || idx} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          src={shot.url || '/media/scene1.png'}
                          alt={shot.title}
                          className="h-44 w-full object-cover"
                        />
                        <div className="flex items-center justify-between p-3">
                          <input
                            type="text"
                            value={shot.title || ''}
                            onChange={(e) => {
                              const next = [...photography];
                              next[idx] = { ...shot, title: e.target.value };
                              setPhotography(next);
                            }}
                            className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                          />
                          <button
                            onClick={() => setPhotography(photography.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 13: MEDIA & SHARE PAGE */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Share Page & Custom Brand Overlays</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Primary CTA Label</label>
                        <input
                          type="text"
                          value={sharePage.primaryCtaLabel || 'Verify Credentials ↗'}
                          onChange={(e) => setSharePage({ ...sharePage, primaryCtaLabel: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">Primary CTA Destination URL</label>
                        <input
                          type="url"
                          value={sharePage.primaryCtaUrl || 'https://whoami.genisisiq.com'}
                          onChange={(e) => setSharePage({ ...sharePage, primaryCtaUrl: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900">Rendered Video & Audio Assets</h3>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-950 p-4 text-white">
                      <div className="mb-2 text-xs font-bold">whoami.genisisiq.com Launch Video (1080p MP4)</div>
                      <video
                        src="/media/whoami-launch.mp4"
                        controls
                        className="max-h-64 w-full rounded-lg bg-black"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
