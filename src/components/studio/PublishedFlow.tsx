'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw, FileText, Play, Globe, Check } from 'lucide-react';
import { FlowCanvas } from './FlowCanvas';
import { requestJson, errorMessage } from '@/lib/client';
import { TRANSLATION_LOCALES, type FlowStep, type FlowDesignConfig } from '@/types/domain';

type PublishedDemo = { shareId: string; name: string; description: string | null; stepsJson: string; designJson: string; translationsJson: string; privacy: { enabled: boolean; requireConsent: boolean } };
type Translation = { name?: string; steps?: { title?: string; voiceoverText?: string; tooltips?: string[]; callouts?: { title: string; body: string }[]; chapter?: { title: string; subtitle: string } }[] };
export function PublishedFlow({ id, guide = false }: { id: string; guide?: boolean }) {
  const [demo, setDemo] = useState<PublishedDemo | null>(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [locale, setLocale] = useState('');
  const [completed, setCompleted] = useState(false);
  const [leadState, setLeadState] = useState('');
  const [leadError, setLeadError] = useState('');
  const [leadBusy, setLeadBusy] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const consent = useRef(false);
  const analyticsAllowed = useRef(false);
  const loaded = useRef('');
  const started = useRef(Date.now());
  useEffect(() => {
    requestJson<{ flow: PublishedDemo }>(`/api/public/flows/${id}`).then(({ flow }) => {
      setDemo(flow);
      const saved = localStorage.getItem(`arcade-analytics:${id}`);
      consent.current = saved === 'allow';
      analyticsAllowed.current = flow.privacy.enabled && (!flow.privacy.requireConsent || consent.current);
      setShowConsent(!guide && flow.privacy.enabled && flow.privacy.requireConsent && saved === null && navigator.doNotTrack !== '1');
      if (loaded.current !== id && !guide) { loaded.current = id; void record('VIEW', 0, 0); }
    }).catch((e) => setError(errorMessage(e)));
  }, [id, guide]);
  async function record(eventType: string, stepIndex: number, durationMs: number) {
    if (navigator.doNotTrack === '1' || !analyticsAllowed.current) return;
    try { await requestJson('/api/analytics', { method: 'POST', body: JSON.stringify({ assetId: id, eventType, stepIndex, durationMs: Math.min(3_600_000, durationMs), consent: consent.current }) }); }
    catch (e) { console.warn('Viewer analytics could not be recorded:', errorMessage(e)); }
  }
  if (error) return <main id="main-content" className="grid min-h-screen place-items-center p-8"><div className="max-w-md text-center"><p className="eyebrow">Shared demo</p><h1 className="mt-4 text-3xl tracking-tight">This story isn’t available.</h1><p className="mt-4 text-sm text-slate-500">{error}</p></div></main>;
  if (!demo) return <main id="main-content" className="grid min-h-screen place-items-center"><p className="eyebrow">Loading shared demo…</p></main>;
  const source: FlowStep[] = JSON.parse(demo.stepsJson);
  const design: FlowDesignConfig = JSON.parse(demo.designJson);
  const translations: Record<string, Translation> = JSON.parse(demo.translationsJson);
  const translation = translations[locale];
  const steps = source.map((step, i) => {
    const t = translation?.steps?.[i];
    return !t ? step : { ...step, title: t.title || step.title, hotspots: step.hotspots.map((h, j) => ({ ...h, tooltipText: t.tooltips?.[j] ?? h.tooltipText })), callouts: step.callouts.map((c, j) => ({ ...c, ...t.callouts?.[j] })), voiceover: { ...step.voiceover, enabled: false }, chapter: step.chapter ? { ...step.chapter, title: t.chapter?.title || step.chapter.title, subtitle: t.chapter?.subtitle || step.chapter.subtitle } : undefined };
  });
  const step = steps[index];
  const title = translation?.name || demo.name;
  function navigate(target: number) {
    const elapsed = Date.now() - started.current;
    void record('STEP_VIEW', index, elapsed);
    started.current = Date.now(); setLeadState(''); setLeadError('');
    if (target >= steps.length) { void record('COMPLETED', Math.max(0, steps.length - 1), elapsed); setCompleted(true); }
    else { setCompleted(false); setIndex(Math.max(0, target)); }
  }
  const form = step?.chapter?.interactionMode === 'form' ? step.chapter : null;
  return <main id="main-content" className="flex min-h-screen flex-col bg-[#efeee6]">
    {showConsent && <aside aria-label="Viewer analytics preferences" className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 bg-[#eaecdf] px-6 py-4"><p className="max-w-xl text-xs leading-relaxed text-slate-600">Allow anonymous walkthrough analytics? A short-lived visitor cookie helps this demo’s owner understand which steps are useful. Contact details are collected only when you explicitly submit a form.</p><div className="flex gap-3"><button className="btn-secondary !min-h-9 !text-xs" onClick={() => { localStorage.setItem(`arcade-analytics:${id}`, 'decline'); setShowConsent(false); }}>Continue without</button><button className="btn-primary !min-h-9 !text-xs" onClick={() => { localStorage.setItem(`arcade-analytics:${id}`, 'allow'); consent.current = true; analyticsAllowed.current = true; setShowConsent(false); void record('VIEW', index, 0); }}>Allow analytics</button></div></aside>}
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 px-5 py-5 md:px-10"><div><p className="eyebrow">{guide ? 'Step-by-step guide' : 'Interactive walkthrough'}</p><h1 className="mt-1 text-lg font-medium tracking-tight">{title}</h1></div><div className="flex items-center gap-4">{Object.keys(translations).length > 0 && <label className="flex items-center gap-2 text-xs"><Globe size={13} /><select aria-label="Demo language" className="bg-transparent" value={locale} onChange={(e) => { setLocale(e.target.value); setIndex(0); }}><option value="">Original language</option>{Object.keys(translations).map((code) => <option key={code} value={code}>{TRANSLATION_LOCALES.find((l) => l.code === code)?.name || code}</option>)}</select></label>}<Link href={guide ? `/share/${id}` : `/share/${id}/guide`} className="btn-secondary !min-h-9 !text-xs">{guide ? <Play size={13} /> : <FileText size={13} />}{guide ? 'Interactive demo' : 'Read as guide'}</Link></div></header>
    {guide ? <article className="mx-auto w-full max-w-4xl space-y-12 px-5 py-12">{demo.description && <p className="page-intro">{demo.description}</p>}{steps.map((s, i) => <section key={s.id}><p className="eyebrow">Step {String(i + 1).padStart(2, '0')}</p><h2 className="mb-5 mt-2 text-xl font-medium">{s.title}</h2><FlowCanvas step={s} design={design} editing />{s.voiceover?.script && <p className="mt-4 text-sm leading-relaxed text-slate-600">{translation?.steps?.[i]?.voiceoverText || s.voiceover.script}</p>}</section>)}</article>
      : <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 md:px-8">
        {completed ? <div className="empty-state !min-h-80"><span className="grid h-12 w-12 place-items-center rounded-full bg-slate-200"><Check size={22} /></span><h2 className="text-2xl font-medium tracking-tight">You’ve reached the end.</h2><button className="btn-primary mt-2" onClick={() => navigate(0)}><RotateCcw size={14} />Replay walkthrough</button></div> : <><FlowCanvas step={step} design={design} onNext={() => navigate(index + 1)} onChapterButton={(b) => navigate(b.action === 'replay' ? 0 : b.action === 'jump_to_step' ? Math.max(0, steps.findIndex((s) => s.id === b.targetStepId)) : index + 1)} onHotspot={(hotspotId) => { const hotspot = step.hotspots.find((h) => h.id === hotspotId); if (hotspot?.targetType === 'external_url' && hotspot.targetUrl) window.open(hotspot.targetUrl, '_blank', 'noopener,noreferrer'); else navigate(hotspot?.targetType === 'specific_step' ? Math.max(0, steps.findIndex((s) => s.id === hotspot.targetStepId)) : index + 1); }} />
        {step?.voiceover?.enabled && step.voiceover.audioUrl && <audio key={step.voiceover.audioUrl} controls className="mt-4 h-10 w-full" src={step.voiceover.audioUrl} aria-label="Step narration" />}
        {form && <form className="panel mx-auto mt-6 w-full max-w-xl space-y-4" onSubmit={async (e) => { e.preventDefault(); setLeadBusy(true); setLeadError(''); const data = Object.fromEntries(new FormData(e.currentTarget)); try { await requestJson('/api/leads', { method: 'POST', body: JSON.stringify({ ...data, flowId: id, stepIndex: index, consent: data.consent === 'on' }) }); setLeadState('Your details have been sent.'); navigate(index + 1); } catch (error) { setLeadError(errorMessage(error)); } finally { setLeadBusy(false); } }}><h2 className="panel-heading">Keep the conversation going.</h2>{form.formFields.map((field) => <label key={field.id} className="block"><span className="field-label">{field.label}</span><input className="field" name={field.key} type={field.key === 'email' ? 'email' : 'text'} required={field.required} placeholder={field.placeholder} maxLength={254} /></label>)}{!form.formFields.some((f) => f.key === 'email') && <label className="block"><span className="field-label">Email</span><input className="field" name="email" type="email" required /></label>}<label className="flex items-start gap-3 text-xs leading-relaxed text-slate-500"><input className="mt-1" type="checkbox" name="consent" required />I agree to share these contact details with this demo’s owner so they can follow up.</label>{leadError && <p className="status-error" role="alert">{leadError}</p>}<div className="flex items-center gap-4"><button className="btn-primary" disabled={leadBusy}>{leadBusy ? 'Sending…' : form.formSubmitLabel || 'Continue'}</button>{form.allowSkipForm && <button type="button" className="btn-quiet" onClick={() => navigate(index + 1)}>Skip</button>}</div></form>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><button disabled={index === 0} className="btn-secondary !min-h-10 !text-xs" onClick={() => navigate(index - 1)}><ArrowLeft size={14} />Previous</button><p className="text-center text-xs text-slate-500">{index + 1} / {steps.length}<span className="ml-3 hidden sm:inline">{step?.title}</span></p>{(!form || form.allowSkipForm) && <button className="btn-primary !min-h-10 !text-xs" onClick={() => navigate(index + 1)}>{index === steps.length - 1 ? 'Finish' : 'Next'}<ArrowRight size={14} /></button>}</div>
        {design.showProgressBar && <div className="mt-5 h-0.5 overflow-hidden rounded-full bg-slate-300"><div className="h-full transition-all" style={{ width: `${((index + 1) / Math.max(1, steps.length)) * 100}%`, background: design.primaryColor }} /></div>}</>}
        {leadState && <p className="status-success mt-4" role="status">{leadState}</p>}
      </div>}
    {design.showWatermark && <footer className="px-5 py-5 text-center font-mono text-[9px] uppercase tracking-widest text-slate-400">{design.watermarkText || 'Made with Arcade'}</footer>}
  </main>;
}
