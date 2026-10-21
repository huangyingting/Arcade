'use client';

import { use, useEffect, useState } from 'react';
import { Layers, Film, ArrowUp, ArrowDown, Trash2, Plus, ArrowUpRight, FolderOpen } from 'lucide-react';
import { StudioHeader } from '@/components/studio/StudioHeader';
import { requestJson, errorMessage } from '@/lib/client';

type Collection = { id: string; name: string; status: string; role: string; shareId: string; headerJson: string; itemsJson: string; workspace: { slug: string } };
type Item = { id: string; assetId: string; assetType: 'FLOW' | 'VIDEO'; order: number };
type Header = { title: string; subtitle: string; ctaLabel: string; ctaUrl: string };
type Catalog = { id: string; name: string; shareId: string; thumbnailUrl: string | null; description?: string };
export default function CollectionEditor({ params }: { params: Promise<{ pid: string }> }) {
  const { pid } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [header, setHeader] = useState<Header>({ title: '', subtitle: '', ctaLabel: '', ctaUrl: '' });
  const [items, setItems] = useState<Item[]>([]);
  const [flows, setFlows] = useState<Catalog[]>([]);
  const [videos, setVideos] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const canEdit = Boolean(collection && collection.role !== 'VIEWER');
  useEffect(() => { requestJson<{ collection: Collection; flows: Catalog[]; videos: Catalog[] }>(`/api/collections/${pid}`).then((data) => { setCollection(data.collection); setHeader(JSON.parse(data.collection.headerJson)); setItems(JSON.parse(data.collection.itemsJson)); setFlows(data.flows); setVideos(data.videos); }).catch((e) => setError(errorMessage(e))); }, [pid]);
  async function save(status?: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const { collection: updated } = await requestJson<{ collection: Collection }>(`/api/collections/${pid}`, { method: 'PATCH', body: JSON.stringify({ name: collection?.name, header, items, ...(status ? { status } : {}) }) });
      setCollection((old) => ({ ...old, ...updated })); setNotice(status === 'PUBLISHED' ? 'Collection published. Only published items are visible to viewers.' : status === 'DRAFT' ? 'Collection unpublished.' : 'Collection saved.');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  function move(index: number, direction: -1 | 1) {
    const next = [...items]; const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, order) => ({ ...item, order })));
  }
  return <div className="studio">
    <StudioHeader kind="Collection / Studio" name={collection?.name || ''} workspaceSlug={collection?.workspace.slug} status={collection?.status} canEdit={canEdit} busy={busy} onName={(name) => { if (collection) setCollection({ ...collection, name }); }} onSave={() => save()} onPublish={() => save(collection?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')} shareUrl={collection ? `/share/collections/${collection.shareId}` : undefined} />
    {(error || notice) && <div aria-live="polite" className="border-b border-slate-800 px-5 py-3">{error && <p role="alert" className="status-error">{error}</p>}{notice && <p className="text-xs text-emerald-300">{notice}</p>}</div>}
    <main id="main-content" className="grid flex-1 lg:grid-cols-[320px_1fr]">
      <aside className="studio-panel border-r"><fieldset disabled={!canEdit || busy} className="space-y-5"><p className="studio-label">Collection identity</p><label className="block"><span className="field-label">Headline</span><input className="field" value={header.title} onChange={(e) => setHeader({ ...header, title: e.target.value })} maxLength={300} /></label><label className="block"><span className="field-label">Introduction</span><textarea rows={3} className="field" value={header.subtitle} onChange={(e) => setHeader({ ...header, subtitle: e.target.value })} maxLength={2000} /></label><label className="block"><span className="field-label">CTA label <span className="font-normal opacity-50">(optional)</span></span><input className="field" value={header.ctaLabel} onChange={(e) => setHeader({ ...header, ctaLabel: e.target.value })} maxLength={100} /></label><label className="block"><span className="field-label">CTA destination</span><input className="field" type="url" value={header.ctaUrl} onChange={(e) => setHeader({ ...header, ctaUrl: e.target.value })} placeholder="https://your-product.com" /></label>
      <div className="space-y-3 border-t border-slate-700 pt-5"><h2 className="studio-label">Add published work</h2><select aria-label="Published asset" className="field !text-xs" value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Choose a published asset</option>{flows.map((f) => <option key={f.id} value={`FLOW:${f.id}`}>Demo / {f.name}</option>)}{videos.map((v) => <option key={v.id} value={`VIDEO:${v.id}`}>Video / {v.name}</option>)}</select><button className="btn-secondary w-full !text-xs" disabled={!selected} onClick={() => { const [assetType, assetId] = selected.split(':'); if (!items.some((i) => i.assetId === assetId)) setItems([...items, { id: crypto.randomUUID(), assetId, assetType: assetType as Item['assetType'], order: items.length }]); setSelected(''); }}><Plus size={13} />Add to collection</button><p className="text-[10px] leading-relaxed text-slate-500">Only published demos and videos from this workspace can be added. Publish them in their editors first.</p></div></fieldset></aside>
      <section className="p-6 md:p-12"><p className="studio-label">Collection preview</p><div className="mt-6 overflow-hidden rounded-2xl bg-[#f5f4ec] text-slate-900"><div className="border-b border-slate-300 px-8 py-12 md:px-12"><p className="eyebrow">A curated perspective</p><h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">{header.title || 'Your collection title'}</h1>{header.subtitle && <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500">{header.subtitle}</p>}{header.ctaUrl && header.ctaLabel && <span className="btn-primary mt-5">{header.ctaLabel}<ArrowUpRight size={15} /></span>}</div><div className="space-y-4 p-5 md:p-8">{!items.length && <div className="empty-state"><FolderOpen size={30} strokeWidth={1} /><p>Add published work to build this collection.</p></div>}{items.map((item, index) => {
        const asset = (item.assetType === 'FLOW' ? flows : videos).find((a) => a.id === item.assetId);
        return <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-300 bg-[#fdfcf7] p-4">{asset?.thumbnailUrl ? <img src={asset.thumbnailUrl} alt="" className="h-20 w-32 rounded-lg object-cover" /> : <div className="grid h-20 w-32 place-items-center rounded-lg bg-slate-100">{item.assetType === 'FLOW' ? <Layers size={24} className="text-slate-400" /> : <Film size={24} className="text-slate-400" />}</div>}<div className="min-w-0 flex-1"><p className="eyebrow">{item.assetType === 'FLOW' ? 'Interactive demo' : 'Launch video'}</p><h2 className="mt-2 text-sm font-semibold">{asset?.name || 'Asset no longer published'}</h2></div>{canEdit && <div className="flex gap-1"><button aria-label="Move asset earlier" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-2 text-slate-500"><ArrowUp size={14} /></button><button aria-label="Move asset later" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="rounded p-2 text-slate-500"><ArrowDown size={14} /></button><button aria-label="Remove from collection" onClick={() => setItems(items.filter((i) => i.id !== item.id))} className="rounded p-2 text-red-700"><Trash2 size={14} /></button></div>}</div>;
      })}</div></div></section>
    </main>
  </div>;
}
