'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowRight, Layers, Film, Image as ImageIcon, FolderOpen, Plus, Palette, Loader2, Globe, Aperture } from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { requestJson, errorMessage } from '@/lib/client';
import type { AssetSummary, Capabilities, WorkspaceData } from '@/types/product';

const modes = [
  { id: 'demo', title: 'Interactive demo', short: 'Demo', description: 'Capture a website or begin with a blank canvas. Add steps, hotspots and your narrative.', icon: Layers, action: 'Create walkthrough' },
  { id: 'video', title: 'Launch video', short: 'Video', description: 'Turn your brief into an editable storyboard. Review every scene before you render.', icon: Film, action: 'Build storyboard' },
  { id: 'visuals', title: 'Campaign visuals', short: 'Visuals', description: 'Compose social and campaign graphics. One visual direction, every format you need.', icon: ImageIcon, action: 'Create visuals' },
  { id: 'collection', title: 'Collection', short: 'Collection', description: 'Bring your published demos and videos together into one shareable destination.', icon: FolderOpen, action: 'Create collection' },
] as const;
type Mode = typeof modes[number]['id'];

export default function WorkspaceHome({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [mode, setMode] = useState<Mode>('demo');
  const [prompt, setPrompt] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [name, setName] = useState('');
  const [durationSec, setDurationSec] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [brandKitId, setBrandKitId] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [brandError, setBrandError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      requestJson<{ workspace: WorkspaceData }>(`/api/workspaces/${workspaceSlug}`, { signal: controller.signal }),
      requestJson<Capabilities>('/api/capabilities', { signal: controller.signal }),
    ]).then(([data, capabilities]) => { setWorkspace(data.workspace); setCapabilities(capabilities); }).catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e)); });
    return () => controller.abort();
  }, [workspaceSlug]);
  const active = modes.find((m) => m.id === mode)!;
  const canEdit = workspace && workspace.role !== 'VIEWER';
  const base = `/workspaces/${workspaceSlug}`;
  const assets = [
    ...(workspace?.flows || []).map((a) => ({ ...a, type: 'demo', label: 'Interactive demo', icon: Layers, href: `/flows/${a.id}/edit` })),
    ...(workspace?.promptVideos || []).map((a) => ({ ...a, type: 'video', label: 'Launch video', icon: Film, href: `/prompt-videos/custom/${a.id}/edit` })),
    ...(workspace?.visualProjects || []).map((a) => ({ ...a, type: 'visuals', label: 'Campaign visuals', icon: ImageIcon, href: `/visual-projects/${a.id}/edit` })),
    ...(workspace?.collections || []).map((a) => ({ ...a, type: 'collection', label: 'Collection', icon: FolderOpen, href: `/collections/${a.id}/edit` })),
  ].filter((a) => !['DELETED', 'ARCHIVED'].includes(a.status)).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const endpoint = mode === 'demo' ? 'flows' : mode === 'video' ? 'prompt-videos' : mode === 'visuals' ? 'visual-projects' : 'collections';
      const data = await requestJson<{ flow?: AssetSummary; video?: AssetSummary; project?: AssetSummary; collection?: AssetSummary }>(`/api/${endpoint}`, {
        method: 'POST', body: JSON.stringify({ workspaceSlug, name: name || undefined, prompt, sourceUrl: sourceUrl || undefined, brandKitId: brandKitId || undefined, durationSec, aspectRatio }),
      });
      const asset = data.flow || data.video || data.project || data.collection;
      if (!asset) throw new Error('No project was returned. Please retry.');
      router.push(mode === 'demo' ? `/flows/${asset.id}/edit` : mode === 'video' ? `/prompt-videos/custom/${asset.id}/edit` : mode === 'visuals' ? `/visual-projects/${asset.id}/edit` : `/collections/${asset.id}/edit`);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function extract(event: React.FormEvent) {
    event.preventDefault(); setExtracting(true); setBrandError('');
    try {
      const { brandKit } = await requestJson<{ brandKit: { id: string } }>(`/api/workspaces/${workspaceSlug}/brand-kits`, { method: 'POST', body: JSON.stringify({ url: brandUrl }) });
      router.push(`${base}/settings/brand-kits/${brandKit.id}`);
    } catch (e) { setBrandError(errorMessage(e)); } finally { setExtracting(false); }
  }
  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>
      <div className="page-wrap reveal">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="eyebrow">01 / Creative workspace</p><h1 className="page-title">Make your product<br /><span className="text-indigo-600">the story.</span></h1><p className="page-intro">From the first interaction to the final frame.<br className="hidden sm:block" />Your ideas, one connected studio.</p></div>
          <div className="flex gap-7 border-l border-slate-300 pl-7 pb-1">
            <div><p className="stat-number">{assets.length.toString().padStart(2, '0')}</p><p className="eyebrow mt-2">Projects</p></div>
            <div><p className="stat-number">{assets.filter((a) => a.status === 'PUBLISHED').length.toString().padStart(2, '0')}</p><p className="eyebrow mt-2">Published</p></div>
          </div>
        </div>
        {canEdit && <section id="create" className="scroll-mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-[#fdfcf7]">
          <div role="tablist" aria-label="Project type" className="flex gap-7 overflow-x-auto border-b border-slate-200 px-6 md:px-8">
            {modes.map((m) => <button key={m.id} id={`tab-${m.id}`} aria-controls="create-panel" role="tab" aria-selected={mode === m.id} onClick={() => { setMode(m.id); setError(''); }} className="create-tab flex items-center gap-2"><m.icon size={15} strokeWidth={1.5} />{m.title}</button>)}
          </div>
          <div className="grid lg:grid-cols-[1fr_230px]">
            <form role="tabpanel" id="create-panel" aria-labelledby={`tab-${mode}`} onSubmit={create} className="space-y-5 p-6 md:p-8">
              <div><h2 className="text-xl font-semibold tracking-tight">{mode === 'demo' ? 'Show, don’t explain.' : mode === 'video' ? 'A strong story starts here.' : mode === 'visuals' ? 'Set the visual direction.' : 'One link. The whole story.'}</h2><p className="mt-2 text-xs leading-relaxed text-slate-500">{active.description}</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={mode === 'collection' ? 'sm:col-span-2' : ''}><span className="field-label">Project name {mode !== 'collection' && <span className="font-normal text-slate-400">(optional)</span>}</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} required={mode === 'collection'} maxLength={200} placeholder="Give this story a name" /></label>
                {mode !== 'collection' && <label><span className="field-label">Website <span className="font-normal text-slate-400">(optional)</span></span><input className="field" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://your-product.com" maxLength={2000} /></label>}
              </div>
              {['video', 'visuals'].includes(mode) && <label className="block"><span className="field-label">{mode === 'video' ? 'Creative brief' : 'Headline or campaign message'}</span><textarea className="field min-h-28" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'video' ? 'Who is this for? What should they remember? Describe the story you want to tell.' : 'The message you want your audience to see.'} required maxLength={5000} /></label>}
              {mode === 'video' && <div className="flex flex-wrap gap-4"><label><span className="field-label">Format</span><select className="field" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select></label><label><span className="field-label">Length</span><select className="field" value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))}><option value={15}>15 seconds</option><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></label></div>}
              {mode !== 'collection' && !!workspace?.brandKits.length && <label className="block max-w-sm"><span className="field-label">Brand kit</span><select className="field" value={brandKitId} onChange={(e) => setBrandKitId(e.target.value)}><option value="">No brand kit</option>{workspace.brandKits.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></label>}
              {error && <p role="alert" className="status-error">{error}</p>}
              {mode === 'video' && capabilities?.ai === false && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">AI storyboarding needs an Azure OpenAI connection. Your administrator can configure it; capture and manual visual design are available now.</p>}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-[#798e61]" />Private draft. You decide when to publish.</p><button className="btn-primary" disabled={busy || (mode === 'video' && capabilities?.ai === false)}>{busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}{busy ? (sourceUrl ? 'Capturing your website…' : 'Creating your project…') : active.action}</button></div>
            </form>
            <div aria-hidden="true" className="art-grid relative hidden flex-col items-center justify-center overflow-hidden border-l border-slate-200 bg-[#edeee2] p-8 lg:flex"><div className="absolute top-6 left-6 font-mono text-[9px] text-slate-400">STUDIO / {mode.toUpperCase()}</div><div className="relative grid h-32 w-32 place-items-center rounded-full border border-slate-400"><div className="absolute inset-3 rounded-full border border-slate-300" /><active.icon size={43} strokeWidth={1} className="text-slate-700" /><span className="absolute right-1 top-3 h-4 w-4 rounded-full bg-indigo-500" /></div><p className="absolute bottom-6 left-6 right-6 font-mono text-[9px] uppercase tracking-widest text-slate-500">Create with intention.<br />Publish with confidence.</p></div>
          </div>
        </section>}
        <section aria-labelledby="projects-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">02 / In the studio</p><h2 id="projects-title" className="mt-2 text-xl font-semibold tracking-tight">Your work, in motion.</h2></div><div className="flex flex-wrap gap-1">{['all', ...modes.map((m) => m.id)].map((f) => <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-full px-3 py-1.5 text-xs ${filter === f ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>{f === 'all' ? 'All projects' : modes.find((m) => m.id === f)?.short}</button>)}</div></div>
          {!assets.filter((a) => filter === 'all' || a.type === filter).length ? <div className="empty-state"><Aperture size={32} strokeWidth={1} className="text-slate-400" /><h3 className="text-base font-medium text-slate-800">A clean slate. A clear direction.</h3><p>No {filter === 'all' ? 'projects' : modes.find((m) => m.id === filter)?.short.toLowerCase() + ' projects'} yet. {canEdit ? 'Start your first story above.' : 'Your team’s projects will appear here.'}</p>{canEdit && <a href="#create" className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600"><Plus size={14} />Create your first project</a>}</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{assets.filter((a) => filter === 'all' || a.type === filter).slice(0, 12).map((asset) => <Link key={asset.id} href={asset.href} className="group overflow-hidden rounded-xl border border-slate-200 bg-[#fdfcf7] transition hover:-translate-y-1 hover:border-slate-400"><div className="asset-preview relative">{asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt="" loading="lazy" /> : <asset.icon size={36} strokeWidth={1} className="text-slate-400" />}<span className="absolute left-3 top-3 rounded bg-[#fdfcf7]/95 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-slate-600">{asset.status.toLowerCase()}</span></div><div className="p-5"><div className="flex justify-between gap-3"><h3 className="truncate text-sm font-semibold">{asset.name}</h3><ArrowUpRight size={16} className="shrink-0 text-slate-400 transition group-hover:text-indigo-600" /></div><div className="mt-3 flex items-center justify-between text-[10px] text-slate-500"><span>{asset.label}</span><time dateTime={asset.updatedAt}>{new Date(asset.updatedAt).toLocaleDateString()}</time></div></div></Link>)}</div>}
        </section>
        <section className="grid gap-5 border-t border-slate-300 pt-8 lg:grid-cols-[1fr_1fr]">
          <div><p className="eyebrow">03 / A consistent point of view</p><h2 className="mt-3 text-2xl font-medium tracking-tight">Your brand.<br />Not a template.</h2><p className="page-intro max-w-sm">Extract the colors, typography and imagery already on your website. Refine them once, keep your work consistent.</p><Link href={`${base}/settings/brand-kits`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-600"><Palette size={14} />{workspace?.brandKits.length ? `${workspace.brandKits.length} brand kit${workspace.brandKits.length === 1 ? '' : 's'}` : 'Manage brand kits'}<ArrowUpRight size={13} /></Link></div>
          {canEdit && <form onSubmit={extract} className="panel self-start"><label><span className="field-label flex items-center gap-2"><Globe size={14} />Start with your website</span><input className="field" type="url" required value={brandUrl} onChange={(e) => setBrandUrl(e.target.value)} placeholder="https://your-product.com" /></label>{brandError && <p className="status-error mt-3" role="alert">{brandError}</p>}<button disabled={extracting} className="btn-secondary mt-4 w-full">{extracting ? <Loader2 size={14} className="animate-spin" /> : <Palette size={14} />}{extracting ? 'Extracting brand…' : 'Extract brand kit'}</button><p className="mt-3 text-[10px] text-slate-500">Only capture websites you own or have permission to use.</p></form>}
        </section>
      </div>
    </WorkspaceShell>
  );
}
