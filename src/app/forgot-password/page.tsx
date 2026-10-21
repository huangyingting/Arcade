'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/auth/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to request a password reset.');
      setMessage(data.message || 'If this account is eligible, password reset instructions will be provided through your configured delivery channel.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to request a password reset.'); }
    finally { setPending(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">02 / Account recovery</p><h1 className="page-title mt-5">A way back<br />to your work.</h1></div>
    </section>
    <section className="auth-card"><h2 className="text-3xl font-semibold">Reset your password</h2><p className="mt-4 text-sm text-slate-500">Enter your account email. Contact your administrator if recovery delivery has not been configured.</p>{error && <p role="alert" className="status-error mt-5">{error}</p>}{message && <p role="status" className="status-success mt-5">{message}</p>}<form onSubmit={submit} className="mt-8 space-y-5"><label htmlFor="email" className="field-label block">Email<input id="email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} className="field mt-2 w-full" /></label><button className="btn-primary w-full" disabled={pending}>{pending ? 'Requesting…' : 'Request reset instructions'}</button></form><Link href="/auth" className="btn-quiet mt-5">Back to sign in</Link></section>
  </main>;
}
