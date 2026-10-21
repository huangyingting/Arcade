'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Asset = { id: string; name: string; status: string; assetType: 'FLOW' | 'VIDEO' | 'VISUAL' | 'COLLECTION' };
type Workspace = { role: string; flows: Asset[]; promptVideos: Asset[]; visualProjects: Asset[]; collections: Asset[] };
export default function ArchivePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load archived projects.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load the archive.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  async function change(asset: Asset, status: 'DRAFT' | 'ARCHIVED') {
    if (!canManage) return;
    setPending(asset.id); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetStatusChange: { assetType: asset.assetType, assetId: asset.id, status } }) });
      const data = await response.json();
      if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to update the project.');
      setWorkspace(data.workspace); setMessage(status === 'DRAFT' ? 'Project restored as a draft. Review it before publishing.' : 'Project archived.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update this project.'); }
    finally { setPending(null); }
  }
  const assets: Asset[] = workspace ? [...workspace.flows.map(asset => ({ ...asset, assetType: 'FLOW' as const })), ...workspace.promptVideos.map(asset => ({ ...asset, assetType: 'VIDEO' as const })), ...workspace.visualProjects.map(asset => ({ ...asset, assetType: 'VISUAL' as const })), ...(workspace.collections || []).map(asset => ({ ...asset, assetType: 'COLLECTION' as const }))] : [];
  const archived = assets.filter(asset => asset.status === 'ARCHIVED');
  const active = assets.filter(asset => asset.status !== 'ARCHIVED' && asset.status !== 'DELETED');
  function rows(items: Asset[], restore: boolean) {
    return <div className="mt-6 divide-y divide-slate-200">{items.map(asset => <article key={`${asset.assetType}-${asset.id}`} className="flex items-center justify-between gap-4 py-5"><div><p className="eyebrow">{asset.assetType} / {asset.status}</p><h3 className="mt-2 font-semibold">{asset.name}</h3></div>{canManage && <button className="btn-secondary" disabled={pending !== null} onClick={() => void change(asset, restore ? 'DRAFT' : 'ARCHIVED')}>{pending === asset.id ? 'Updating…' : restore ? 'Restore as draft' : 'Archive'}</button>}</article>)}</div>;
  }
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8"><p className="eyebrow">10 / Project archive</p><h1 className="page-title mt-3">On pause, not forgotten.</h1><p className="page-intro mt-4">Keep finished work out of the way. Restore it as a draft whenever you need it.</p></header>{error && <p role="alert" className="status-error mb-5">{error}</p>}{message && <p role="status" className="status-success mb-5">{message}</p>}{!workspace ? !error && <p role="status">Loading archive…</p> : <><section className="panel"><h2 className="panel-heading">Archived projects · {archived.length}</h2>{archived.length ? rows(archived, true) : <div className="empty-state mt-6">No archived projects. Only work you explicitly archive appears here.</div>}{!canManage && <p className="mt-5 text-sm text-slate-500">Only owners and administrators can archive and restore projects.</p>}</section>{canManage && active.length > 0 && <section className="panel mt-6"><h2 className="panel-heading">Active projects</h2><p className="mt-3 text-sm text-slate-500">Archiving removes a project from the active library and public sharing.</p>{rows(active, false)}</section>}<Link className="btn-quiet mt-5" href={`/workspaces/${workspaceSlug}`}>Back to workspace</Link></>}</main></WorkspaceShell>;
}
