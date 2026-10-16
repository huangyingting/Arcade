'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Palette,
  MessageSquare,
  Send,
  Save,
  Check,
  Download,
  Share2,
  Volume2,
  Music,
  Zap,
  ZoomIn,
  Layers,
  CheckCircle2,
  History,
  BookA,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ELEVENLABS_VOICES,
  BACKGROUND_MUSIC_TRACKS,
  SFX_LIBRARY,
} from '@/types/domain';

export default function PromptVideoStudioPage({ params: rawParams }: { params: Promise<{ pid: string }> }) {
  const { pid } = React.use(rawParams);
  const [video, setVideo] = useState<any>(null);
  const [inspectorTab, setInspectorTab] = useState<'chat' | 'design'>('chat');

  // Exact Prisma PromptVideo JSON states
  const [scenes, setScenes] = useState<any[]>([]);
  const [designSchema, setDesignSchema] = useState<any>({ colors: [], scenes: [] });
  const [designValues, setDesignValues] = useState<any>({ colors: {}, scenes: {} });
  const [timeline, setTimeline] = useState<any>({
    totalDurationSec: 30,
    fps: 30,
    panZoomTrack: [],
    voiceoverTrack: [],
    scenesTrack: [],
    musicTrack: [],
    sfxTrack: [],
  });
  const [pronunciations, setPronunciations] = useState<any[]>([]);
  const [exportsList, setExportsList] = useState<any[]>([]);
  const [agentStages, setAgentStages] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Player & NLE Playhead state (30.0s @ 30fps)
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatSceneTag, setSelectedChatSceneTag] = useState<string>('');
  const [sendingChat, setSendingChat] = useState(false);

  // Modals & Drawers
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [showExportDrawer, setShowExportDrawer] = useState(false);
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [exportFps, setExportFps] = useState<30 | 60>(30);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  function hydrateVideo(v: any) {
    setVideo(v);
    setScenes(JSON.parse(v.scenesJson || '[]'));
    setDesignSchema(JSON.parse(v.designSchemaJson || '{"colors":[],"scenes":[]}'));
    setDesignValues(JSON.parse(v.designValuesJson || '{"colors":{},"scenes":{}}'));
    setTimeline(
      JSON.parse(
        v.timelineJson ||
          '{"totalDurationSec":30,"fps":30,"panZoomTrack":[],"voiceoverTrack":[],"scenesTrack":[],"musicTrack":[],"sfxTrack":[]}'
      )
    );
    setPronunciations(JSON.parse(v.pronunciationJson || '[]'));
    setExportsList(JSON.parse(v.exportsJson || '[]'));
    const latestSession = v.sessions?.[0];
    if (latestSession) {
      setAgentStages(JSON.parse(latestSession.stagesJson || '[]'));
      setChatHistory(JSON.parse(latestSession.messagesJson || '[]'));
    }
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/prompt-videos/${pid}`);
      const data = await res.json();
      if (data.video) {
        hydrateVideo(data.video);
      }
    }
    load();
  }, [pid]);

  const totalDuration = timeline.totalDurationSec || video?.durationSec || 30;

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1;
        if (next >= totalDuration) {
          setPlaying(false);
          return 0;
        }
        return Number(next.toFixed(1));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing, totalDuration]);

  // Determine active scene from playhead or selection
  const activePlayheadSceneIdx = Math.min(
    Math.max(0, scenes.length - 1),
    Math.floor(currentTime / 5)
  );
  const displaySceneIdx = playing ? activePlayheadSceneIdx : selectedSceneIdx;
  const activeScene = scenes[displaySceneIdx] || scenes[0] || null;
  const activeSceneId = activeScene?.sceneId || `scene_${displaySceneIdx + 1}`;
  const activeSceneValues = designValues.scenes?.[activeSceneId] || {};
  const activeVoiceoverClip =
    (timeline.voiceoverTrack || []).find((vo: any) => vo.sceneId === activeSceneId) ||
    (timeline.voiceoverTrack || [])[displaySceneIdx] ||
    null;

  const colorsMap = designValues.colors || {
    BackgroundPrimary: '#111111',
    BackgroundSecondary: '#F4EFE6',
    TextPrimary: '#F4EFE6',
    TextSecondary: '#9CA3AF',
    AccentPrimary: '#D4AF37',
    AccentSecondary: '#C42B1C',
  };

  async function handleSaveStudio(
    nextScenes = scenes,
    nextDesignValues = designValues,
    nextTimeline = timeline,
    nextPronunciations = pronunciations
  ) {
    setSaving(true);
    setSavedNotice(false);
    try {
      await fetch(`/api/prompt-videos/${video?.id || pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: video?.name,
          scenes: nextScenes,
          designSchema,
          designValues: nextDesignValues,
          timeline: nextTimeline,
          pronunciation: nextPronunciations,
        }),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/prompt-videos/${video?.id || pid}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          targetSceneId: selectedChatSceneTag || activeSceneId,
          updatedText: chatInput.length < 48 ? chatInput.toUpperCase() : undefined,
        }),
      });
      const data = await res.json();
      if (data.video) {
        hydrateVideo(data.video);
      }
      setChatInput('');
    } finally {
      setSendingChat(false);
    }
  }

  async function triggerExportRender() {
    setExportProgress(15);
    const timer = setInterval(() => {
      setExportProgress((prev) => {
        if (prev === null || prev >= 90) return prev;
        return prev + 25;
      });
    }, 250);

    try {
      const res = await fetch(`/api/prompt-videos/${video?.id || pid}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: exportResolution,
          fps: exportFps,
        }),
      });
      const data = await res.json();
      clearInterval(timer);
      setExportProgress(100);
      if (data.exports) {
        setExportsList(data.exports);
      }
    } catch {
      clearInterval(timer);
      setExportProgress(100);
    }
  }

  function updateColorValue(key: string, hex: string) {
    setDesignValues({
      ...designValues,
      colors: {
        ...(designValues.colors || {}),
        [key]: hex,
      },
    });
  }

  function updateSceneFieldValue(sceneId: string, fieldKey: string, val: string) {
    setDesignValues({
      ...designValues,
      scenes: {
        ...(designValues.scenes || {}),
        [sceneId]: {
          ...(designValues.scenes?.[sceneId] || {}),
          [fieldKey]: val,
        },
      },
    });
  }

  const [translatingVideoLocale, setTranslatingVideoLocale] = useState<string>('en');
  const [translatingBusy, setTranslatingBusy] = useState(false);

  async function handleTranslateVideo(localeCode: string) {
    setTranslatingVideoLocale(localeCode);
    setTranslatingBusy(true);
    try {
      const res = await fetch(`/api/prompt-videos/${video?.id || pid}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: localeCode }),
      });
      const data = await res.json();
      if (data.video) {
        hydrateVideo(data.video);
      }
    } finally {
      setTranslatingBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0C10] text-slate-100">
      {/* Top Studio Header */}
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
            value={video?.name || 'whoami.genisisiq.com Launch'}
            onChange={(e) => setVideo({ ...video, name: e.target.value })}
            className="rounded bg-transparent px-2 py-1 text-sm font-bold text-white focus:bg-slate-800 focus:outline-none"
          />
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            Remotion 30fps • {totalDuration}s • {scenes.length} Scenes • v{video?.currentVersion || 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          <select
            aria-label="Localize Video Language"
            value={translatingVideoLocale}
            disabled={translatingBusy}
            onChange={(e) => handleTranslateVideo(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-amber-300 focus:outline-none"
          >
            <option value="en">🇺🇸 English (EN)</option>
            <option value="zh-CN">🇨🇳 简体中文 (ZH)</option>
            <option value="ja">🇯🇵 日本語 (JA)</option>
            <option value="ko">🇰🇷 한국어 (KO)</option>
            <option value="es">🇪🇸 Español (ES)</option>
            <option value="fr">🇫🇷 Français (FR)</option>
            <option value="de">🇩🇪 Deutsch (DE)</option>
          </select>
          <button
            onClick={() => setShowPronunciationModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <BookA className="h-3.5 w-3.5 text-amber-400" />
            Pronunciation ({pronunciations.length})
          </button>
          <Link
            href={`/share/videos/${video?.shareId || pid}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share Page
          </Link>
          <button
            onClick={() => setShowExportDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            Export MP4
          </button>
          <button
            onClick={() => handleSaveStudio()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save Studio'}
          </button>
        </div>
      </header>

      {/* Upper Split: Left Chat/Design Inspector + Right Live Remotion Composition Stage */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Chat & Design Schema Inspector */}
        <aside className="flex w-96 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
          {/* Sub-Tabs: Chat vs Design */}
          <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950 p-1.5">
            <button
              onClick={() => setInspectorTab('chat')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                inspectorTab === 'chat'
                  ? 'bg-slate-800 text-amber-400 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat & Agent (7 Stages)
            </button>
            <button
              onClick={() => setInspectorTab('design')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
                inspectorTab === 'design'
                  ? 'bg-slate-800 text-amber-400 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              Design Schema
            </button>
          </div>

          {/* LEFT TAB 1: AGENTIC PIPELINE & CHAT */}
          {inspectorTab === 'chat' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* 7-Stage Agentic Progress Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      7-Stage AI Video Agent
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      7/7 Completed
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {agentStages.map((step: any, idx: number) => (
                      <div
                        key={step.id || idx}
                        className="flex items-start gap-2 rounded-lg bg-slate-900/80 px-2.5 py-1.5 text-xs"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {step.number || idx + 1}. {step.title}
                            </span>
                            {step.durationSec && (
                              <span className="text-[10px] text-slate-500">{step.durationSec}s</span>
                            )}
                          </div>
                          <div className="truncate text-[11px] text-slate-400">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Snapshot Chip */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-amber-400" />
                      Active Snapshot
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      Version v{video?.currentVersion || 1}
                    </span>
                  </div>
                </div>

                {/* Chat Thread */}
                <div className="space-y-2.5">
                  {chatHistory.map((msg: any, idx: number) => (
                    <div
                      key={msg.id || idx}
                      className={`rounded-xl p-3 text-xs ${
                        msg.role === 'user'
                          ? 'ml-4 bg-amber-500/20 text-amber-100'
                          : 'mr-4 border border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-bold uppercase text-slate-400">
                        {msg.role === 'user' ? 'You' : 'Avery Video Agent'}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Prompt Form with @Scene Tagging */}
              <form onSubmit={handleSendChat} className="border-t border-slate-800 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Target:</span>
                  <select
                    value={selectedChatSceneTag}
                    onChange={(e) => setSelectedChatSceneTag(e.target.value)}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-amber-300"
                  >
                    <option value="">All Scenes</option>
                    {scenes.map((s, idx) => (
                      <option key={s.sceneId || idx} value={s.sceneId}>
                        @Scene {s.sceneNumber || idx + 1}: {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask Avery to refine a scene or headline..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat}
                    className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LEFT TAB 2: DESIGN SCHEMA INSPECTOR (Colors + Per-Scene Text Fields) */}
          {inspectorTab === 'design' && (
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {/* 6 Color Swatches from designSchema.colors */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Colors (Bauhaus Theme Schema)
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {(designSchema.colors?.length
                    ? designSchema.colors
                    : [
                        { key: 'BackgroundPrimary', label: 'Background Primary', defaultHex: '#111111' },
                        { key: 'BackgroundSecondary', label: 'Background Secondary', defaultHex: '#F4EFE6' },
                        { key: 'TextPrimary', label: 'Text Primary', defaultHex: '#F4EFE6' },
                        { key: 'TextSecondary', label: 'Text Secondary', defaultHex: '#9CA3AF' },
                        { key: 'AccentPrimary', label: 'Accent Primary', defaultHex: '#D4AF37' },
                        { key: 'AccentSecondary', label: 'Accent Secondary', defaultHex: '#C42B1C' },
                      ]
                  ).map((item: any) => {
                    const currentHex = colorsMap[item.key] || item.defaultHex || '#111111';
                    return (
                      <div key={item.key} className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                        <div className="text-[10px] font-semibold text-slate-400">{item.label}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <input
                            type="color"
                            value={currentHex}
                            onChange={(e) => updateColorValue(item.key, e.target.value)}
                            className="h-6 w-6 cursor-pointer rounded border border-slate-700 bg-transparent"
                          />
                          <input
                            type="text"
                            value={currentHex}
                            onChange={(e) => updateColorValue(item.key, e.target.value)}
                            className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Scene Text Accordions from designSchema.scenes */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Scene Text Inspector ({scenes.length} Scenes)
                </div>
                {(designSchema.scenes || []).map((schemaScene: any, idx: number) => {
                  const sId = schemaScene.sceneId || `scene_${idx + 1}`;
                  const sceneVals = designValues.scenes?.[sId] || {};
                  const matchingScene = scenes[idx] || {};
                  return (
                    <div
                      key={sId}
                      onClick={() => setSelectedSceneIdx(idx)}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        selectedSceneIdx === idx
                          ? 'border-amber-500 bg-slate-950'
                          : 'border-slate-800 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>
                          Scene {schemaScene.sceneNumber || idx + 1} Text ({schemaScene.archetype})
                        </span>
                        <span className="text-[10px] text-slate-400">{matchingScene.durationSec || 5}s</span>
                      </div>
                      <div className="mt-2.5 space-y-2">
                        {(schemaScene.fields || []).map((field: any) => (
                          <div key={field.key}>
                            <label className="block text-[10px] font-semibold text-slate-400">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={sceneVals[field.key] || ''}
                              onChange={(e) => updateSceneFieldValue(sId, field.key, e.target.value)}
                              className="mt-0.5 w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Right Stage: Live Remotion Composition Preview */}
        <main className="flex flex-1 flex-col items-center justify-center bg-[#090A0F] p-6">
          <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
            {/* Live Bauhaus Remotion Scene Renderer */}
            {activeScene && (
              <div
                className="relative flex h-full w-full flex-col justify-between p-8 transition-all duration-300"
                style={{
                  backgroundColor: colorsMap.BackgroundPrimary || '#111111',
                  color: colorsMap.TextPrimary || '#F4EFE6',
                }}
              >
                {/* Top Bauhaus Header Bar */}
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider"
                    style={{
                      backgroundColor: colorsMap.AccentPrimary || '#D4AF37',
                      color: '#111111',
                    }}
                  >
                    {activeSceneValues.BadgeText ||
                      activeSceneValues.SectionTitle ||
                      activeScene.title ||
                      `Scene ${displaySceneIdx + 1}`}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    whoami.genisisiq.com • {currentTime.toFixed(1)}s / {totalDuration}.0s
                  </span>
                </div>

                {/* Center Archetype Layout */}
                <div className="my-auto grid grid-cols-12 items-center gap-6">
                  <div className="col-span-6 space-y-3">
                    <div
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: colorsMap.AccentSecondary || '#C42B1C' }}
                    >
                      {activeScene.archetype}
                    </div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight">
                      {activeSceneValues.TitleText ||
                        activeSceneValues.SpotlightTitle ||
                        activeSceneValues.QuoteText ||
                        activeSceneValues.CtaHeadline ||
                        activeScene.title}
                    </h2>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: colorsMap.TextSecondary || '#9CA3AF' }}
                    >
                      {activeSceneValues.SubtitleText ||
                        activeSceneValues.SpotlightBody ||
                        activeSceneValues.AuthorText ||
                        activeSceneValues.CtaButtonText ||
                        activeVoiceoverClip?.script}
                    </p>

                    {/* Metric Bento Pills if Scene 2 */}
                    {activeSceneValues.Metric1Value && (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {[
                          { val: activeSceneValues.Metric1Value, lbl: activeSceneValues.Metric1Label },
                          { val: activeSceneValues.Metric2Value, lbl: activeSceneValues.Metric2Label },
                          { val: activeSceneValues.Metric3Value, lbl: activeSceneValues.Metric3Label },
                        ].map((m, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-amber-400/30 bg-slate-900/90 p-2 text-center"
                          >
                            <div className="text-lg font-black text-[#D4AF37]">{m.val}</div>
                            <div className="text-[10px] text-slate-300">{m.lbl}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-6">
                    <div className="overflow-hidden rounded-xl border-2 border-[#D4AF37]/60 bg-slate-950 shadow-2xl">
                      <img
                        src={activeScene.screenshotUrl || '/media/scene1.png'}
                        alt={activeScene.title}
                        className="aspect-video w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Caption Bar */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="italic text-slate-300">
                    🎙️ “{activeVoiceoverClip?.script || 'YI-TING HUANG — Doers, Not Talkers.'}”
                  </span>
                  <span className="font-mono text-amber-400">
                    Scene {displaySceneIdx + 1} of {scenes.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2">
            <button
              onClick={() => setPlaying(!playing)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-slate-950 hover:bg-amber-400"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <button
              onClick={() => {
                setPlaying(false);
                setCurrentTime(0);
              }}
              className="text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <div className="font-mono text-xs text-slate-300">
              {currentTime.toFixed(1)}s / {totalDuration}.0s (Frame {Math.floor(currentTime * 30)} /{' '}
              {totalDuration * 30})
            </div>
          </div>
        </main>
      </div>

      {/* Bottom 5-Track NLE Timeline Editor */}
      <section className="h-60 shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            5-Track Non-Linear Video Timeline (Pan & Zoom • Voiceover • Scenes • Music • SFX)
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Click any track block to seek playhead</span>
          </div>
        </div>

        <div className="space-y-1.5 overflow-y-auto pr-1">
          {/* TRACK 1: Pan & Zoom */}
          <div className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <ZoomIn className="h-3.5 w-3.5" />
              1. Pan & Zoom
            </div>
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {scenes.map((s, idx) => {
                const pz = (timeline.panZoomTrack || []).find((p: any) => p.sceneId === s.sceneId);
                return (
                  <button
                    key={s.sceneId || idx}
                    onClick={() => {
                      setSelectedSceneIdx(idx);
                      setCurrentTime(idx * 5);
                    }}
                    className="truncate rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-left text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    {pz ? `Zoom ${pz.scale}x (${pz.startSec}s–${pz.endSec}s)` : `Hold 1.0x`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TRACK 2: ElevenLabs Voiceover */}
          <div className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
              <Volume2 className="h-3.5 w-3.5" />
              2. Voiceover
            </div>
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {(timeline.voiceoverTrack?.length ? timeline.voiceoverTrack : scenes).map(
                (vo: any, idx: number) => (
                  <button
                    key={vo.id || idx}
                    onClick={() => {
                      setSelectedSceneIdx(idx);
                      setCurrentTime(idx * 5);
                    }}
                    className="truncate rounded border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-left text-[10px] font-medium text-indigo-200 hover:bg-indigo-500/25"
                  >
                    🎙️ {vo.script || vo.title}
                  </button>
                )
              )}
            </div>
          </div>

          {/* TRACK 3: Scenes */}
          <div className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-amber-400">
              <Layers className="h-3.5 w-3.5" />
              3. Scenes (6)
            </div>
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {scenes.map((s, idx) => (
                <button
                  key={s.sceneId || idx}
                  onClick={() => {
                    setSelectedSceneIdx(idx);
                    setCurrentTime(idx * 5);
                  }}
                  className={`truncate rounded px-2 py-1.5 text-left text-[10px] font-bold transition ${
                    displaySceneIdx === idx
                      ? 'bg-[#D4AF37] text-slate-950'
                      : 'border border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                  }`}
                >
                  S{idx + 1}: {s.title} ({s.durationSec || 5}s)
                </button>
              ))}
            </div>
          </div>

          {/* TRACK 4: Background Music */}
          <div className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-purple-400">
              <Music className="h-3.5 w-3.5" />
              4. Music
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between rounded border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-[10px] font-semibold text-purple-200">
                <span>
                  🎵 {timeline.musicTrack?.[0]?.trackName || BACKGROUND_MUSIC_TRACKS[0]?.name} — Ducked{' '}
                  {timeline.musicTrack?.[0]?.volume || 35}% under narration
                </span>
                <span>0.0s – {totalDuration}.0s</span>
              </div>
            </div>
          </div>

          {/* TRACK 5: Sound Effects (SFX) */}
          <div className="flex items-center gap-3">
            <div className="flex w-32 shrink-0 items-center gap-1.5 text-[11px] font-semibold text-rose-400">
              <Zap className="h-3.5 w-3.5" />
              5. SFX ({(timeline.sfxTrack || []).length})
            </div>
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {(timeline.sfxTrack?.length ? timeline.sfxTrack : SFX_LIBRARY).map(
                (sfx: any, idx: number) => (
                  <div
                    key={sfx.id || idx}
                    className="truncate rounded border border-rose-500/40 bg-rose-500/15 px-2 py-1 text-[10px] font-semibold text-rose-200"
                  >
                    ⚡ {sfx.effectType || sfx.name} @ {sfx.startSec ?? idx * 5}s
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pronunciation Dictionary Modal */}
      {showPronunciationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">AI Voiceover Pronunciation Dictionary</h3>
              <button
                onClick={() => setShowPronunciationModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Define phonetic replacements so ElevenLabs pronounces technical acronyms and domain names accurately.
            </p>
            <div className="mt-4 space-y-2">
              {pronunciations.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.word || ''}
                    onChange={(e) => {
                      const next = [...pronunciations];
                      next[idx] = { ...p, word: e.target.value };
                      setPronunciations(next);
                    }}
                    className="w-1/3 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  />
                  <span className="text-xs text-slate-500">→</span>
                  <input
                    type="text"
                    value={p.replacement || p.phonetic || ''}
                    onChange={(e) => {
                      const next = [...pronunciations];
                      next[idx] = { ...p, replacement: e.target.value };
                      setPronunciations(next);
                    }}
                    className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-amber-300"
                  />
                  <button
                    onClick={() => setPronunciations(pronunciations.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() =>
                  setPronunciations([
                    ...pronunciations,
                    { id: `pr_${Date.now()}`, word: 'Credly', replacement: 'Cred-lee' },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rule
              </button>
              <button
                onClick={() => {
                  handleSaveStudio(scenes, designValues, timeline, pronunciations);
                  setShowPronunciationModal(false);
                }}
                className="rounded-lg bg-[#D4AF37] px-4 py-1.5 text-xs font-bold text-slate-950"
              >
                Save & Re-Synthesize Voiceover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MP4 Export Drawer */}
      {showExportDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Export MP4 Launch Video</h3>
              <button
                onClick={() => {
                  setShowExportDrawer(false);
                  setExportProgress(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4K'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setExportResolution(res)}
                  className={`rounded-lg border py-2 text-xs font-bold ${
                    exportResolution === res
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {([30, 60] as const).map((fps) => (
                <button
                  key={fps}
                  onClick={() => setExportFps(fps)}
                  className={`rounded-lg border py-2 text-xs font-bold ${
                    exportFps === fps
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 bg-slate-950 text-slate-400'
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>

            {exportProgress === null ? (
              <button
                onClick={triggerExportRender}
                className="mt-5 w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Render {exportResolution} @ {exportFps}fps MP4
              </button>
            ) : exportProgress < 100 ? (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Rendering Remotion frames...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-lg bg-emerald-500/20 p-3 text-xs font-semibold text-emerald-300">
                  ✓ {exportResolution} ({exportFps}fps) MP4 Ready (7.82 MB)
                </div>
                <a
                  href="/media/whoami-launch.mp4"
                  download={`whoami-launch-${exportResolution}.mp4`}
                  className="block w-full rounded-xl bg-emerald-500 py-2.5 text-center text-xs font-bold text-slate-950"
                >
                  Download MP4 File
                </a>
              </div>
            )}

            {exportsList.length > 0 && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Previous Renders ({exportsList.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {exportsList.slice(0, 3).map((ex: any) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded bg-slate-950 px-3 py-1.5 text-xs"
                    >
                      <span>
                        {ex.resolution} @ {ex.fps}fps ({ex.fileSize})
                      </span>
                      <a
                        href={ex.fileUrl || '/media/whoami-launch.mp4'}
                        download
                        className="font-bold text-amber-400 hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
