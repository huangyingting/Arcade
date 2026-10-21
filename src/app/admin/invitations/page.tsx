'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Invitation = {
  id: string; email: string; status: string; expiresAt: string; createdAt: string;
  acceptedAt?: string | null; revokedAt?: string | null;
  invitedBy?: { name: string | null; email?: string | null } | null;
};
export default function AdminInvitationsPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<{ id: string; action: 'rotate' | 'revoke' } | null>(null);

  async function loadInvitations() {
    const response = await fetch('/api/admin/invitations');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load invitations.');
    setInvitations(data.invitations || []);
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/me');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Sign in with a platform administrator account.');
        if (data.user?.role !== 'Admin') throw new Error('Only platform administrators can manage account invitations.');
        if (!active) return;
        setAllowed(true);
        await loadInvitations();
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load invitations.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!allowed) return;
    setPending(true); setError(''); setMessage(''); setLatestLink('');
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create an invitation.');
      setEmail(''); setExpiresAt('');
      setLatestLink(data.acceptUrl || '');
      setMessage('Invitation created. Deliver the one-time link securely to the recipient; this page does not send email.');
      await loadInvitations();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create an invitation.'); }
    finally { setPending(false); }
  }
  async function change() {
    if (!allowed || !confirm) return;
    const { id, action } = confirm;
    setPending(true); setError(''); setMessage(''); setLatestLink('');
    try {
      const response = await fetch(`/api/admin/invitations/${encodeURIComponent(id)}${action === 'rotate' ? '/rotate' : ''}`, { method: action === 'rotate' ? 'POST' : 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Unable to ${action} this invitation.`);
      setLatestLink(data.acceptUrl || ''); setConfirm(null);
      setMessage(action === 'rotate' ? 'A new one-time link was issued. The previous link is no longer valid.' : 'Invitation revoked.');
      await loadInvitations();
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update the invitation.'); }
    finally { setPending(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(latestLink); setMessage('Invitation link copied. Share it privately with the intended recipient.'); }
    catch { setError('Clipboard access failed. Select the link and copy it manually.'); }
  }
  return <main className="page-wrap">
    <header className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><Link href="/" className="text-2xl font-bold tracking-tight">Arcade.</Link><p className="eyebrow mt-10">00 / Platform administration</p><h1 className="page-title mt-3">An intentional invitation.</h1><p className="page-intro mt-4">Create and manage one-time account access. Workspace administration alone does not grant this permission.</p></div><Link href="/workspaces" className="btn-secondary">Back to workspaces</Link></header>
    {error && <p role="alert" className="status-error mb-5">{error}</p>}
    {message && <p role="status" className="status-success mb-5">{message}</p>}
    {loading ? <p role="status">Checking platform access…</p> : !allowed ? <section className="panel"><h2 className="panel-heading">Administrator access required</h2><p className="mt-4 text-sm text-slate-500">Initial platform administrators are provisioned by the deployment operator. There is no public administrator bootstrap page.</p><Link href="/auth" className="btn-primary mt-6">Sign in</Link></section> : <>
      <section className="panel"><h2 className="panel-heading">Create account invitation</h2><form onSubmit={create} className="mt-6 grid items-end gap-5 md:grid-cols-[1fr_1fr_auto]"><label htmlFor="recipient" className="field-label">Recipient email<input id="recipient" type="email" autoComplete="off" required maxLength={320} value={email} onChange={event => setEmail(event.target.value)} disabled={pending} className="field mt-2 w-full" /></label><label htmlFor="expiry" className="field-label">Expiry · optional<input id="expiry" type="datetime-local" value={expiresAt} onChange={event => setExpiresAt(event.target.value)} disabled={pending} className="field mt-2 w-full" /></label><button className="btn-primary" disabled={pending}>{pending ? 'Working…' : 'Create invitation →'}</button></form><p className="mt-4 text-sm text-slate-500">Leave expiry blank to use the server’s default. An invitation grants account registration, not a workspace role.</p>{latestLink && <div className="mt-6 border-t border-slate-200 pt-6"><label htmlFor="invitation-link" className="field-label block">One-time invitation link<input id="invitation-link" readOnly value={latestLink} className="field mt-2 w-full font-mono text-xs" onFocus={event => event.target.select()} /></label><p className="mt-3 text-xs text-slate-500">Treat this link as a secret. It is shown only when issued.</p><button className="btn-secondary mt-4" type="button" onClick={() => void copy()}>Copy link</button><button className="btn-quiet mt-4 ml-3" onClick={() => setLatestLink('')}>Hide link</button></div>}</section>
      <section className="panel mt-6"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="panel-heading">Invitation history</h2><button className="btn-quiet" disabled={pending} onClick={async () => { setPending(true); setError(''); try { await loadInvitations(); } catch (error) { setError(error instanceof Error ? error.message : 'Unable to refresh invitations.'); } finally { setPending(false); } }}>Refresh</button></div>{!invitations.length ? <div className="empty-state"><h3 className="font-semibold">No account invitations yet.</h3><p className="mt-2 text-sm">Issue a link when you are ready to bring someone in.</p></div> : <div className="overflow-x-auto"><table className="data-table w-full text-left"><thead><tr><th>Recipient</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead><tbody>{invitations.map(invitation => <tr key={invitation.id}><td><p className="font-medium">{invitation.email}</p><p className="mt-1 text-xs text-slate-500">Created {new Date(invitation.createdAt).toLocaleDateString()}</p></td><td><span className="tag">{invitation.status}</span></td><td className="whitespace-nowrap">{new Date(invitation.expiresAt).toLocaleString()}</td><td>{confirm?.id === invitation.id ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm">{confirm.action === 'rotate' ? 'Invalidate the old link?' : 'Revoke access from this link?'}</span><button className="btn-secondary" disabled={pending} onClick={() => void change()}>Confirm</button><button className="btn-quiet" disabled={pending} onClick={() => setConfirm(null)}>Cancel</button></div> : invitation.status.toUpperCase() !== 'ACCEPTED' && invitation.status.toUpperCase() !== 'REVOKED' ? <div className="flex flex-wrap gap-2"><button className="btn-quiet" disabled={pending} onClick={() => setConfirm({ id: invitation.id, action: 'rotate' })}>Replace link</button><button className="btn-quiet" disabled={pending} onClick={() => setConfirm({ id: invitation.id, action: 'revoke' })}>Revoke</button></div> : <span className="text-sm text-slate-500">No actions</span>}</td></tr>)}</tbody></table></div>}</section>
    </>}
  </main>;
}
