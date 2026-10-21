'use client';

import { use, useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Upload, Sparkles, Globe, Loader2, Trash2, Plus } from 'lucide-react';
import { requestJson, errorMessage } from '@/lib/client';
import { blankVisual } from '@/lib/content';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { VisualPreview } from '@/components/studio/VisualPreview';
import { VISUAL_SIZE_PRESETS, TRANSLATION_LOCALES, type VisualCanvasItem } from '@/types/domain';

type Project = { id: string; name: string; status: string; role: string; visualsJson: string; workspace: { slug: string } };
export default function VisualEditor({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [visuals, setVisuals] = useState<VisualCanvasItem[]>([]);
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<'content' | 'style'>('content');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [download, setDownload] = useState<{ url: string; size: string } | null>(null);
  const [locale, setLocale] = useState('zh-CN');
  const [dirty, setDirty] = useState(false);
  const [format, setFormat] = useState<'png' | 'mp4'>('png');
  const active = visuals[index] || null;
  const canEdit = Boolean(project && project.role !== 'VIEWER');
  useEffect(() => { requestJson<{ project: Project }>(`/api/visual-projects/${pid}`).then(({ project }) => { setProject(project); setVisuals(JSON.parse(project.visualsJson)); }).catch((e) => setError(errorMessage(e))); }, [pid]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);
  function update(patch: Partial<VisualCanvasItem>) { setVisuals((prev) => prev.map((v, i) => i === index ? { ...v, ...patch } : v)); setDirty(true); setDownload(null); }
  async function run(label: string, task: () => Promise<void>) {
    setBusy(label); setError(''); setNotice('');
    try { await task(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(''); }
  }
  async function save() {
    const data = await requestJson<{ project: Project }>(`/api/visual-projects/${pid}`, { method: 'PATCH', body: JSON.stringify({ name: project?.name, visuals }) });
    setProject((old) => ({ ...old, ...data.project })); setDirty(false); setNotice('Your canvases are saved.');
  }
  function selectPreset(preset: typeof VISUAL_SIZE_PRESETS[number]) {
    const found = visuals.findIndex((v) => v.presetId === preset.id);
    if (found >= 0) { setIndex(found); return; }
    const next = { ...(active || blankVisual()), id: crypto.randomUUID(), presetId: preset.id, platform: preset.platform, presetName: preset.name, width: preset.width, height: preset.height };
    setVisuals([...visuals, next]); setIndex(visuals.length); setDirty(true); setDownload(null);
  }
  return <div className="studio">
    <StudioHeader kind="Campaign visuals / Studio" name={project?.name || ''} workspaceSlug={project?.workspace.slug} status={project?.status} canEdit={canEdit} busy={Boolean(busy)} onName={(name) => { if (project) setProject({ ...project, name }); setDirty(true); }} onSave={() => run('Saving', save)}>
      {canEdit && <button className="btn-primary !min-h-10 !text-xs" disabled={Boolean(busy) || !active} onClick={() => run('Rendering your visual', async () => { await save(); const data = await requestJson<{ fileUrl: string; fileSize: string }>(`/api/visual-projects/${pid}/export`, { method: 'POST', body: JSON.stringify({ format, visualId: active?.id }) }); setDownload({ url: data.fileUrl, size: data.fileSize }); setNotice('Your export is ready to download.'); })}>{busy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}Export {format.toUpperCase()}</button>}
    </StudioHeader>
    <div aria-live="polite" className={error || notice || busy ? 'border-b border-slate-800 px-5 py-3' : ''}>{error && <p role="alert" className="status-error">{error}</p>}{notice && <p className="text-xs text-emerald-300">{notice}</p>}{busy && <p className="mt-1 text-xs text-orange-200">{busy}…</p>}{download && <a className="mt-2 inline-flex items-center gap-2 text-xs text-orange-200" href={`${download.url}?download=1`}><Download size={13} />Download export · {download.size}</a>}</div>
    <main id="main-content" className="studio-layout">
      <aside className="studio-panel border-b lg:border-b-0 lg:border-r"><h2 className="studio-label">Canvas formats</h2><p className="text-[10px] leading-relaxed text-slate-500">Choose a size. Your current design is copied into the new canvas so you can adapt its layout.</p><div className="max-h-96 space-y-6 overflow-y-auto lg:max-h-none">{[...new Set(VISUAL_SIZE_PRESETS.map((p) => p.platform))].map((platform) => <div key={platform}><h3 className="mb-2 text-[11px] font-medium text-slate-300">{platform}</h3><div className="space-y-1">{VISUAL_SIZE_PRESETS.filter((p) => p.platform === platform).map((preset) => <button key={preset.id} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-[10px] ${preset.id === active?.presetId ? 'border-indigo-400 bg-slate-800 text-orange-100' : 'border-transparent text-slate-400 hover:bg-slate-800'}`} onClick={() => canEdit ? selectPreset(preset) : setIndex(Math.max(0, visuals.findIndex((v) => v.presetId === preset.id)))}><span>{preset.name}</span><span className="ml-2 shrink-0 font-mono text-[8px] text-slate-500">{preset.width}×{preset.height}</span></button>)}</div></div>)}</div></aside>
      <section className="flex min-w-0 flex-col"><div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><span className="studio-label">{active?.platform || 'Canvas'} / {active ? `${active.width} × ${active.height}` : 'No canvas'}</span><span className="text-[10px] text-slate-500">{dirty ? 'Unsaved changes' : 'Composition preview'}</span></div><div className="studio-canvas flex-1"><VisualPreview visual={active} /></div><div className="flex gap-2 overflow-x-auto border-t border-slate-800 px-5 py-4">{visuals.map((v, i) => <button key={v.id} onClick={() => { setIndex(i); setDownload(null); }} className={`whitespace-nowrap rounded-lg border px-4 py-2 text-[10px] ${i === index ? 'border-indigo-400 text-orange-100' : 'border-slate-700 text-slate-400'}`}>{v.platform} / {v.width}×{v.height}</button>)}</div></section>
      <aside className="studio-panel border-t lg:border-l lg:border-t-0"><div className="flex gap-5 border-b border-slate-700 pb-4"><button className={`text-xs ${tab === 'content' ? 'text-orange-200' : 'text-slate-400'}`} onClick={() => setTab('content')}>Content</button><button className={`text-xs ${tab === 'style' ? 'text-orange-200' : 'text-slate-400'}`} onClick={() => setTab('style')}>Style & export</button></div>
        <fieldset disabled={!canEdit || Boolean(busy)} className="space-y-5">
          {active && tab === 'content' && <>
            <label className="block"><span className="field-label">Headline</span><textarea className="field" rows={4} value={active.headline} onChange={(e) => update({ headline: e.target.value })} maxLength={300} /></label>
            <label className="block"><span className="field-label">Supporting copy</span><textarea className="field" rows={3} value={active.subheadline} onChange={(e) => update({ subheadline: e.target.value })} maxLength={1000} /></label>
            <label className="block"><span className="field-label">Call to action</span><input className="field" value={active.ctaLabel} onChange={(e) => update({ ctaLabel: e.target.value })} maxLength={100} placeholder="Optional" /></label>
            <label className="btn-secondary w-full !text-xs"><Upload size={13} />Upload product image<input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file && project) run('Uploading image', async () => { const form = new FormData(); form.append('file', file); form.append('workspaceSlug', project.workspace.slug); const data = await requestJson<{ url: string }>('/api/uploads', { method: 'POST', body: form }); update({ screenshotUrl: data.url }); }); e.target.value = ''; }} /></label>
            {active.screenshotUrl && <button className="text-[10px] text-slate-400" onClick={() => update({ screenshotUrl: '' })}>Remove product image</button>}
            <div className="space-y-3 border-t border-slate-700 pt-5"><h3 className="studio-label">Refine with AI</h3><button className="btn-secondary w-full !text-xs" disabled={!active.headline} onClick={() => run('Refining copy', async () => { await save(); const data = await requestJson<{ project: Project }>(`/api/visual-projects/${pid}`, { method: 'PATCH', body: JSON.stringify({ averyAction: 'headline', visualId: active.id }) }); setVisuals(JSON.parse(data.project.visualsJson)); setNotice('Copy refined and saved.'); })}><Sparkles size={13} />Refine this copy</button><select aria-label="Translation language" value={locale} onChange={(e) => setLocale(e.target.value)} className="field">{TRANSLATION_LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select><button className="btn-secondary w-full !text-xs" onClick={() => run('Translating copy', async () => { await save(); const data = await requestJson<{ project: Project }>(`/api/visual-projects/${pid}`, { method: 'PATCH', body: JSON.stringify({ averyAction: 'translate', visualId: active.id, locale }) }); setVisuals(JSON.parse(data.project.visualsJson)); setNotice('This canvas has been translated and saved.'); })}><Globe size={13} />Translate copy</button></div>
          </>}
          {active && tab === 'style' && <>
            {([{ key: 'backgroundColor', label: 'Background' }, { key: 'headlineColor', label: 'Text' }, { key: 'ctaBgColor', label: 'Accent / CTA' }, { key: 'ctaTextColor', label: 'CTA text' }] as const).map(({ key, label }) => <label key={key} className="flex items-center justify-between text-xs text-slate-300">{label}<input aria-label={`${label} color`} type="color" value={active[key]} onChange={(e) => update({ [key]: e.target.value })} /></label>)}
            <label className="block border-t border-slate-700 pt-5"><span className="field-label">Export format</span><select className="field" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}><option value="png">PNG / Still image</option><option value="mp4">MP4 / Motion card</option></select></label>
            <p className="text-[10px] leading-relaxed text-slate-500">Export uses the selected canvas’s actual pixel dimensions. MP4 creates a short motion card, not an AI-generated video.</p>
            <button className="btn-secondary w-full !text-xs !text-red-300" onClick={() => { setVisuals(visuals.filter((_, i) => i !== index)); setIndex(Math.max(0, index - 1)); setDirty(true); }}><Trash2 size={13} />Remove canvas</button>
          </>}
        </fieldset>
      </aside>
    </main>
  </div>;
}
