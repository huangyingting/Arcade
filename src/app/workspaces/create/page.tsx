'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const response = await fetch('/api/workspaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create this workspace.');
      if (!data.workspace?.slug) throw new Error('The workspace response was incomplete. Please return to your workspace list.');
      router.push(`/workspaces/${data.workspace.slug}`); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create this workspace.'); }
    finally { setPending(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.page-intro]:text-slate-300 [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">01 / A place to build</p><h1 className="page-title mt-5">Give your work<br />a home.</h1><p className="page-intro mt-6">Keep your projects, brand direction, and team in one place.</p></div>
    </section>
    <section className="auth-card">
      <h2 className="text-3xl font-semibold">Create a workspace</h2>
      <p className="mt-4 text-sm text-slate-500">Start with a name. You can change it in workspace settings later.</p>
      {error && <p role="alert" className="status-error mt-5">{error}</p>}
      <form onSubmit={submit} className="mt-8 space-y-6">
        <label htmlFor="name" className="field-label block">Workspace name<input id="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Your company or project" className="field mt-2 w-full" /></label>
        <button className="btn-primary w-full" disabled={pending || !name.trim()}>{pending ? 'Creating workspace…' : 'Create workspace →'}</button>
      </form>
      <Link href="/workspaces" className="btn-quiet mt-5">Back to workspaces</Link>
    </section>
  </main>;
}
