'use client';

import { use, useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Memory = { id: string; category: string; title: string; content: string; source: string };
type Workspace = { role: string; memories: Memory[] };
export default function MemoryPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [category, setCategory] = useState('Product Fact');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load workspace memory.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load memory.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  async function mutate(patch: Record<string, unknown>) {
    if (!canManage) return false;
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await response.json();
      if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to update workspace memory.');
      setWorkspace(data.workspace); setMessage('Workspace memory updated.'); setConfirmId(null); return true;
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update memory.'); return false; }
    finally { setPending(false); }
  }
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8"><p className="eyebrow">07 / Workspace knowledge</p><h1 className="page-title mt-3">Keep the context.</h1><p className="page-intro mt-4">A shared record of the product facts, audience notes, and language your team chooses to save.</p></header>{error && <p role="alert" className="status-error mb-5">{error}</p>}{message && <p role="status" className="status-success mb-5">{message}</p>}{!workspace ? !error && <p role="status">Loading workspace memory…</p> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">{canManage ? <section className="panel"><h2 className="panel-heading">Add a memory</h2><form className="mt-6 space-y-5" onSubmit={async event => { event.preventDefault(); if (await mutate({ newMemory: { category, title: title.trim(), content: content.trim(), source: 'Manual Entry' } })) { setTitle(''); setContent(''); } }}><label htmlFor="category" className="field-label block">Category<select id="category" className="field mt-2 w-full" value={category} onChange={event => setCategory(event.target.value)} disabled={pending}>{['Product Fact', 'Audience', 'Brand Voice', 'Positioning', 'Other'].map(item => <option key={item}>{item}</option>)}</select></label><label htmlFor="title" className="field-label block">Title<input id="title" required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} disabled={pending} className="field mt-2 w-full" /></label><label htmlFor="content" className="field-label block">Context<textarea id="content" required maxLength={10000} rows={6} value={content} onChange={event => setContent(event.target.value)} disabled={pending} className="field mt-2 w-full" /></label><button className="btn-primary" disabled={pending || !title.trim() || !content.trim()}>{pending ? 'Saving…' : 'Save memory'}</button></form></section> : <aside className="panel"><h2 className="panel-heading">Shared knowledge</h2><p className="mt-3 text-sm text-slate-500">You have read-only access. An owner or administrator can add and remove workspace memories.</p></aside>}<section className="space-y-4"><h2 className="panel-heading">Saved context · {workspace.memories?.length || 0}</h2>{!workspace.memories?.length ? <div className="empty-state">No memories saved yet. Add only facts you want the team to retain.</div> : workspace.memories.map(memory => <article key={memory.id} className="panel"><p className="eyebrow">{memory.category}</p><h3 className="mt-3 text-xl font-semibold">{memory.title}</h3><p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-600">{memory.content}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Source: {memory.source}</p>{canManage && (confirmId === memory.id ? <div className="flex items-center gap-2"><span className="text-sm">Remove this memory?</span><button className="btn-secondary" disabled={pending} onClick={() => void mutate({ deleteMemoryId: memory.id })}>{pending ? 'Removing…' : 'Remove'}</button><button className="btn-quiet" disabled={pending} onClick={() => setConfirmId(null)}>Cancel</button></div> : <button className="btn-quiet" disabled={pending} onClick={() => setConfirmId(memory.id)}>Remove</button>)}</div></article>)}</section></div>}</main></WorkspaceShell>;
}
