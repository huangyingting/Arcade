'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/workspaces/workspace-5p8xcsfv';

  const [email, setEmail] = useState('wlfjck@gmail.com');
  const [password, setPassword] = useState('arcade-demo-2026');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign-in failed.');
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Arcade</span>
        </Link>
        <Link
          href="/admin/invitations"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <KeyRound className="h-3.5 w-3.5 text-indigo-600" />
          Admin Invitations
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Invitation-Only Admission Mode
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in to Arcade</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create interactive demos, AI launch videos, and multi-channel visuals.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {pending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <div className="font-semibold text-slate-900">Invitation-Only Registration</div>
            <p className="mt-1">
              New accounts require a one-time invitation link from an administrator.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-3 font-semibold">
              <Link href="/register" className="text-indigo-600 hover:underline">
                Registration Policy →
              </Link>
              <Link
                href="/invite/demo-invite-token-2026"
                className="text-amber-700 hover:underline"
              >
                Try Demo Invite Link ↗
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignInPageInner />
    </Suspense>
  );
}
