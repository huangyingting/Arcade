'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function WelcomePage() {
  const [account, setAccount] = useState<{ user: { name?: string | null }; workspaces: Array<{ id: string; slug: string; name: string }> } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Please sign in to continue.');
        if (active) setAccount(data);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load your account.'); }
    })();
    return () => { active = false; };
  }, []);
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.page-intro]:text-slate-300 [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">01 / Make room for good work</p><h1 className="page-title mt-5">Your product.<br />A new perspective.</h1><p className="page-intro mt-6">Start with one story. Build a workspace around it.</p></div>
    </section>
    <section className="auth-card">
      <h2 className="text-3xl font-semibold">{account?.user.name ? `Welcome, ${account.user.name}` : 'Welcome to Arcade'}</h2>
      {error ? <><p role="alert" className="status-error mt-5">{error}</p><Link href="/auth" className="btn-primary mt-5">Sign in</Link></> : !account ? <p role="status" className="mt-6">Loading your account…</p> : <>
        <p className="mt-5 text-slate-600">Choose where to work. Your projects stay connected to the workspace you create or join.</p>
        <div className="mt-6 space-y-3">{account.workspaces.map(workspace => <Link key={workspace.id} href={`/workspaces/${workspace.slug}`} className="btn-secondary flex justify-between">{workspace.name}<span aria-hidden="true">↗</span></Link>)}</div>
        <Link href="/workspaces/create" className="btn-primary mt-6">{account.workspaces.length ? 'Create another workspace' : 'Create your first workspace →'}</Link>
      </>}
    </section>
  </main>;
}
