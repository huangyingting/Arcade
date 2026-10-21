'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Layers, Film } from 'lucide-react';
import { requestJson, errorMessage } from '@/lib/client';
type Asset = { id: string; name: string; shareId: string; thumbnailUrl: string | null; description?: string; durationSec?: number };
type Payload = { collection: { name: string; headerJson: string; itemsJson: string }; flows: Asset[]; videos: Asset[] };
export default function CollectionShare({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { requestJson<Payload>(`/api/public/collections/${id}`).then(setData).catch((e) => setError(errorMessage(e))); }, [id]);
  if (!data) return <main id="main-content" className="grid min-h-screen place-items-center px-6">{error ? <p className="status-error" role="alert">{error}</p> : <p className="eyebrow">Loading collection…</p>}</main>;
  const header: { title: string; subtitle: string; ctaLabel: string; ctaUrl: string } = JSON.parse(data.collection.headerJson);
  const items: { id: string; assetType: string; assetId: string }[] = JSON.parse(data.collection.itemsJson);
  return <main id="main-content" className="page-wrap !max-w-6xl !py-12 md:!py-20"><header className="art-grid border-b border-slate-300 pb-12"><p className="eyebrow">A curated perspective</p><h1 className="page-title mt-6 max-w-3xl !text-5xl md:!text-7xl">{header.title || data.collection.name}</h1>{header.subtitle && <p className="page-intro mt-6 max-w-xl">{header.subtitle}</p>}{header.ctaLabel && header.ctaUrl && <a className="btn-primary mt-7" href={header.ctaUrl} target="_blank" rel="noreferrer">{header.ctaLabel}<ArrowUpRight size={16} /></a>}</header><div className="grid gap-6 py-6 md:grid-cols-2">{items.map((item) => {
    const asset = (item.assetType === 'FLOW' ? data.flows : data.videos).find((a) => a.id === item.assetId);
    if (!asset) return null;
    return <Link key={item.id} href={item.assetType === 'FLOW' ? `/share/${asset.shareId}` : `/share/videos/${asset.shareId}`} className="group overflow-hidden rounded-2xl border border-slate-300 bg-[#fdfcf7]">{asset.thumbnailUrl ? <img className="aspect-video w-full object-cover" src={asset.thumbnailUrl} alt="" /> : <div className="art-grid grid aspect-video place-items-center bg-[#eaecdf]">{item.assetType === 'FLOW' ? <Layers size={48} strokeWidth={1} /> : <Film size={48} strokeWidth={1} />}</div>}<div className="p-6"><p className="eyebrow">{item.assetType === 'FLOW' ? 'Interactive walkthrough' : `${asset.durationSec} second film`}</p><div className="mt-3 flex items-center justify-between"><h2 className="text-xl font-medium tracking-tight">{asset.name}</h2><ArrowUpRight size={20} className="shrink-0 text-indigo-600 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>{asset.description && <p className="mt-3 text-sm text-slate-500">{asset.description}</p>}</div></Link>;
  })}</div></main>;
}
