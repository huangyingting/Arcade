'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

type InvitationView = {
  id: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'invalid';
  maskedEmail: string | null;
  email?: string;
  expiresAt: string | null;
};

export default function InvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setInvitation(data.invitation);
        if (data.invitation?.email) {
          setEmail(data.invitation.email);
        }
      })
      .catch(() => {
        if (active) setError('The invitation could not be checked.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }

    setPending(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The invitation could not be accepted.');
        return;
      }
      router.push(data.redirectUrl || '/welcome');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'The invitation could not be accepted.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Arcade</span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">Accept your invitation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Create your password to finish joining Arcade.
        </p>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Checking invitation…</span>
          </div>
        ) : invitation?.status !== 'pending' ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {invitation?.status === 'accepted'
                  ? 'This invitation has already been used.'
                  : invitation?.status === 'revoked'
                  ? 'This invitation was revoked by an administrator.'
                  : invitation?.status === 'expired'
                  ? 'This invitation has expired.'
                  : 'This invitation is invalid or no longer active.'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <Link href="/signin" className="font-semibold text-indigo-600 hover:underline">
                Go to Sign in →
              </Link>
              <Link href="/admin/invitations" className="text-slate-600 hover:underline">
                Generate new invite in Admin Console
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                This invitation is active for <strong>{invitation.maskedEmail}</strong>.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                autoComplete="name"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Invited Email <span className="text-rose-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={320}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter the exact email address that received this invitation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Password <span className="text-rose-500">*</span>
              </label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 12 characters"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {pending ? 'Creating account...' : 'Accept invitation'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
