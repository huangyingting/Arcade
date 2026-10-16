'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const toPct = (v: number | undefined, fallback = 50) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return v <= 1 && v >= 0 ? Math.round(v * 1000) / 10 : v;
};

export default function PublicFlowSharePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const [flow, setFlow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCompany, setLeadCompany] = useState(searchParams.get('company_name') || '');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [selectedLang, setSelectedLang] = useState(searchParams.get('lang') || 'en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [translatingLang, setTranslatingLang] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const companyToken = searchParams.get('company_name') || 'Enterprise Cloud';
  const firstNameToken = searchParams.get('first_name') || 'Builder';

  function interpolateTokens(text: string) {
    if (!text) return '';
    return text
      .replace(/\{\{company_name\}\}/g, companyToken)
      .replace(/\{\{first_name\}\}/g, firstNameToken);
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/flows/${id}`);
      const data = await res.json();
      if (data.flow) {
        setFlow(data.flow);
        setSteps(JSON.parse(data.flow.stepsJson || '[]'));
        try {
          setTranslations(JSON.parse(data.flow.translationsJson || '{}'));
        } catch {
          setTranslations({});
        }
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType: 'FLOW',
            assetId: data.flow.id,
            assetTitle: data.flow.name,
            companyName: companyToken,
            eventType: 'VIEW',
            stepIndex: 0,
            durationMs: 4200,
          }),
        }).catch(() => {});
      }
    }
    load();
  }, [id, companyToken]);

  async function handleSelectLanguage(langCode: string) {
    setSelectedLang(langCode);
    if (langCode === 'en' || translations[langCode]?.steps?.length || translations[langCode]?.translatedSteps?.length) {
      return;
    }
    setTranslatingLang(true);
    try {
      const res = await fetch(`/api/flows/${flow?.id || id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: langCode }),
      });
      const data = await res.json();
      if (data.translations) {
        setTranslations(data.translations);
      }
    } finally {
      setTranslatingLang(false);
    }
  }

  const activeTranslation = selectedLang !== 'en' ? translations[selectedLang] : null;
  const translatedStepList = activeTranslation?.steps || activeTranslation?.translatedSteps || [];
  const activeTranslatedStep = translatedStepList[currentIdx] || null;

  const activeStep = steps[currentIdx] || null;
  const stepMediaUrl = activeStep?.mediaUrl || activeStep?.imageUrl || '/media/scene1.png';
  const stepPanZoom = activeStep?.panAndZoom || activeStep?.panZoom || { enabled: false, scale: 1.3 };
  const stepVoiceoverScript =
    activeTranslatedStep?.voiceoverText ||
    activeStep?.voiceover?.script ||
    activeStep?.voiceoverText ||
    '';
  const stepChapter = activeStep?.chapter || activeStep?.chapterConfig || {};

  function goNext() {
    if (currentIdx < steps.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (flow) {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType: 'FLOW',
            assetId: flow.id,
            assetTitle: flow.name,
            companyName: companyToken,
            eventType: 'HOTSPOT_CLICK',
            stepIndex: nextIdx,
            durationMs: 3800,
          }),
        }).catch(() => {});
      }
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail) return;
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flowId: flow?.id,
        email: leadEmail,
        company: leadCompany || companyToken,
        name: firstNameToken,
        sourceUrl: window.location.href,
      }),
    }).catch(() => {});
    setLeadSubmitted(true);
    setTimeout(() => goNext(), 900);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0C10] text-white">
      {/* Top Share Bar */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4AF37] font-black text-slate-950">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">
              {activeTranslation?.name || flow?.name || 'whoami.genisisiq.com — Interactive Architecture Tour'}
            </h1>
            <p className="text-[11px] text-slate-400">
              Prepared for <span className="font-semibold text-amber-300">{companyToken}</span> • Step{' '}
              {currentIdx + 1} of {Math.max(1, steps.length)}
              {translatingLang ? ' • Translating via Azure OpenAI...' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Multilingual Switcher (EN / 中文 / 日本語 / 한국어 / ES / FR / DE) */}
          <select
            value={selectedLang}
            onChange={(e) => handleSelectLanguage(e.target.value)}
            aria-label="Select Demo Language"
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-amber-300 focus:outline-none"
          >
            <option value="en">🇺🇸 English (EN)</option>
            <option value="zh-CN">🇨🇳 简体中文 (ZH)</option>
            <option value="ja">🇯🇵 日本語 (JA)</option>
            <option value="ko">🇰🇷 한국어 (KO)</option>
            <option value="es">🇪🇸 Español (ES)</option>
            <option value="fr">🇫🇷 Français (FR)</option>
            <option value="de">🇩🇪 Deutsch (DE)</option>
          </select>
          <Link
            href={`/share/${id}/guide`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            Step-by-Step Guide
          </Link>
          <a
            href="https://whoami.genisisiq.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            Visit whoami.genisisiq.com <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* Center Interactive Demo Player */}
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Browser Frame Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div className="rounded-md bg-slate-900 px-4 py-1 font-mono text-xs text-slate-400">
              https://whoami.genisisiq.com
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Toggle AI Voiceover"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
              </button>
              <button
                onClick={() => setCurrentIdx(0)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                title="Restart Tour"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interactive Stage */}
          {activeStep && (
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <img
                src={stepMediaUrl}
                alt={activeStep.title}
                className="h-full w-full object-cover transition-transform duration-500"
                style={{
                  transform: stepPanZoom.enabled ? `scale(${stepPanZoom.scale || 1.3})` : 'scale(1)',
                }}
              />

              {/* Redaction / Highlight Areas */}
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
                      ? 'bg-slate-900/40 backdrop-blur-md'
                      : 'border-2 border-amber-400/70 bg-amber-400/5'
                  }`}
                />
              ))}

              {/* Page Morph Overlays */}
              {(activeStep.pageMorphs || []).map((m: any) => (
                <div
                  key={m.id}
                  style={{ left: `${toPct(m.x, 40)}%`, top: `${toPct(m.y, 40)}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-amber-400/60 bg-slate-900/95 px-3 py-1.5 text-xs font-bold text-amber-300 shadow-lg"
                >
                  {interpolateTokens(m.replacementText)}
                </div>
              ))}

              {/* Callout Cards */}
              {(activeStep.callouts || []).map((co: any) => (
                <div
                  key={co.id}
                  onClick={goNext}
                  style={{ left: `${toPct(co.x, 25)}%`, top: `${toPct(co.y, 70)}%` }}
                  className="absolute z-10 w-64 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-xl border border-amber-400/60 bg-slate-950/95 p-3.5 text-left shadow-2xl"
                >
                  <div className="text-xs font-bold text-amber-400">{co.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-200">
                    {interpolateTokens(co.body)}
                  </div>
                  {co.primaryButtonLabel && (
                    <div className="mt-2 inline-block rounded bg-[#D4AF37] px-2.5 py-1 text-[10px] font-bold text-slate-950">
                      {co.primaryButtonLabel}
                    </div>
                  )}
                </div>
              ))}

              {/* Chapter / Lead Capture Overlay */}
              {activeStep.type === 'CHAPTER' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 p-8 text-center backdrop-blur-md">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    whoami.genisisiq.com • Executive Portfolio
                  </span>
                  <h2 className="mt-4 max-w-xl text-3xl font-extrabold text-white">
                    {interpolateTokens(stepChapter.title || activeStep.title)}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-slate-300">
                    {interpolateTokens(
                      stepChapter.subtitle ||
                        '120+ Verified AI & Cloud Certifications (SC-100, AZ-305) and 2,300+ Indexed AI Use Cases.'
                    )}
                  </p>

                  {stepChapter.interactionMode === 'form' && !leadSubmitted ? (
                    <form onSubmit={handleLeadSubmit} className="mt-6 w-full max-w-sm space-y-2.5">
                      <input
                        type="email"
                        required
                        placeholder="Work email (e.g., architect@company.com)"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={leadCompany}
                        onChange={(e) => setLeadCompany(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs text-white"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                      >
                        {stepChapter.formSubmitLabel || 'Unlock Interactive Tour →'}
                      </button>
                    </form>
                  ) : leadSubmitted ? (
                    <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Unlocked! Advancing to next step...
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      {(stepChapter.buttons || [
                        { id: 'b1', label: 'Start Interactive Tour →', variant: 'primary', action: 'next_step' },
                      ]).map((btn: any, bIdx: number) => (
                        <button
                          key={btn.id || bIdx}
                          onClick={() => {
                            if (btn.action === 'external_url' && btn.targetUrl) {
                              window.open(btn.targetUrl, '_blank');
                            } else if (btn.action === 'replay') {
                              setCurrentIdx(0);
                            } else {
                              goNext();
                            }
                          }}
                          className={`rounded-xl px-6 py-3 text-sm font-bold shadow-lg ${
                            btn.variant === 'secondary'
                              ? 'border border-slate-700 bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-[#D4AF37] text-slate-950 hover:bg-amber-400'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Clickable Hotspots */}
              {(activeStep.hotspots || []).map((hs: any) => (
                <button
                  key={hs.id}
                  onClick={goNext}
                  style={{ left: `${toPct(hs.x, 50)}%`, top: `${toPct(hs.y, 50)}%` }}
                  className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 text-left focus:outline-none"
                >
                  <div className="relative flex items-center justify-center">
                    <span
                      className="absolute h-12 w-12 animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: hs.color || '#D4AF37' }}
                    />
                    <span
                      className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-xl transition group-hover:scale-110"
                      style={{ backgroundColor: hs.color || '#D4AF37' }}
                    />
                  </div>
                  <div className="mt-2.5 w-64 -translate-x-1/3 rounded-xl border border-amber-400/50 bg-slate-950/95 p-3.5 text-xs font-medium text-white shadow-2xl">
                    <div className="font-bold text-amber-400">
                      {activeTranslatedStep?.title || `Step ${currentIdx + 1}`}
                    </div>
                    <div className="mt-1">
                      {interpolateTokens(
                        activeTranslatedStep?.callout ||
                          activeTranslatedStep?.tooltip ||
                          hs.tooltipText ||
                          hs.calloutText ||
                          ''
                      )}
                    </div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Click beacon to advance →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Bottom Progress & Step Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentIdx >= steps.length - 1}
                className="inline-flex items-center gap-1 rounded-lg bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id || idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIdx ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            <div className="text-xs text-slate-400">
              {stepVoiceoverScript && (
                <span className="italic text-slate-300">
                  “{interpolateTokens(stepVoiceoverScript).slice(0, 65)}...”
                </span>
              )}
            </div>
          </div>
        </div>
        <audio ref={audioRef} src="/media/voiceover-sample.wav" muted={muted} className="hidden" />
      </main>
    </div>
  );
}
