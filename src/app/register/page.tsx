import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldAlert, KeyRound, ArrowLeft, LogIn } from 'lucide-react';
import { accountAdmissionMode } from '@/lib/account-admission';

export const metadata = {
  title: 'Create account — Arcade',
  description: 'Create an Arcade account via invitation.',
};

export default function RegisterPage() {
  const isPublic = accountAdmissionMode() === 'public';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span>Arcade</span>
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Start building interactive demos, AI launch videos, and social visuals.
        </p>

        {!isPublic ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-700" />
                <span>Invitation-Only Admission</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-800">
                Arcade is currently invitation-only. Use the personal one-time invitation link sent by an administrator to create your account.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-900">Have an invitation or testing the flow?</div>
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/invite/demo-invite-token-2026"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Open Seeded Invitation (/invite/demo-invite-token-2026)
                </Link>
                <Link
                  href="/admin/invitations"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Manage Invitations in Admin Console →
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <Link href="/signin" className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline">
                <LogIn className="h-3.5 w-3.5" /> Sign in to existing account
              </Link>
              <Link href="/" className="inline-flex items-center gap-1 hover:text-slate-900">
                <ArrowLeft className="h-3.5 w-3.5" /> Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-slate-600">
            Public registration is enabled.
          </div>
        )}
      </div>
    </main>
  );
}
