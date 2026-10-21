'use client';

import { use, useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setPending(true);
    try {
      const response = await fetch('/api/auth/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reset your password.');
      setDone(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to reset your password.'); }
    finally { setPending(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">03 / A fresh start</p><h1 className="page-title mt-5">Make it<br />yours again.</h1></div>
    </section>
    <section className="auth-card">
      <h2 className="text-3xl font-semibold">Choose a new password</h2>
      {error && <p role="alert" className="status-error mt-5">{error}</p>}
      {done ? <div className="mt-6"><p className="status-success" role="status">Your password has been updated.</p><Link className="btn-primary mt-6" href="/auth">Sign in →</Link></div> :
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label htmlFor="password" className="field-label block">New password<input id="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="field mt-2 w-full" /></label>
          <p className="text-sm text-slate-500">Use at least 12 characters.</p>
          <label htmlFor="confirmation" className="field-label block">Confirm password<input id="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="field mt-2 w-full" /></label>
          <button className="btn-primary w-full" disabled={pending}>{pending ? 'Updating…' : 'Update password'}</button>
          <Link href="/forgot-password" className="btn-quiet">Request a new reset link</Link>
        </form>}
    </section>
  </main>;
}
