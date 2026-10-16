'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  MailPlus,
  RefreshCw,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

type Invitation = {
  id: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  invitedBy?: { id: string; name: string | null; email?: string | null } | null;
  acceptedBy?: { id: string; name: string | null; email?: string | null } | null;
};

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [pending, setPending] = useState(false);
  const [rowPending, setRowPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [copied, setCopied] = useState(false);

  async function loadInvitations() {
    const res = await fetch('/api/admin/invitations');
    const data = await res.json();
    if (data.invitations) setInvitations(data.invitations);
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError('');
    setLatestLink('');
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create invitation.');
        return;
      }
      setEmail('');
      setExpiresAt('');
      if (data.acceptUrl) {
        setLatestLink(data.acceptUrl);
        setCopied(false);
      }
      await loadInvitations();
    } finally {
      setPending(false);
    }
  }

  async function handleRotate(id: string) {
    setRowPending(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/invitations/${encodeURIComponent(id)}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not rotate invitation.');
        return;
      }
      if (data.acceptUrl) {
        setLatestLink(data.acceptUrl);
        setCopied(false);
      }
      await loadInvitations();
    } finally {
      setRowPending(null);
    }
  }

  async function handleRevoke(id: string) {
    setRowPending(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/invitations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not revoke invitation.');
        return;
      }
      await loadInvitations();
    } finally {
      setRowPending(null);
    }
  }

  async function copyLink() {
    if (!latestLink) return;
    await navigator.clipboard.writeText(latestLink);
    setCopied(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/workspaces/workspace-5p8xcsfv"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Workspace
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>Account Invitations (Invitation-Only Admission)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/admin/bootstrap"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Bootstrap Admin
            </Link>
            <Link
              href="/invite/demo-invite-token-2026"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100"
            >
              Test Seeded Invite (/invite/demo-invite-token-2026) <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/signin"
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Sign in page
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        {/* Create Invitation Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Create one-time invitation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Send a one-time registration link. Invitations expire after 7 days unless you choose a custom expiry date.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="architect@genisisiq.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Custom Expiry (Optional)
              </label>
              <input
                name="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <MailPlus className="h-4 w-4" />
                {pending ? 'Creating link...' : 'Create invitation'}
              </button>
            </div>
          </form>

          {latestLink && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  One-time invitation link ready (shown only once):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <Link
                    href={new URL(latestLink).pathname}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    Open Invite Page ↗
                  </Link>
                </div>
              </div>
              <div className="mt-2 break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-800">
                {latestLink}
              </div>
            </div>
          )}
        </section>

        {/* Invitations Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account Invitations Ledger</h2>
              <p className="text-xs text-slate-500">
                Rotate a pending invitation to generate a fresh one-time link or revoke it immediately.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {invitations.length} total
            </span>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Invited By</th>
                  <th className="pb-3 pr-4">Expires</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pr-4 font-medium text-slate-900">{inv.email}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'REVOKED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-600">
                      {inv.invitedBy?.name || 'jack wolf'}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      {inv.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={rowPending === inv.id}
                            onClick={() => handleRotate(inv.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Rotate link
                          </button>
                          <button
                            type="button"
                            disabled={rowPending === inv.id}
                            onClick={() => handleRevoke(inv.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <UserX className="h-3 w-3" />
                            Revoke
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {inv.status === 'ACCEPTED' ? 'Claimed' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
