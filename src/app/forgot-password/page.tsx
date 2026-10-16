'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('wlfjck@gmail.com');
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setResetUrl(data.resetUrl || null);
    setSubmitted(true);
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

        <h1 className="mt-6 text-2xl font-bold text-slate-900">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your account email and we will generate a one-time password reset link.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Reset link generated</span>
              </div>
              <p className="mt-1">
                If a password account exists for <strong>{email}</strong>, a one-time reset token is ready.
              </p>
              {resetUrl && (
                <Link
                  href={resetUrl}
                  className="mt-3 block break-all rounded-lg bg-white p-2.5 font-mono text-[11px] text-indigo-600 underline border border-emerald-200"
                >
                  {resetUrl}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Send reset link
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/signin" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
