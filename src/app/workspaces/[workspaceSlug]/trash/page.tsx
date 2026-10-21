'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Asset = { id: string; name: string; status: string; assetType: 'FLOW' | 'VIDEO' | 'VISUAL' | 'COLLECTION' };
type Workspace = { role: string; flows: Asset[]; promptVideos: Asset[]; visualProjects: Asset[]; collections: Asset[] };
export default function TrashPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load removed projects.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load trash.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  async function change(asset: Asset, status: 'DRAFT' | 'DELETED') {
    if (!canManage) return;
    setPending(asset.id); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetStatusChange: { assetType: asset.assetType, assetId: asset.id, status } }) });
      const data = await response.json();
      if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to update the project.');
      setWorkspace(data.workspace); setConfirmId(null); setMessage(status === 'DRAFT' ? 'Project restored as a draft. It has not been published.' : 'Project moved to trash.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update this project.'); }
    finally { setPending(null); }
  }
  const assets: Asset[] = workspace ? [...workspace.flows.map(asset => ({ ...asset, assetType: 'FLOW' as const })), ...workspace.promptVideos.map(asset => ({ ...asset, assetType: 'VIDEO' as const })), ...workspace.visualProjects.map(asset => ({ ...asset, assetType: 'VISUAL' as const })), ...(workspace.collections || []).map(asset => ({ ...asset, assetType: 'COLLECTION' as const }))] : [];
  const removed = assets.filter(asset => asset.status === 'DELETED');
  const active = assets.filter(asset => asset.status !== 'DELETED');
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8"><p className="eyebrow">11 / Workspace trash</p><h1 className="page-title mt-3">Room to reconsider.</h1><p className="page-intro mt-4">Removed projects stay recoverable. Restoring a project never publishes it automatically.</p></header>{error && <p role="alert" className="status-error mb-5">{error}</p>}{message && <p role="status" className="status-success mb-5">{message}</p>}{!workspace ? !error && <p role="status">Loading removed projects…</p> : <><section className="panel"><h2 className="panel-heading">Removed projects · {removed.length}</h2>{!removed.length ? <p className="empty-state mt-6">Nothing in the trash.</p> : <div className="mt-6 divide-y divide-slate-200">{removed.map(asset => <article key={asset.id} className="flex items-center justify-between gap-4 py-5"><div><p className="eyebrow">{asset.assetType}</p><h3 className="mt-2 font-semibold">{asset.name}</h3></div>{canManage && <button className="btn-secondary" disabled={pending !== null} onClick={() => void change(asset, 'DRAFT')}>{pending === asset.id ? 'Restoring…' : 'Restore as draft'}</button>}</article>)}</div>}<p className="mt-5 text-sm text-slate-500">Permanent deletion and scheduled automatic purging are not available here.</p></section>{canManage && active.length > 0 && <section className="panel mt-6"><h2 className="panel-heading">Remove a project</h2><p className="mt-3 text-sm text-slate-500">Moving a project to trash removes it from the active library and stops public sharing.</p><div className="mt-6 divide-y divide-slate-200">{active.map(asset => <article className="flex flex-wrap items-center justify-between gap-4 py-5" key={asset.id}><div><p className="eyebrow">{asset.assetType} / {asset.status}</p><h3 className="mt-2 font-semibold">{asset.name}</h3></div>{confirmId === asset.id ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm">Move to trash?</span><button className="btn-secondary" disabled={pending !== null} onClick={() => void change(asset, 'DELETED')}>{pending === asset.id ? 'Removing…' : 'Confirm removal'}</button><button className="btn-quiet" disabled={pending !== null} onClick={() => setConfirmId(null)}>Cancel</button></div> : <button className="btn-quiet" disabled={pending !== null} onClick={() => setConfirmId(asset.id)}>Move to trash</button>}</article>)}</div></section>}<Link className="btn-quiet mt-5" href={`/workspaces/${workspaceSlug}`}>Back to workspace</Link></>}</main></WorkspaceShell>;
}
