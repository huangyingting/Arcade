'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Invitation = { status: string; maskedEmail?: string; email?: string; expiresAt?: string };

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/auth/invitation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This invitation could not be verified.');
        if (active) { setInvitation(data.invitation); setEmail(data.invitation?.email || ''); }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to check this invitation.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [token]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setPending(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to accept this invitation.');
      router.replace(data.redirectUrl || '/welcome'); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create your account.'); }
    finally { setPending(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story [&_.page-title]:text-white [&_.page-intro]:text-slate-300 [&_.eyebrow]:text-orange-300">
      <Link href="/" className="text-2xl font-bold">Arcade.</Link>
      <div className="py-16"><p className="eyebrow">01 / You’re invited</p><h1 className="page-title mt-5">Your next story<br />starts here.</h1><p className="page-intro mt-6">Create your account, then bring your product into focus.</p></div>
    </section>
    <section className="auth-card">
      <h2 className="text-3xl font-semibold">Accept your invitation</h2>
      {error && <p role="alert" className="status-error mt-5">{error}</p>}
      {loading ? <p role="status" className="mt-6">Checking invitation…</p> : invitation?.status?.toLowerCase() === 'pending' ? <>
        <p className="mt-4 text-sm text-slate-500">Invited as {invitation.maskedEmail || 'the email on this invitation'}. {invitation.expiresAt && `Expires ${new Date(invitation.expiresAt).toLocaleDateString()}.`}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="name" className="field-label block">Name<input id="name" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} className="field mt-2 w-full" /></label>
          <label htmlFor="email" className="field-label block">Invited email<input id="email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} className="field mt-2 w-full" /></label>
          <label htmlFor="password" className="field-label block">Password · at least 12 characters<input id="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="field mt-2 w-full" /></label>
          <label htmlFor="confirmation" className="field-label block">Confirm password<input id="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="field mt-2 w-full" /></label>
          <button className="btn-primary w-full" disabled={pending}>{pending ? 'Creating account…' : 'Create account →'}</button>
        </form>
      </> : <p className="empty-state mt-6">This invitation is {invitation?.status || 'unavailable'}. Ask your administrator for a new link.</p>}
      <Link href="/auth" className="btn-quiet mt-5">Already a member? Sign in</Link>
    </section>
  </main>;
}
