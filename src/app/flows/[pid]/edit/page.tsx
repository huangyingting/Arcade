'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  Sparkles,
  Volume2,
  MousePointerClick,
  ZoomIn,
  Layers,
  Globe,
  Share2,
  BarChart3,
  BookOpen,
  Palette,
  Eye,
  Wand2,
  ShieldAlert,
  Play,
  Download,
  Code2,
  ExternalLink,
  Copy,
  MessageSquare,
} from 'lucide-react';
import { ELEVENLABS_VOICES, TRANSLATION_LOCALES } from '@/types/domain';

type StudioTab = 'edit' | 'theme' | 'guide' | 'insights' | 'share';

const toPct = (v: number | undefined, fallback = 50) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return v <= 1 && v >= 0 ? Math.round(v * 1000) / 10 : v;
};

export default function FlowEditorPage({ params }: { params: { pid: string } }) {
  const { pid } = params;
  const [flow, setFlow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [studioTab, setStudioTab] = useState<StudioTab>('edit');
  const [design, setDesign] = useState<any>({
    wrapperStyle: 'browser_dark',
    backgroundType: 'gradient',
    backgroundColor: '#111111',
    padding: 32,
    borderRadius: 16,
    primaryColor: '#D4AF37',
    showWatermark: true,
    showProgressBar: true,
    watermarkText: 'whoami.genisisiq.com',
  });
  const [variables, setVariables] = useState<any[]>([
    { key: 'first_name', label: 'Viewer First Name', fallbackValue: 'Builder' },
    { key: 'company_name', label: 'Target Company', fallbackValue: 'Enterprise Cloud' },
  ]);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Interactive canvas tools: Hotspot, Callout, Redaction Blur, Page Morph, Pan & Zoom
  const [canvasTool, setCanvasTool] = useState<'select' | 'hotspot' | 'callout' | 'redact' | 'morph'>('select');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [exportingVideo, setExportingVideo] = useState(false);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [captureUrlInput, setCaptureUrlInput] = useState('https://whoami.genisisiq.com');
  const [capturingLive, setCapturingLive] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/flows/${pid}`);
      const data = await res.json();
      if (data.flow) {
        setFlow(data.flow);
        const parsedSteps = JSON.parse(data.flow.stepsJson || '[]');
        setSteps(parsedSteps);
        setDesign((prev: any) => ({ ...prev, ...JSON.parse(data.flow.designJson || '{}') }));
        const parsedVars = JSON.parse(data.flow.variablesJson || '[]');
        if (parsedVars.length > 0) setVariables(parsedVars);
        setTranslations(JSON.parse(data.flow.translationsJson || '{}'));
      }
    }
    load();
  }, [pid]);

  const activeStep = steps[activeStepIdx] || null;

  async function saveFlow(updatedSteps = steps, updatedDesign = design, updatedTranslations = translations) {
    setSaving(true);
    setSavedToast(false);
    try {
      await fetch(`/api/flows/${flow?.id || pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flow?.name,
          steps: updatedSteps,
          design: updatedDesign,
          variables,
          translations: updatedTranslations,
        }),
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function updateActiveStep(patch: Record<string, any>) {
    const next = steps.map((s, idx) => (idx === activeStepIdx ? { ...s, ...patch } : s));
    setSteps(next);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeStep || !canvasRef.current || canvasTool === 'select') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const normX = Math.max(0.05, Math.min(0.92, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0.05, Math.min(0.92, (e.clientY - rect.top) / rect.height));

    if (canvasTool === 'hotspot') {
      const newHotspot = {
        id: `hs_${Date.now()}`,
        x: normX,
        y: normY,
        tooltipText: 'Click here to verify credential on whoami.genisisiq.com',
        style: 'beacon',
        color: design.primaryColor || '#D4AF37',
        tooltipPosition: 'bottom',
        trigger: 'click',
        targetType: 'next_step',
      };
      updateActiveStep({ hotspots: [...(activeStep.hotspots || []), newHotspot] });
      setCanvasTool('select');
    } else if (canvasTool === 'callout') {
      const newCallout = {
        id: `co_${Date.now()}`,
        x: normX,
        y: normY,
        title: 'Key Architecture Insight',
        body: 'Explain why this capability matters for {{company_name}}.',
        theme: 'dark',
        pointerDirection: 'top',
        showNavButtons: true,
        primaryButtonLabel: 'Next Step →',
      };
      updateActiveStep({ callouts: [...(activeStep.callouts || []), newCallout] });
      setCanvasTool('select');
    } else if (canvasTool === 'redact') {
      const newBlur = {
        id: `ar_blur_${Date.now()}`,
        mode: 'blur',
        x: normX,
        y: normY,
        width: 0.18,
        height: 0.08,
        intensity: 10,
      };
      updateActiveStep({ areas: [...(activeStep.areas || []), newBlur] });
      setCanvasTool('select');
    } else if (canvasTool === 'morph') {
      const newMorph = {
        id: `morph_${Date.now()}`,
        x: Math.round(normX * 100),
        y: Math.round(normY * 100),
        originalText: 'Production Cloud Metrics',
        replacementText: '120+ Verified Badges • {{company_name}}',
      };
      updateActiveStep({ pageMorphs: [...(activeStep.pageMorphs || []), newMorph] });
      setCanvasTool('select');
    }
  }

  function addStep(type: 'IMAGE' | 'CHAPTER') {
    const newStep =
      type === 'CHAPTER'
        ? {
            id: `step_${Date.now()}`,
            order: steps.length,
            type: 'CHAPTER',
            title: 'Architecture Deep-Dive Chapter',
            mediaUrl: '/media/scene4.png',
            hotspots: [],
            callouts: [],
            areas: [],
            panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
            voiceover: {
              enabled: true,
              script: 'Ready to verify every AI and cloud architecture credential live?',
              voiceId: 'ava-natural',
              speed: 1.0,
              audioUrl: '/media/voiceover-sample.wav',
              durationSec: 5,
            },
            chapter: {
              title: 'Verify Credentials on whoami.genisisiq.com',
              subtitle: 'Explore 120+ Credly badges and 2,300+ AI use cases.',
              alignment: 'center',
              backgroundStyle: 'blur_step',
              backgroundValue: '#111111',
              showLogo: true,
              interactionMode: 'buttons',
              buttons: [
                { id: `btn_${Date.now()}`, label: 'Continue Tour →', variant: 'primary', action: 'next_step' },
              ],
              formFields: [],
            },
          }
        : {
            id: `step_${Date.now()}`,
            order: steps.length,
            type: 'IMAGE',
            title: `Step ${steps.length + 1}: Core Architecture Pillars`,
            mediaUrl: `/media/scene${(steps.length % 6) + 1}.png`,
            hotspots: [
              {
                id: `hs_${Date.now()}`,
                x: 0.54,
                y: 0.48,
                style: 'beacon',
                color: '#D4AF37',
                tooltipText: 'Inspect SC-100 & AZ-305 architecture blueprints',
                tooltipPosition: 'bottom',
                trigger: 'click',
                targetType: 'next_step',
              },
            ],
            callouts: [],
            areas: [],
            panAndZoom: { enabled: false, x: 0.15, y: 0.15, width: 0.7, height: 0.7, scale: 1.25 },
            voiceover: {
              enabled: true,
              script: 'Inspect the three core pillars: Cloud Security, GenAI Systems, and Bauhaus UX.',
              voiceId: 'ava-natural',
              speed: 1.0,
              audioUrl: '/media/voiceover-sample.wav',
              durationSec: 5,
            },
          };
    const next = [...steps, newStep];
    setSteps(next);
    setActiveStepIdx(next.length - 1);
  }

  function deleteStep(idx: number) {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== idx);
    setSteps(next);
    setActiveStepIdx(Math.max(0, idx - 1));
  }

  async function generateAutoTranslation(localeCode: string) {
    setSelectedLocale(localeCode);
    setSaving(true);
    try {
      const res = await fetch(`/api/flows/${flow?.id || pid}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: localeCode }),
      });
      const data = await res.json();
      if (data.translations) {
        setTranslations(data.translations);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleExportMp4() {
    setExportingVideo(true);
    try {
      await saveFlow();
      const res = await fetch(`/api/flows/${flow?.id || pid}/export-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'mp4', resolution: '1080p' }),
      });
      const data = await res.json();
      setExportedVideoUrl(data.downloadUrl || '/media/whoami-launch.mp4');
    } finally {
      setExportingVideo(false);
    }
  }

  async function handleCaptureLiveUrl() {
    if (!captureUrlInput.trim()) return;
    setCapturingLive(true);
    try {
      const res = await fetch(`/api/flows/${flow?.id || pid}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: captureUrlInput.trim(), replaceSteps: false }),
      });
      const data = await res.json();
      if (data.steps) {
        setSteps(data.steps);
        setActiveStepIdx(data.steps.length - 1);
      }
    } finally {
      setCapturingLive(false);
    }
  }

  async function handleUploadStepImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        const newStep = {
          id: `step_${Date.now()}`,
          order: steps.length,
          type: 'IMAGE',
          title: `Step ${steps.length + 1}: ${file.name.replace(/\.[^.]+$/, '')}`,
          mediaUrl: data.url,
          hotspots: [
            {
              id: `hs_${Date.now()}`,
              x: 0.52,
              y: 0.48,
              style: 'beacon',
              color: '#D4AF37',
              tooltipText: 'Click here to continue',
              tooltipPosition: 'bottom',
              trigger: 'click',
              targetType: 'next_step',
            },
          ],
          callouts: [],
          areas: [],
          panAndZoom: { enabled: false, x: 0.5, y: 0.5, scale: 1.25 },
          voiceover: {
            enabled: true,
            script: `Explore ${file.name} in this interactive step.`,
            voiceId: 'ava-natural',
            speed: 1.0,
            audioUrl: '/media/voiceover-sample.wav',
            durationSec: 4,
          },
        };
        const next = [...steps, newStep];
        setSteps(next);
        setActiveStepIdx(next.length - 1);
        await saveFlow(next, design, translations);
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  const shareUrl = `https://app.arcade.software/share/${flow?.shareId || '319HqogqYEOZH11srxTM'}`;
  const localSharePath = `/share/${flow?.shareId || '319HqogqYEOZH11srxTM'}`;
  const localGuidePath = `/share/${flow?.shareId || '319HqogqYEOZH11srxTM'}/guide`;

  const stepMediaUrl = activeStep?.mediaUrl || activeStep?.imageUrl || '/media/scene1.png';
  const stepVoiceoverScript = activeStep?.voiceover?.script ?? activeStep?.voiceoverText ?? '';
  const stepVoiceId = activeStep?.voiceover?.voiceId || activeStep?.voiceId || 'ava-natural';
  const stepPanZoom = activeStep?.panAndZoom || activeStep?.panZoom || { enabled: false, scale: 1.35, x: 0.5, y: 0.5 };
  const stepChapter = activeStep?.chapter || activeStep?.chapterConfig || {};

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      {/* Top Studio Bar */}
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
            value={flow?.name || 'whoami.genisisiq.com Interactive Tour'}
            onChange={(e) => setFlow({ ...flow, name: e.target.value })}
            className="rounded-md bg-transparent px-2 py-1 text-sm font-bold text-white focus:bg-slate-800 focus:outline-none"
          />
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            Interactive Flow • {steps.length} Steps
          </span>
        </div>

        {/* Center Mode Switcher */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
          {[
            { id: 'edit', label: 'Edit Steps', icon: MousePointerClick },
            { id: 'theme', label: 'Theme & Brand', icon: Palette },
            { id: 'guide', label: 'Step-by-Step Guide', icon: BookOpen },
            { id: 'insights', label: 'Insights', icon: BarChart3 },
            { id: 'share', label: 'Share & Embed', icon: Share2 },
          ].map((t) => {
            const Icon = t.icon;
            const active = studioTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setStudioTab(t.id as StudioTab)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {savedToast && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <Link
            href={localSharePath}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview Player
          </Link>
          <button
            onClick={handleExportMp4}
            disabled={exportingVideo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            {exportingVideo ? 'Rendering MP4...' : 'Export Video'}
          </button>
          <button
            onClick={() => saveFlow()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Publish Changes'}
          </button>
        </div>
      </header>

      {exportedVideoUrl && (
        <div className="flex items-center justify-between border-b border-emerald-500/30 bg-emerald-950/60 px-6 py-2 text-xs text-emerald-200">
          <span>
            MP4 Video rendered from Flow steps at 60fps: <strong>{exportedVideoUrl}</strong>
          </span>
          <a
            href={exportedVideoUrl}
            download="whoami-flow-export.mp4"
            className="rounded bg-emerald-500 px-2.5 py-1 font-bold text-slate-950"
          >
            Download MP4
          </a>
        </div>
      )}

      {/* TAB 1: EDIT STEPS STUDIO */}
      {studioTab === 'edit' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Rail: Step Storyboard List */}
          <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Steps ({steps.length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => addStep('IMAGE')}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                  title="Add Screenshot Step"
                >
                  <Plus className="h-3 w-3" /> Step
                </button>
                <button
                  onClick={() => addStep('CHAPTER')}
                  className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/30"
                  title="Add Chapter / Form Step"
                >
                  <Plus className="h-3 w-3" /> Chapter
                </button>
              </div>
            </div>

            {/* Live URL Crawler & Local Image Uploader */}
            <div className="space-y-2 border-b border-slate-800 bg-slate-950/70 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Live URL Recorder / Upload
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={captureUrlInput}
                  onChange={(e) => setCaptureUrlInput(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-white"
                />
                <button
                  onClick={handleCaptureLiveUrl}
                  disabled={capturingLive}
                  className="shrink-0 rounded bg-amber-500 px-2 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {capturingLive ? 'Crawling...' : 'Capture'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadStepImage}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full rounded border border-slate-700 bg-slate-900 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
              >
                {uploadingImage ? 'Uploading...' : '📤 Upload Screenshot File'}
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {steps.map((step, idx) => {
                const isSelected = idx === activeStepIdx;
                const thumbUrl = step.mediaUrl || step.imageUrl || '/media/scene1.png';
                return (
                  <div
                    key={step.id || idx}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`group relative cursor-pointer rounded-xl border p-2.5 transition ${
                      isSelected
                        ? 'border-amber-500 bg-slate-800/90 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>
                        #{idx + 1} • {step.type === 'CHAPTER' ? 'Chapter' : 'Hotspot Step'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStep(idx);
                        }}
                        className="opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                      <img src={thumbUrl} alt={step.title} className="h-20 w-full object-cover" />
                    </div>
                    <div className="mt-1.5 truncate text-xs font-semibold text-slate-200">
                      {step.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Center Interactive Canvas */}
          <main className="flex flex-1 flex-col overflow-hidden bg-slate-950">
            {/* Canvas Floating Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCanvasTool('hotspot')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    canvasTool === 'hotspot'
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {canvasTool === 'hotspot' ? 'Click Canvas to Place Hotspot...' : 'Add Hotspot'}
                </button>

                <button
                  onClick={() => setCanvasTool('callout')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    canvasTool === 'callout'
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {canvasTool === 'callout' ? 'Click Canvas to Place Callout...' : 'Add Callout'}
                </button>

                <button
                  onClick={() => setCanvasTool('morph')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    canvasTool === 'morph'
                      ? 'bg-indigo-500 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {canvasTool === 'morph' ? 'Click Element to Morph HTML...' : 'Page Morph (DOM Edit)'}
                </button>

                <button
                  onClick={() => setCanvasTool('redact')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    canvasTool === 'redact'
                      ? 'bg-rose-500 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {canvasTool === 'redact' ? 'Click Area to Blur PII...' : 'Blur / Redact Area'}
                </button>

                <button
                  onClick={() =>
                    updateActiveStep({
                      panAndZoom: {
                        ...stepPanZoom,
                        enabled: !stepPanZoom.enabled,
                        scale: stepPanZoom.scale || 1.35,
                      },
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    stepPanZoom.enabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  Camera Pan & Zoom {stepPanZoom.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                <span>Locale:</span>
                <select
                  value={selectedLocale}
                  onChange={(e) => {
                    if (e.target.value !== 'en' && !translations[e.target.value]) {
                      generateAutoTranslation(e.target.value);
                    } else {
                      setSelectedLocale(e.target.value);
                    }
                  }}
                  className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                >
                  <option value="en">English (Default)</option>
                  {TRANSLATION_LOCALES.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name} {translations[loc.code] ? '✓' : '(Auto-Translate)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive Stage */}
            <div className="flex flex-1 items-center justify-center overflow-auto p-8">
              {activeStep && (
                <div
                  className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 shadow-2xl"
                  style={{
                    backgroundColor: design.backgroundColor || '#111111',
                    padding: `${design.padding || 24}px`,
                  }}
                >
                  {/* Browser Chrome Header */}
                  <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-slate-700 bg-slate-900 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="rounded-md bg-slate-950 px-4 py-1 font-mono text-[11px] text-slate-400">
                      https://whoami.genisisiq.com
                    </div>
                    <div className="text-[11px] font-semibold text-amber-400">
                      Step {activeStepIdx + 1} / {steps.length}
                    </div>
                  </div>

                  {/* Screenshot + Overlays */}
                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className={`relative aspect-video w-full overflow-hidden rounded-b-xl bg-slate-950 ${
                      canvasTool !== 'select' ? 'cursor-crosshair ring-2 ring-amber-400' : ''
                    }`}
                  >
                    <img
                      src={stepMediaUrl}
                      alt={activeStep.title}
                      className="h-full w-full object-cover transition-transform duration-500"
                      style={{
                        transform: stepPanZoom.enabled ? `scale(${stepPanZoom.scale || 1.35})` : 'scale(1)',
                      }}
                    />

                    {/* Chapter Overlay if CHAPTER step */}
                    {activeStep.type === 'CHAPTER' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 p-8 text-center backdrop-blur-md">
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                          whoami.genisisiq.com • Interactive Chapter
                        </span>
                        <h2 className="mt-4 max-w-xl text-3xl font-extrabold text-white">
                          {stepChapter.title || activeStep.title}
                        </h2>
                        <p className="mt-2 max-w-lg text-sm text-slate-300">
                          {stepChapter.subtitle ||
                            'Explore 120+ verified AI & Cloud certifications and 2,300+ indexed AI use cases.'}
                        </p>

                        {stepChapter.interactionMode === 'form' && (
                          <div className="mt-5 w-full max-w-sm space-y-2 rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-left">
                            {(stepChapter.formFields || []).map((ff: any) => (
                              <div key={ff.id || ff.key}>
                                <label className="block text-[10px] font-semibold uppercase text-slate-400">
                                  {ff.label}
                                </label>
                                <input
                                  type="text"
                                  readOnly
                                  placeholder={ff.placeholder}
                                  className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                            ))}
                            <button className="mt-2 w-full rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950">
                              {stepChapter.formSubmitLabel || 'Unlock Full Architecture Demo →'}
                            </button>
                          </div>
                        )}

                        {stepChapter.interactionMode !== 'form' && (
                          <div className="mt-6 flex flex-wrap justify-center gap-3">
                            {(stepChapter.buttons || [
                              { id: 'b1', label: 'Start Interactive Tour →', variant: 'primary' },
                            ]).map((btn: any, bIdx: number) => (
                              <button
                                key={btn.id || bIdx}
                                className={`rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg ${
                                  btn.variant === 'secondary'
                                    ? 'border border-slate-700 bg-slate-900 text-white'
                                    : 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Redaction / Highlight Areas (supports seeded `areas` and `redactions`) */}
                    {(activeStep.areas || []).map((area: any) => (
                      <div
                        key={area.id}
                        style={{
                          left: `${toPct(area.x, 10)}%`,
                          top: `${toPct(area.y, 10)}%`,
                          width: `${toPct(area.width, 20)}%`,
                          height: `${toPct(area.height, 10)}%`,
                        }}
                        className={`absolute rounded-lg ${
                          area.mode === 'blur'
                            ? 'border border-rose-400/60 bg-slate-900/40 backdrop-blur-md'
                            : 'border-2 border-amber-400/70 bg-amber-400/5'
                        }`}
                      />
                    ))}

                    {/* Page Morph DOM Patches */}
                    {(activeStep.pageMorphs || []).map((m: any) => (
                      <div
                        key={m.id}
                        style={{ left: `${toPct(m.x, 40)}%`, top: `${toPct(m.y, 40)}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-indigo-400 bg-slate-900/95 px-3 py-1.5 text-xs font-bold text-indigo-200 shadow-lg"
                      >
                        {m.replacementText}
                      </div>
                    ))}

                    {/* Callout Cards */}
                    {(activeStep.callouts || []).map((co: any) => (
                      <div
                        key={co.id}
                        style={{ left: `${toPct(co.x, 25)}%`, top: `${toPct(co.y, 70)}%` }}
                        className="absolute z-10 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-400/60 bg-slate-950/95 p-3.5 text-left shadow-2xl"
                      >
                        <div className="text-xs font-bold text-amber-400">{co.title}</div>
                        <div className="mt-1 text-[11px] leading-relaxed text-slate-200">{co.body}</div>
                      </div>
                    ))}

                    {/* Pulsing Hotspots */}
                    {(activeStep.hotspots || []).map((hs: any) => {
                      const labelText = hs.tooltipText || hs.calloutText || 'Click to continue';
                      return (
                        <div
                          key={hs.id}
                          style={{ left: `${toPct(hs.x, 50)}%`, top: `${toPct(hs.y, 50)}%` }}
                          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                        >
                          <div className="relative flex items-center justify-center">
                            <span
                              className="absolute h-10 w-10 animate-ping rounded-full opacity-75"
                              style={{ backgroundColor: hs.color || design.primaryColor || '#D4AF37' }}
                            />
                            <span
                              className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-lg"
                              style={{ backgroundColor: hs.color || design.primaryColor || '#D4AF37' }}
                            />
                          </div>
                          <div className="mt-2 w-60 -translate-x-1/3 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs font-medium text-white shadow-xl">
                            {labelText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Right Inspector: Step Properties, Hotspots, Callouts, AI Voiceover */}
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-900 p-4">
            {activeStep && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Step Title
                  </label>
                  <input
                    type="text"
                    value={activeStep.title || ''}
                    onChange={(e) => updateActiveStep({ title: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Step Screenshot Asset
                  </label>
                  <select
                    value={stepMediaUrl}
                    onChange={(e) => updateActiveStep({ mediaUrl: e.target.value, imageUrl: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="/media/scene1.png">Scene 1 — Portfolio Hero & Bauhaus Palette</option>
                    <option value="/media/scene2.png">Scene 2 — 120+ Verified AI & Cloud Badges</option>
                    <option value="/media/scene3.png">Scene 3 — 2,300+ AI Use Cases Explorer</option>
                    <option value="/media/scene4.png">Scene 4 — Core Architecture Pillars</option>
                    <option value="/media/scene5.png">Scene 5 — Bauhaus Manifesto Quote</option>
                    <option value="/media/scene6.png">Scene 6 — Verify Credentials CTA</option>
                  </select>
                </div>

                {/* Hotspots Inspector */}
                {activeStep.type !== 'CHAPTER' && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Hotspots ({(activeStep.hotspots || []).length})
                      </span>
                      <button
                        onClick={() => setCanvasTool('hotspot')}
                        className="text-[11px] font-semibold text-amber-400 hover:underline"
                      >
                        + Add on Canvas
                      </button>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {(activeStep.hotspots || []).map((hs: any, hIdx: number) => (
                        <div key={hs.id || hIdx} className="rounded-lg border border-slate-800 bg-slate-900 p-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>
                              Hotspot #{hIdx + 1} ({toPct(hs.x)}%, {toPct(hs.y)}%)
                            </span>
                            <button
                              onClick={() =>
                                updateActiveStep({
                                  hotspots: activeStep.hotspots.filter((_: any, i: number) => i !== hIdx),
                                })
                              }
                              className="text-rose-400 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={hs.tooltipText || hs.calloutText || ''}
                            onChange={(e) => {
                              const nextHs = [...activeStep.hotspots];
                              nextHs[hIdx] = {
                                ...hs,
                                tooltipText: e.target.value,
                                calloutText: e.target.value,
                              };
                              updateActiveStep({ hotspots: nextHs });
                            }}
                            className="mt-1.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synthetic AI Voiceover */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                    AI Step Voiceover (ElevenLabs)
                  </div>
                  <select
                    value={stepVoiceId}
                    onChange={(e) =>
                      updateActiveStep({
                        voiceover: { ...(activeStep.voiceover || {}), enabled: true, voiceId: e.target.value },
                      })
                    }
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  >
                    {ELEVENLABS_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.tone}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={3}
                    value={stepVoiceoverScript}
                    onChange={(e) =>
                      updateActiveStep({
                        voiceover: {
                          ...(activeStep.voiceover || { enabled: true, voiceId: stepVoiceId, speed: 1.0 }),
                          script: e.target.value,
                        },
                        voiceoverText: e.target.value,
                      })
                    }
                    placeholder="Write step narration script..."
                    className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  />
                  <audio controls src="/media/voiceover-sample.wav" className="mt-2 h-8 w-full" />
                </div>

                {/* Personalization Variables */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="text-xs font-bold text-slate-200">Dynamic Personalization Tokens</div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Use <code className="text-amber-300">{'{{company_name}}'}</code> or{' '}
                    <code className="text-amber-300">{'{{first_name}}'}</code> in callouts.
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {variables.map((v, i) => (
                      <div key={v.key || i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-amber-300">{`{{${v.key}}}`}</span>
                        <input
                          type="text"
                          value={v.fallbackValue || v.defaultValue || ''}
                          onChange={(e) => {
                            const next = [...variables];
                            next[i] = { ...v, fallbackValue: e.target.value };
                            setVariables(next);
                          }}
                          className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* TAB 2: THEME & BRAND */}
      {studioTab === 'theme' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">Flow Wrapper & Brand Theme</h2>
            <p className="mt-1 text-xs text-slate-400">
              Synchronized with whoami.genisisiq.com Bauhaus Brand Kit (`#111111` Obsidian & `#D4AF37` Gold).
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Primary Hotspot Color</label>
                <input
                  type="text"
                  value={design.primaryColor || '#D4AF37'}
                  onChange={(e) => setDesign({ ...design, primaryColor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300">Canvas Background Color</label>
                <input
                  type="text"
                  value={design.backgroundColor || '#111111'}
                  onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300">Canvas Padding (px)</label>
                <input
                  type="number"
                  value={design.padding ?? 32}
                  onChange={(e) => setDesign({ ...design, padding: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300">Watermark Text</label>
                <input
                  type="text"
                  value={design.watermarkText || 'whoami.genisisiq.com'}
                  onChange={(e) => setDesign({ ...design, watermarkText: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTO-DERIVED STEP-BY-STEP GUIDE */}
      {studioTab === 'guide' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Auto-Derived Documentation Guide
                </span>
                <h2 className="mt-1 text-2xl font-extrabold text-white">{flow?.name}</h2>
              </div>
              <Link
                href={localGuidePath}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
              >
                Open Public Guide <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 space-y-6">
              {steps.map((s, i) => (
                <div key={s.id || i} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <div className="text-xs font-bold text-amber-400">Step {i + 1}</div>
                  <h3 className="mt-1 text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-300">
                    {s.hotspots?.[0]?.tooltipText || s.voiceover?.script || s.chapter?.subtitle}
                  </p>
                  <img
                    src={s.mediaUrl || s.imageUrl || '/media/scene1.png'}
                    alt={s.title}
                    className="mt-3 max-h-64 w-full rounded-lg border border-slate-800 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PER-FLOW INSIGHTS & DROP-OFF FUNNEL */}
      {studioTab === 'insights' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Views', value: flow?.viewsCount || 148 },
                { label: 'Completions', value: flow?.completionsCount || 112 },
                { label: 'Completion Rate', value: '75.7%' },
                { label: 'Avg. Time Spent', value: '1m 08s' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="text-xs text-slate-400">{stat.label}</div>
                  <div className="mt-1 text-2xl font-extrabold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-base font-bold text-white">Step-by-Step Drop-Off Funnel</h3>
              <div className="mt-4 space-y-3">
                {steps.map((s, idx) => {
                  const pct = Math.max(64, 100 - idx * 7);
                  return (
                    <div key={s.id || idx}>
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>
                          Step {idx + 1}: {s.title}
                        </span>
                        <span>{pct}% retained</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SHARE & EMBED */}
      {studioTab === 'share' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-lg font-bold text-white">Public Share Link & Personalized URLs</h2>
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${shareUrl}?company_name=Microsoft&first_name=Satya`}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200"
                />
                <Link
                  href={`${localSharePath}?company_name=Microsoft`}
                  target="_blank"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
                >
                  Open Live Player ↗
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Responsive Iframe Embed Code</h3>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `<iframe src="${shareUrl}" width="100%" height="640" frameborder="0" allowfullscreen></iframe>`
                    );
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedEmbed ? 'Copied!' : 'Copy Embed'}
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-amber-300">
                {`<div style="position:relative;padding-bottom:56.25%;height:0;">
  <iframe src="${shareUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
</div>`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
