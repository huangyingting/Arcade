'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function CreateTeamPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setRole(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load this workspace.');
        if (active) setRole(data.workspace.role);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to check workspace access.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  const canManage = role === 'OWNER' || role === 'ADMIN';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!canManage) return;
    setPending(true); setError('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ createTeamName: name.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create a team.');
      const team = data.team || data.workspace?.teams?.find((item: { name: string; slug: string }) => item.name === name.trim());
      if (!team?.slug) throw new Error('The team response was incomplete. Reload the workspace before trying again.');
      router.push(`/workspaces/${workspaceSlug}/teams/${team.slug}`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create a team.'); }
    finally { setPending(false); }
  }
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><p className="eyebrow">02 / Team workspace</p><h1 className="page-title mt-3">A team with a purpose.</h1><p className="page-intro mt-4">Organize walkthroughs around the people creating them.</p>{error && <p className="status-error mt-6" role="alert">{error}</p>}{role === null ? !error && <p className="mt-6" role="status">Checking workspace access…</p> : !canManage ? <p className="empty-state mt-8">Only workspace owners and administrators can create teams.</p> : <section className="panel mt-8 max-w-xl"><h2 className="panel-heading">Create a team</h2><p className="mt-3 text-sm text-slate-500">Teams organize projects within this workspace. Private team access policies are not available.</p><form onSubmit={submit} className="mt-6 space-y-6"><label htmlFor="team-name" className="field-label block">Team name<input id="team-name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Product, marketing, or your next initiative" className="field mt-2 w-full" disabled={pending} /></label><button className="btn-primary" disabled={pending || !name.trim()}>{pending ? 'Creating team…' : 'Create team →'}</button></form></section>}<Link href={`/workspaces/${workspaceSlug}`} className="btn-quiet mt-5">Back to workspace</Link></main></WorkspaceShell>;
}
