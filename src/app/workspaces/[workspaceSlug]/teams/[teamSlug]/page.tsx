'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Team = { id: string; slug: string; name: string; members?: Array<{ id: string; user: { name?: string; email?: string } }> };
type Flow = { id: string; teamId: string | null; name: string; status: string; updatedAt: string; shareId?: string };
export default function TeamLibraryPage({ params }: { params: Promise<{ workspaceSlug: string; teamSlug: string }> }) {
  const { workspaceSlug, teamSlug } = use(params);
  const [workspace, setWorkspace] = useState<{ teams: Team[]; flows: Flow[]; role: string } | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load this team.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load the team library.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  const team = workspace?.teams.find(item => item.slug === teamSlug);
  const flows = workspace?.flows.filter(flow => flow.teamId === team?.id && flow.status !== 'DELETED' && flow.status !== 'ARCHIVED' && flow.name.toLowerCase().includes(query.toLowerCase())) || [];
  const editable = workspace?.role !== 'VIEWER';
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8"><p className="eyebrow">02 / Team library</p><h1 className="page-title mt-3">{team?.name || 'Team library'}</h1><p className="page-intro mt-4">Walkthroughs explicitly assigned to this team. Workspace-wide videos, visuals, and collections stay in your main library.</p></header>{error ? <p role="alert" className="status-error">{error}</p> : !workspace ? <p role="status">Loading team library…</p> : !team ? <section className="empty-state"><h2 className="text-xl font-semibold">This team was not found.</h2><p className="mt-3 text-sm">The team may have been removed, or this address may be incorrect. No other team has been substituted.</p><Link href={`/workspaces/${workspaceSlug}`} className="btn-primary mt-5">Back to workspace</Link></section> : <><section className="panel"><div className="mb-6 flex flex-wrap items-end justify-between gap-5"><h2 className="panel-heading">Team walkthroughs</h2><label htmlFor="team-search" className="field-label">Search projects<input id="team-search" type="search" value={query} onChange={event => setQuery(event.target.value)} className="field mt-2 w-full" /></label></div>{!flows.length ? <div className="empty-state"><h3 className="font-semibold">{query ? 'No matching walkthroughs.' : 'A clear space for your team’s work.'}</h3><p className="mt-2 text-sm">Walkthroughs appear here when they are assigned to {team.name}.</p><Link href={`/workspaces/${workspaceSlug}`} className="btn-secondary mt-5">Open workspace projects →</Link></div> : <div className="divide-y divide-slate-200">{flows.map(flow => <article className="flex flex-wrap items-center justify-between gap-4 py-5" key={flow.id}><div><p className="eyebrow">{flow.status}</p><h3 className="mt-2 text-xl font-semibold">{flow.name}</h3><p className="mt-2 text-sm text-slate-500">Updated {new Date(flow.updatedAt).toLocaleDateString()}</p></div><div className="flex gap-2">{editable && <Link className="btn-secondary" href={`/flows/${flow.id}/edit`}>Open editor ↗</Link>}{flow.status === 'PUBLISHED' && flow.shareId && <Link className="btn-quiet" href={`/share/${flow.shareId}`}>View published</Link>}</div></article>)}</div>}</section><section className="panel mt-6"><h2 className="panel-heading">Team members</h2>{!team.members?.length ? <p className="mt-4 text-sm text-slate-500">No team members are recorded.</p> : <ul className="mt-4 space-y-3">{team.members.map(member => <li key={member.id} className="text-sm">{member.user.name || member.user.email || 'Member'}</li>)}</ul>}</section></>}</main></WorkspaceShell>;
}
