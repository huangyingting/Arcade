'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Loader2, ArrowUpRight } from 'lucide-react';

export function StudioHeader({ kind, name, onName, workspaceSlug, status, busy, canEdit, onSave, onPublish, shareUrl, children }: {
  kind: string; name: string; onName?: (name: string) => void; workspaceSlug?: string; status?: string;
  busy?: boolean; canEdit: boolean; onSave: () => void; onPublish?: () => void;
  shareUrl?: string; children?: React.ReactNode;
}) {
  return <header className="studio-header">
    <div className="flex min-w-0 flex-wrap items-center gap-4">
      <Link aria-label="Back to workspace" className="rounded-lg border border-slate-700 p-2.5 text-slate-300 hover:text-white" href={workspaceSlug ? `/workspaces/${workspaceSlug}` : '/workspaces'}><ArrowLeft size={17} /></Link>
      <div className="min-w-0"><p className="studio-label mb-1">{kind}</p>{onName && canEdit ? <input aria-label="Project name" value={name} onChange={(e) => onName(e.target.value)} className="w-full min-w-0 max-w-sm border-b border-transparent bg-transparent text-sm font-medium text-white focus:border-slate-500 focus:outline-none" maxLength={200} /> : <h1>{name || 'Loading project…'}</h1>}</div>
      {status && <span className={`rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${status === 'PUBLISHED' ? 'border-emerald-800 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>{status.toLowerCase()}</span>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {shareUrl && status === 'PUBLISHED' && <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-quiet !text-xs">View published<ArrowUpRight size={13} /></a>}
      {canEdit && <><button onClick={onSave} disabled={busy} className="btn-secondary !min-h-10 !px-3 !text-xs">{busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}Save</button>{onPublish && <button onClick={onPublish} disabled={busy} className="btn-primary !min-h-10 !px-4 !text-xs">{status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>}</>}
    </div>
  </header>;
}
