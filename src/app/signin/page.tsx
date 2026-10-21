'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      const requested = search.get('callbackUrl');
      const destination = requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\')
        ? requested
        : data.redirectUrl || '/workspaces';
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story [&_.page-title]:text-white [&_.page-intro]:text-slate-300 [&_.eyebrow]:text-orange-300">
        <Link href="/" className="text-2xl font-bold tracking-tight">Arcade<span className="text-orange-600">.</span></Link>
        <div className="my-auto py-16">
          <p className="eyebrow">01 / Your working studio</p>
          <h1 className="page-title mt-5">Show the product.<br />Tell the story.</h1>
          <p className="page-intro mt-6">A focused place for your walkthroughs, videos, and visual projects.</p>
        </div>
        <p className="text-sm text-slate-500">Your work. Your team. One workspace.</p>
      </section>
      <section className="auth-card">
        <Link href="/" className="inline-block text-xl font-bold lg:hidden">Arcade.</Link>
        <p className="eyebrow">Welcome back</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-3 text-sm text-slate-500">Use the account associated with your invitation.</p>
        {error && <p className="status-error mt-5" role="alert">{error}</p>}
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="field-label block" htmlFor="email">Email
            <input id="email" name="email" type="email" autoComplete="email" maxLength={320} required value={email} onChange={event => setEmail(event.target.value)} className="field mt-2 w-full" />
          </label>
          <label className="field-label block" htmlFor="password">Password
            <input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} className="field mt-2 w-full" />
          </label>
          <Link href="/forgot-password" className="inline-block text-sm underline underline-offset-4">Forgot password?</Link>
          <button className="btn-primary w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in →'}</button>
        </form>
        <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
          <p>New accounts are invitation-only. Ask your administrator for a registration link.</p>
          <Link href="/register" className="mt-3 inline-block text-slate-900 underline underline-offset-4">About account access</Link>
        </div>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return <Suspense fallback={<main className="page-wrap" role="status">Loading sign in…</main>}><SignInForm /></Suspense>;
}
