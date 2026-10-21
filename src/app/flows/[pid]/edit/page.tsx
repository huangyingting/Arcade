'use client';

import { use, useEffect, useRef, useState } from 'react';
import { Plus, Image as ImageIcon, Upload, Layers, MousePointer2, MessageSquare, ArrowUp, ArrowDown, Trash2, Loader2, Download, Globe, Sparkles, Copy, Eye } from 'lucide-react';
import { requestJson, errorMessage } from '@/lib/client';
import { blankStep, defaultDesign } from '@/lib/content';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { FlowCanvas } from '@/components/studio/FlowCanvas';
import type { FlowStep, FlowDesignConfig } from '@/types/domain';
import { TRANSLATION_LOCALES } from '@/types/domain';

type Flow = { id: string; name: string; status: string; shareId: string; role: string; stepsJson: string; designJson: string; workspace: { slug: string }; translationsJson: string };
export default function FlowEditor({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = use(params);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [design, setDesign] = useState<Partial<FlowDesignConfig>>(defaultDesign);
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<'step' | 'theme' | 'share'>('step');
  const [tool, setTool] = useState<'select' | 'hotspot' | 'callout'>('select');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exportUrl, setExportUrl] = useState('');
  const [locale, setLocale] = useState('zh-CN');
  const [instruction, setInstruction] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const active = steps[index] || null;
  const canEdit = Boolean(flow && flow.role !== 'VIEWER');
  useEffect(() => {
    requestJson<{ flow: Flow }>(`/api/flows/${pid}`).then(({ flow }) => {
      setFlow(flow); setSteps(JSON.parse(flow.stepsJson)); setDesign({ ...defaultDesign, ...JSON.parse(flow.designJson) });
    }).catch((e) => setError(errorMessage(e)));
  }, [pid]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  async function perform(action: () => Promise<void>) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function save(status?: string) {
    const { flow: updated } = await requestJson<{ flow: Flow }>(`/api/flows/${pid}`, { method: 'PATCH', body: JSON.stringify({ name: flow?.name, steps, design, ...(status ? { status } : {}) }) });
    setFlow((old) => old ? { ...old, ...updated } : updated); setDirty(false);
    setNotice(status === 'PUBLISHED' ? 'Published. Anyone with the link can view this demo.' : status === 'DRAFT' ? 'Unpublished. This demo is now private.' : 'All changes saved.');
  }
  function update(patch: Partial<FlowStep>) { setSteps((prev) => prev.map((s, i) => i === index ? { ...s, ...patch } : s)); setDirty(true); }
  function add(chapter = false) { setSteps((prev) => [...prev, blankStep(prev.length, chapter)]); setIndex(steps.length); setDirty(true); }
  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps]; [next[index], next[target]] = [next[target], next[index]];
    setSteps(next.map((s, i) => ({ ...s, order: i }))); setIndex(target); setDirty(true);
  }
  function annotate(event: React.MouseEvent<HTMLDivElement>) {
    if (!canEdit || !active || tool === 'select') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(.03, Math.min(.9, (event.clientX - rect.left) / rect.width));
    const y = Math.max(.03, Math.min(.85, (event.clientY - rect.top) / rect.height));
    if (tool === 'hotspot') update({ hotspots: [...active.hotspots, { id: crypto.randomUUID(), x, y, style: 'beacon', color: design.primaryColor || '#b95030', tooltipText: 'Continue', tooltipPosition: 'bottom', trigger: 'click', targetType: 'next_step' }] });
    else update({ callouts: [...active.callouts, { id: crypto.randomUUID(), x, y, title: 'Add context', body: '', theme: 'light', pointerDirection: 'none', showNavButtons: false, primaryButtonLabel: 'Next' }] });
    setTool('select');
  }
  async function upload(file: File) {
    if (!flow) return;
    const form = new FormData(); form.append('file', file); form.append('workspaceSlug', flow.workspace.slug);
    const { url } = await requestJson<{ url: string }>('/api/uploads', { method: 'POST', body: form });
    if (!active) {
      const step: FlowStep = { ...blankStep(steps.length), title: file.name.replace(/\.[^.]+$/, ''), mediaUrl: url, type: file.type === 'video/mp4' ? 'VIDEO' : 'IMAGE' };
      setSteps((prev) => [...prev, step]); setIndex(steps.length); setDirty(true);
    } else update({ mediaUrl: url, type: file.type === 'video/mp4' ? 'VIDEO' : 'IMAGE' });
  }
  const shareUrl = typeof window === 'undefined' || !flow ? '' : `${window.location.origin}/share/${flow.shareId}`;
  return <div className="studio">
    <StudioHeader kind="Interactive demo / Studio" name={flow?.name || ''} workspaceSlug={flow?.workspace.slug} status={flow?.status} busy={busy} canEdit={canEdit} onName={(name) => { if (flow) setFlow({ ...flow, name }); setDirty(true); }} onSave={() => perform(() => save())} onPublish={() => perform(() => save(flow?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'))} shareUrl={shareUrl}>
      <span className="mr-2 hidden text-[10px] text-slate-400 sm:inline">{dirty ? 'Unsaved changes' : notice ? 'Saved' : ''}</span>
      <button disabled={busy || !steps.length || !canEdit} onClick={() => perform(async () => {
        await save(); const data = await requestJson<{ downloadUrl: string }>(`/api/flows/${pid}/export-video`, { method: 'POST', body: JSON.stringify({ format: 'mp4' }) }); setExportUrl(data.downloadUrl);
      })} className="btn-secondary !min-h-10 !px-3 !text-xs"><Download size={13} />Export</button>
    </StudioHeader>
    {(error || notice || exportUrl) && <div className="space-y-2 border-b border-slate-800 px-5 py-3" aria-live="polite">{error && <p className="status-error" role="alert">{error}</p>}{notice && <p className="text-xs text-emerald-300">{notice}</p>}{exportUrl && <a href={exportUrl} download className="inline-flex gap-2 text-xs text-orange-200"><Download size={13} />Download rendered MP4</a>}</div>}
    <main id="main-content" className="studio-layout">
      <aside className="studio-panel border-b lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between"><h2 className="studio-label">Story / {steps.length} steps</h2>{canEdit && <button aria-label="Add step" onClick={() => add()} className="rounded p-1 text-slate-300 hover:bg-slate-700"><Plus size={16} /></button>}</div>
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {steps.map((step, i) => <button key={step.id} onClick={() => setIndex(i)} aria-pressed={index === i} className={`min-w-32 rounded-lg border p-2 text-left transition lg:w-full ${index === i ? 'border-indigo-400 bg-slate-800' : 'border-slate-700 hover:border-slate-500'}`}><div className="grid h-20 place-items-center overflow-hidden rounded bg-slate-800">{step.mediaUrl ? <img src={step.mediaUrl} alt="" className="h-20 w-full object-cover" /> : step.type === 'CHAPTER' ? <Layers size={20} className="text-slate-500" /> : <ImageIcon size={20} className="text-slate-500" />}</div><span className="mt-2 block truncate text-[11px] text-slate-200"><span className="mr-2 font-mono text-[9px] text-slate-500">{String(i + 1).padStart(2, '0')}</span>{step.title}</span></button>)}
        </div>
        {canEdit && <div className="space-y-3 border-t border-slate-700 pt-5"><button className="btn-secondary w-full !text-xs" onClick={() => add(true)}><Plus size={13} />Add chapter</button><label className="block"><span className="studio-label mb-2 block">Capture your website</span><input aria-label="Capture website URL" type="url" className="field !text-xs" placeholder="https://your-product.com" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} /></label><button disabled={busy || !sourceUrl} onClick={() => perform(async () => { await save(); const data = await requestJson<{ steps: FlowStep[] }>(`/api/flows/${pid}/capture`, { method: 'POST', body: JSON.stringify({ url: sourceUrl }) }); setSteps(data.steps); setIndex(data.steps.length - 1); setNotice('Website captured. Review each step before publishing.'); })} className="btn-secondary w-full !text-xs">{busy ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}Capture website</button><p className="text-[10px] leading-relaxed text-slate-500">Capture only websites you have permission to use.</p></div>}
      </aside>
      <section className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3"><span className="studio-label">{active ? `Step ${index + 1} / ${steps.length}` : 'Canvas'}{tool !== 'select' ? ` — Click to add ${tool}` : ''}</span><div className="flex gap-1">{canEdit && [{ id: 'select', icon: MousePointer2 }, { id: 'hotspot', icon: Plus }, { id: 'callout', icon: MessageSquare }].map(({ id, icon: Icon }) => <button key={id} aria-label={`${id} tool`} title={id} aria-pressed={tool === id} onClick={() => setTool(id as typeof tool)} className={`rounded p-2 ${tool === id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Icon size={16} /></button>)}</div></div>
        <div className="studio-canvas flex-1"><FlowCanvas step={active} design={design} editing onCanvasClick={annotate} /></div>
        {active && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-5 py-4"><div className="flex gap-2"><button aria-label="Move step earlier" disabled={!canEdit || index === 0} onClick={() => move(-1)} className="btn-quiet"><ArrowUp size={14} /></button><button aria-label="Move step later" disabled={!canEdit || index === steps.length - 1} onClick={() => move(1)} className="btn-quiet"><ArrowDown size={14} /></button><button aria-label="Delete step" disabled={!canEdit} onClick={() => { setSteps(steps.filter((_, i) => i !== index)); setIndex(Math.max(0, index - 1)); setDirty(true); }} className="btn-quiet !text-red-300"><Trash2 size={14} /></button></div><span className="text-[10px] text-slate-500">Review sensitive content before publishing.</span></div>}
      </section>
      <aside className="studio-panel border-t lg:border-l lg:border-t-0">
        <div className="flex gap-4 border-b border-slate-700 pb-3">{(['step', 'theme', 'share'] as const).map((id) => <button key={id} onClick={() => setTab(id)} className={`text-xs capitalize ${tab === id ? 'text-orange-200' : 'text-slate-400'}`}>{id}</button>)}</div>
        <fieldset disabled={!canEdit || busy} className="space-y-5 disabled:opacity-70">
          {tab === 'step' && active && <>
            <label className="block"><span className="field-label">Step title</span><input className="field" value={active.title} onChange={(e) => update({ title: e.target.value })} /></label>
            {active.type === 'CHAPTER' && active.chapter ? <>
              <label className="block"><span className="field-label">Headline</span><input className="field" value={active.chapter.title} onChange={(e) => update({ chapter: { ...active.chapter!, title: e.target.value } })} /></label>
              <label className="block"><span className="field-label">Supporting copy</span><textarea className="field" rows={3} value={active.chapter.subtitle} onChange={(e) => update({ chapter: { ...active.chapter!, subtitle: e.target.value } })} /></label>
              <label className="block"><span className="field-label">Chapter background</span><input type="color" aria-label="Chapter background color" value={active.chapter.backgroundValue.startsWith('#') ? active.chapter.backgroundValue : '#252d22'} onChange={(e) => update({ chapter: { ...active.chapter!, backgroundValue: e.target.value } })} /></label>
              <label className="flex items-center justify-between gap-3 text-xs"><span>Collect contact details</span><input type="checkbox" checked={active.chapter.interactionMode === 'form'} onChange={(e) => update({ chapter: { ...active.chapter!, interactionMode: e.target.checked ? 'form' : 'buttons', formFields: e.target.checked ? [{ id: crypto.randomUUID(), key: 'email', label: 'Work email', placeholder: 'you@company.com', required: true }] : [] } })} /></label>
            </> : <><input type="file" accept="image/png,image/jpeg,image/webp,video/mp4" ref={fileInput} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) perform(() => upload(file)); e.target.value = ''; }} /><button className="btn-secondary w-full !text-xs" onClick={() => fileInput.current?.click()}><Upload size={14} />{active.mediaUrl ? 'Replace media' : 'Upload screenshot or MP4'}</button></>}
            {!!active.hotspots.length && <div><h3 className="studio-label mb-3">Hotspots</h3>{active.hotspots.map((hotspot) => <div key={hotspot.id} className="mb-3 space-y-2 rounded-lg border border-slate-700 p-3"><input aria-label="Hotspot tooltip" className="field !text-xs" value={hotspot.tooltipText} onChange={(e) => update({ hotspots: active.hotspots.map((h) => h.id === hotspot.id ? { ...h, tooltipText: e.target.value } : h) })} /><button className="text-[10px] text-red-300" onClick={() => update({ hotspots: active.hotspots.filter((h) => h.id !== hotspot.id) })}>Remove hotspot</button></div>)}</div>}
            {!!active.callouts.length && <div><h3 className="studio-label mb-3">Callouts</h3>{active.callouts.map((callout) => <div key={callout.id} className="mb-3 space-y-2 rounded-lg border border-slate-700 p-3"><input aria-label="Callout title" className="field !text-xs" value={callout.title} onChange={(e) => update({ callouts: active.callouts.map((c) => c.id === callout.id ? { ...c, title: e.target.value } : c) })} /><textarea aria-label="Callout body" className="field !text-xs" value={callout.body} onChange={(e) => update({ callouts: active.callouts.map((c) => c.id === callout.id ? { ...c, body: e.target.value } : c) })} /><button className="text-[10px] text-red-300" onClick={() => update({ callouts: active.callouts.filter((c) => c.id !== callout.id) })}>Remove callout</button></div>)}</div>}
            <div className="border-t border-slate-700 pt-4"><label><span className="field-label">Narration script</span><textarea className="field" rows={3} value={active.voiceover.script} onChange={(e) => update({ voiceover: { ...active.voiceover, script: e.target.value, audioUrl: undefined, enabled: false } })} /></label><button className="btn-secondary mt-3 w-full !text-xs" disabled={!active.voiceover.script} onClick={() => perform(async () => {
              const speech = await requestJson<{ audioUrl: string }>('/api/tts', { method: 'POST', body: JSON.stringify({ script: active.voiceover.script, voiceId: active.voiceover.voiceId, workspaceSlug: flow?.workspace.slug }) });
              update({ voiceover: { ...active.voiceover, audioUrl: speech.audioUrl, enabled: true } }); setNotice('Narration generated. Save to keep this audio.');
            })}>Generate narration</button>{active.voiceover.audioUrl && <audio className="mt-3 w-full" controls src={active.voiceover.audioUrl} />}</div>
          </>}
          {tab === 'step' && !active && <p className="text-xs leading-relaxed text-slate-400">Add a step to begin editing. Your content is never filled with sample data.</p>}
          {tab === 'theme' && <>
            <label className="flex items-center justify-between text-xs">Accent color<input aria-label="Accent color" type="color" value={design.primaryColor} onChange={(e) => { setDesign({ ...design, primaryColor: e.target.value }); setDirty(true); }} /></label>
            <label className="flex items-center justify-between text-xs">Background<input aria-label="Canvas background" type="color" value={design.backgroundColor} onChange={(e) => { setDesign({ ...design, backgroundColor: e.target.value }); setDirty(true); }} /></label>
            <label className="block"><span className="field-label">Canvas padding</span><input type="range" aria-label="Canvas padding" min={0} max={64} value={design.padding} onChange={(e) => { setDesign({ ...design, padding: +e.target.value }); setDirty(true); }} /></label>
            <label className="block"><span className="field-label">Corner radius</span><input type="range" aria-label="Corner radius" min={0} max={32} value={design.borderRadius} onChange={(e) => { setDesign({ ...design, borderRadius: +e.target.value }); setDirty(true); }} /></label>
            <div className="border-t border-slate-700 pt-4"><label><span className="field-label">Refine demo copy with AI</span><textarea className="field" value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Make the instructions clearer for first-time visitors." rows={3} /></label><button className="btn-secondary mt-3 w-full !text-xs" disabled={!instruction || !steps.length} onClick={() => perform(async () => { await save(); const data = await requestJson<{ steps: FlowStep[] }>(`/api/flows/${pid}/ai-generate`, { method: 'POST', body: JSON.stringify({ prompt: instruction }) }); setSteps(data.steps); setNotice('Copy refined and saved. Previous audio was cleared because the script changed.'); })}><Sparkles size={13} />Refine copy</button></div>
          </>}
          {tab === 'share' && <>
            <p className="text-xs leading-relaxed text-slate-400">Publishing makes this demo available to anyone with its link. Unpublish at any time to revoke public access.</p>
            <label className="block"><span className="field-label">Translate published text</span><select value={locale} className="field" onChange={(e) => setLocale(e.target.value)}>{TRANSLATION_LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></label>
            <button className="btn-secondary w-full !text-xs" disabled={!steps.length} onClick={() => perform(async () => { await save(); await requestJson(`/api/flows/${pid}/translate`, { method: 'POST', body: JSON.stringify({ locale }) }); setNotice('Translation generated and saved. Viewers can choose it in the player.'); })}><Globe size={13} />Generate translation</button>
          </>}
        </fieldset>
        {tab === 'share' && flow?.status === 'PUBLISHED' && <div className="space-y-3 border-t border-slate-700 pt-5"><label><span className="field-label">Share link</span><input readOnly className="field !text-xs" value={shareUrl} onFocus={(e) => e.target.select()} /></label><button className="btn-secondary w-full !text-xs" onClick={() => perform(async () => { await navigator.clipboard.writeText(shareUrl); setNotice('Link copied.'); })}><Copy size={13} />Copy share link</button><button className="btn-secondary w-full !text-xs" onClick={() => perform(async () => { await navigator.clipboard.writeText(`<iframe src="${shareUrl}" width="100%" height="600" style="border:0" title="${flow.name.replace(/[<>&"]/g, '')}" allowfullscreen></iframe>`); setNotice('Embed code copied.'); })}><Eye size={13} />Copy embed code</button></div>}
      </aside>
    </main>
  </div>;
}
