'use client';

import { use, useEffect, useState } from 'react';
import { Download, Film, Send, Sparkles, Volume2, Loader2, Globe, Upload, Play, Palette } from 'lucide-react';
import { requestJson, errorMessage } from '@/lib/client';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { VideoScenePreview } from '@/components/studio/VideoScenePreview';
import type { PromptVideoDesignValues, VideoTimeline } from '@/types/domain';
import { TRANSLATION_LOCALES } from '@/types/domain';

type Scene = { sceneId: string; sceneNumber: number; title: string; archetype: string; screenshotUrl?: string; durationSec: number; startSec: number };
type ExportItem = { id: string; fileUrl: string; fileSize: string; resolution: string; fps: number; status: string; createdAt: string };
type Video = { id: string; name: string; status: string; role: string; shareId: string; durationSec: number; currentVersion: number; aspectRatio: string; scenesJson: string; designValuesJson: string; timelineJson: string; exportsJson: string; workspace: { slug: string }; sessions?: { messagesJson: string }[] };

export default function VideoEditor({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [values, setValues] = useState<PromptVideoDesignValues>({ colors: {}, scenes: {} });
  const [timeline, setTimeline] = useState<VideoTimeline | null>(null);
  const [exports, setExports] = useState<ExportItem[]>([]);
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<'design' | 'ai' | 'export'>('design');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [dirty, setDirty] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [locale, setLocale] = useState('zh-CN');
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState(30);
  const [showRendered, setShowRendered] = useState(false);
  const active = scenes[index] || null;
  const fields = active ? values.scenes[active.sceneId] || {} : {};
  const canEdit = Boolean(video && video.role !== 'VIEWER');
  function hydrate(data: Video) {
    setVideo((old) => ({ ...old, ...data })); setScenes(JSON.parse(data.scenesJson));
    setValues(JSON.parse(data.designValuesJson)); setTimeline(JSON.parse(data.timelineJson));
    setExports(JSON.parse(data.exportsJson)); setDirty(false);
  }
  useEffect(() => { requestJson<{ video: Video }>(`/api/prompt-videos/${pid}`).then((data) => hydrate(data.video)).catch((e) => setError(errorMessage(e))); }, [pid]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', listener); return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);
  async function run(label: string, action: () => Promise<void>) {
    setBusy(label); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(''); }
  }
  async function save(status?: string) {
    const data = await requestJson<{ video: Video }>(`/api/prompt-videos/${pid}`, { method: 'PATCH', body: JSON.stringify({ name: video?.name, currentVersion: video?.currentVersion, scenes, designValues: values, timeline, ...(status ? { status } : {}) }) });
    hydrate(data.video);
    setNotice(status === 'PUBLISHED' ? 'Published. Your rendered video is available at its share link.' : status === 'DRAFT' ? 'Unpublished. Public access has been revoked.' : 'Changes saved. Render a fresh export after changing the composition.');
  }
  function update(key: string, value: string) {
    if (!active) return;
    setValues({ ...values, scenes: { ...values.scenes, [active.sceneId]: { ...fields, [key]: value } } }); setDirty(true); setShowRendered(false);
    if (key === 'NarrationText' && timeline) setTimeline({ ...timeline, voiceoverTrack: timeline.voiceoverTrack.filter((v) => v.sceneId !== active.sceneId) });
  }
  const shareUrl = typeof window === 'undefined' || !video ? '' : `${window.location.origin}/share/videos/${video.shareId}`;
  return <div className="studio">
    <StudioHeader kind="Launch video / Studio" name={video?.name || ''} workspaceSlug={video?.workspace.slug} status={video?.status} canEdit={canEdit} busy={Boolean(busy)} onName={(name) => { if (video) setVideo({ ...video, name }); setDirty(true); }} onSave={() => run('Saving', () => save())} onPublish={() => run('Publishing', () => save(video?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'))} shareUrl={shareUrl}>
      <button className="btn-secondary !min-h-10 !text-xs" onClick={() => setTab('export')}><Download size={13} />Export</button>
    </StudioHeader>
    <div aria-live="polite" className={`${error || notice || busy ? 'border-b border-slate-800 px-5 py-3' : ''}`}>{error && <p role="alert" className="status-error">{error}</p>}{notice && <p className="text-xs text-emerald-300">{notice}</p>}{busy && <p className="flex items-center gap-2 text-xs text-orange-200"><Loader2 size={13} className="animate-spin" />{busy}… Actual processing is in progress; large exports can take a few minutes.</p>}</div>
    <main id="main-content" className="studio-layout">
      <aside className="studio-panel border-b lg:border-b-0 lg:border-r"><h2 className="studio-label">Storyboard / {scenes.length} scenes</h2><div className="flex gap-2 overflow-x-auto lg:flex-col">{scenes.map((scene, i) => <button aria-pressed={index === i} key={scene.sceneId} onClick={() => { setIndex(i); setShowRendered(false); }} className={`min-w-32 rounded-lg border p-3 text-left lg:w-full ${i === index ? 'border-indigo-400 bg-slate-800' : 'border-slate-700'}`}><div className="mb-3 flex h-20 items-center justify-center overflow-hidden rounded bg-slate-800">{scene.screenshotUrl ? <img src={scene.screenshotUrl} alt="" className="h-full w-full object-cover" /> : <Film size={23} className="text-slate-600" />}</div><p className="truncate text-[11px]">{values.scenes[scene.sceneId]?.TitleText || scene.title}</p><p className="mt-2 font-mono text-[9px] text-slate-500">{String(i + 1).padStart(2, '0')} / {scene.durationSec.toFixed(1)}s</p></button>)}</div><p className="text-[10px] leading-relaxed text-slate-500">A storyboard is an editable composition. The finished video appears only after you render an export.</p></aside>
      <section className="flex min-w-0 flex-col"><div className="flex items-center justify-between border-b border-slate-800 px-5 py-4"><span className="studio-label">{showRendered ? 'Rendered video' : 'Composition preview'} / {video?.aspectRatio || '16:9'}</span>{!!exports.length && <button className="flex items-center gap-2 text-[11px] text-orange-200" onClick={() => setShowRendered(!showRendered)}><Play size={12} />{showRendered ? 'Edit composition' : 'Play latest render'}</button>}</div><div className="studio-canvas flex-1">{showRendered && exports[0] ? <video className="max-h-[620px] w-full rounded-xl" controls src={exports[0].fileUrl} /> : <VideoScenePreview scene={active} values={values} aspectRatio={video?.aspectRatio} />}</div>
        <div className="border-t border-slate-800 px-5 py-5"><div className="mb-3 flex justify-between"><span className="studio-label">Scene sequence</span><span className="font-mono text-[10px] text-slate-400">{video?.durationSec || 0}s / {dirty ? 'Unsaved edits' : `Revision ${video?.currentVersion || 1}`}</span></div><div className="flex h-12 gap-1">{scenes.map((scene, i) => <button key={scene.sceneId} aria-label={`Select scene ${i + 1}`} aria-pressed={index === i} style={{ flex: scene.durationSec }} onClick={() => { setIndex(i); setShowRendered(false); }} className={`min-w-0 truncate rounded px-2 text-left font-mono text-[9px] ${index === i ? 'border border-orange-300 bg-[#b9503033] text-orange-100' : 'border border-slate-700 bg-slate-800 text-slate-400'}`}>{String(i + 1).padStart(2, '0')}<span className="ml-2 hidden xl:inline">{scene.durationSec.toFixed(1)}s</span></button>)}</div>{timeline?.voiceoverTrack.length ? <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><Volume2 size={12} />{timeline.voiceoverTrack.length} generated narration clip{timeline.voiceoverTrack.length === 1 ? '' : 's'}</div> : <p className="mt-3 text-[10px] text-slate-500">No narration generated. Your export will be silent until audio is added.</p>}</div>
      </section>
      <aside className="studio-panel border-t lg:border-l lg:border-t-0"><div className="flex gap-5 border-b border-slate-700 pb-4">{(['design', 'ai', 'export'] as const).map((t) => <button className={`text-xs ${tab === t ? 'text-orange-200' : 'text-slate-400'}`} key={t} onClick={() => setTab(t)}>{t === 'ai' ? 'AI edit' : t === 'design' ? 'Design' : 'Export'}</button>)}</div>
        <fieldset disabled={!canEdit || Boolean(busy)} className="space-y-5">
          {tab === 'design' && active && <>
            <label className="block"><span className="field-label">Headline</span><textarea className="field" rows={3} value={fields.TitleText || ''} onChange={(e) => update('TitleText', e.target.value)} /></label>
            <label className="block"><span className="field-label">Supporting copy</span><textarea className="field" rows={3} value={fields.SubtitleText || ''} onChange={(e) => update('SubtitleText', e.target.value)} /></label>
            <label className="block"><span className="field-label">Destination URL</span><input type="url" className="field" value={fields.CtaUrl || ''} onChange={(e) => update('CtaUrl', e.target.value)} placeholder="https://your-product.com" /></label>
            <label className="btn-secondary w-full !text-xs"><Upload size={13} />Replace scene image<input className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file && video) run('Uploading image', async () => { const form = new FormData(); form.append('file', file); form.append('workspaceSlug', video.workspace.slug); const data = await requestJson<{ url: string }>('/api/uploads', { method: 'POST', body: form }); setScenes((prev) => prev.map((s) => s.sceneId === active.sceneId ? { ...s, screenshotUrl: data.url } : s)); setDirty(true); }); e.target.value = ''; }} /></label>
            <div className="space-y-3 border-t border-slate-700 pt-5"><h3 className="studio-label flex gap-2"><Palette size={12} />Composition palette</h3>{Object.entries(values.colors).map(([key, value]) => <label key={key} className="flex items-center justify-between text-[11px] text-slate-300"><span>{key.replace(/([A-Z])/g, ' $1').trim()}</span><input aria-label={key} type="color" value={value} className="h-6 w-8 bg-transparent" onChange={(e) => { setValues({ ...values, colors: { ...values.colors, [key]: e.target.value } }); setDirty(true); }} /></label>)}</div>
            <div className="border-t border-slate-700 pt-5"><label><span className="field-label">Narration script</span><textarea className="field" rows={4} value={fields.NarrationText || ''} onChange={(e) => update('NarrationText', e.target.value)} /></label><button className="btn-secondary mt-3 w-full !text-xs" disabled={!fields.NarrationText} onClick={() => run('Generating narration', async () => { await save(); const data = await requestJson<{ video: Video }>(`/api/prompt-videos/${pid}/narration`, { method: 'POST', body: JSON.stringify({ sceneId: active.sceneId }) }); hydrate(data.video); setNotice('Narration generated and saved. Render a fresh export to hear it in the video.'); })}><Volume2 size={13} />Generate scene narration</button>{timeline?.voiceoverTrack.find((v) => v.sceneId === active.sceneId)?.audioUrl && <audio controls className="mt-3 w-full" src={timeline.voiceoverTrack.find((v) => v.sceneId === active.sceneId)?.audioUrl} />}</div>
          </>}
          {tab === 'ai' && <>
            <p className="text-xs leading-relaxed text-slate-400">Refine this scene with your connected AI provider. Changes are saved to your draft; they don’t update existing exported files.</p>
            <label className="block"><span className="field-label">What should change?</span><textarea className="field" rows={5} placeholder="Make the opening more concise without changing the product claims." value={instruction} onChange={(e) => setInstruction(e.target.value)} /></label>
            <button className="btn-primary w-full !text-xs" disabled={!instruction || !active} onClick={() => run('Refining scene', async () => { await save(); const data = await requestJson<{ video: Video }>(`/api/prompt-videos/${pid}/chat`, { method: 'POST', body: JSON.stringify({ message: instruction, targetSceneId: active?.sceneId }) }); hydrate(data.video); setInstruction(''); setNotice('Scene refined and saved. Review the updated copy before rendering.'); })}><Send size={13} />Apply scene edit</button>
            <div className="space-y-3 border-t border-slate-700 pt-5"><label><span className="field-label">Translate every scene</span><select className="field" value={locale} onChange={(e) => setLocale(e.target.value)}>{TRANSLATION_LOCALES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></label><p className="text-[10px] leading-relaxed text-slate-500">Replaces this draft’s text. Old narration is cleared so it cannot play in the wrong language.</p><button className="btn-secondary w-full !text-xs" onClick={() => run('Translating storyboard', async () => { await save(); const data = await requestJson<{ video: Video }>(`/api/prompt-videos/${pid}/translate`, { method: 'POST', body: JSON.stringify({ locale }) }); hydrate(data.video); setNotice('Storyboard translated. Generate narration for the new scripts if needed.'); })}><Globe size={13} />Translate storyboard</button></div>
          </>}
          {tab === 'export' && <>
            <p className="text-xs leading-relaxed text-slate-400">Render your saved scenes into an MP4. Exports use actual uploaded imagery and generated narration, if present.</p>
            <label className="block"><span className="field-label">Resolution</span><select className="field" value={resolution} onChange={(e) => setResolution(e.target.value)}><option>720p</option><option>1080p</option><option>4K</option></select></label>
            <label className="block"><span className="field-label">Frame rate</span><select className="field" value={fps} onChange={(e) => setFps(Number(e.target.value))}><option value={30}>30 fps</option><option value={60}>60 fps</option></select></label>
            <button className="btn-primary w-full !text-xs" disabled={!scenes.length} onClick={() => run('Rendering MP4', async () => { await save(); const data = await requestJson<{ exports: ExportItem[] }>(`/api/prompt-videos/${pid}/export`, { method: 'POST', body: JSON.stringify({ resolution, fps }) }); setExports(data.exports); setNotice('Your MP4 is ready. Review the render, then publish when you’re happy.'); setShowRendered(true); })}><Download size={13} />Render MP4</button>
          </>}
        </fieldset>
        {tab === 'export' && <div className="space-y-3 border-t border-slate-700 pt-5"><h3 className="studio-label">Rendered files</h3>{!exports.length && <p className="text-xs text-slate-500">No exports for this composition yet.</p>}{exports.map((item) => <a key={item.id} href={`${item.fileUrl}?download=1`} className="block rounded-lg border border-slate-700 p-3 text-xs hover:border-slate-500"><span className="flex justify-between">{item.resolution} / {item.fps} fps<Download size={13} /></span><span className="mt-2 block text-[10px] text-slate-400">{item.fileSize} · {new Date(item.createdAt).toLocaleString()}</span></a>)}</div>}
      </aside>
    </main>
  </div>;
}
