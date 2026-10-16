'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ResetPasswordPage({
  params: rawParams,
}: {
  params: Promise<{ token: string }>;
}) {
  const params = React.use(rawParams);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const res = await fetch('/api/auth/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Reset failed.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/signin'), 1200);
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
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Choose a new password</h1>

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="inline h-4 w-4 mr-1 text-emerald-600" />
            Password updated! Redirecting to sign in...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                New Password (12–128 chars)
              </label>
              <input
                type="password"
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Confirm New Password
              </label>
              <input
                type="password"
                minLength={12}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Save new password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
