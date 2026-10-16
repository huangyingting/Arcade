'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  KeyRound,
  MailPlus,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Lock,
  Users,
} from 'lucide-react';

type BootstrapStatus = {
  needsBootstrap: boolean;
  adminCount: number;
  admins: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  }>;
  admissionMode: 'invitation-only' | 'public';
  envBootstrapConfigured: boolean;
  requiresSetupToken: boolean;
};

export default function AdminBootstrapPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('arcade-bootstrap-admin-2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function refreshStatus() {
    try {
      const res = await fetch('/api/auth/bootstrap');
      const data = await res.json();
      if (res.ok) setStatus(data);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          password,
          setupToken: setupToken.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not bootstrap administrator account.');
        return;
      }

      setSuccessMsg(
        `Administrator ${data.user.email} is ready! Signing in and opening Invitation Console...`
      );
      await refreshStatus();

      const authRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!authRes?.error) {
        router.push('/admin/invitations');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not bootstrap administrator account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-white flex flex-col">
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-[#0f1117]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">Arcade Studio</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
            Admin Bootstrap
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/admin/invitations"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5"
          >
            <MailPlus className="w-3.5 h-3.5 text-indigo-400" />
            Invitation Console
          </Link>
          <Link
            href="/auth"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#131620] border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center gap-2.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            Invite-Only Root Authority
          </div>
          <h1 className="text-2xl font-bold text-white">
            Bootstrap Administrator Account
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            In <code className="text-slate-200">invitation-only</code> mode, public sign-up is disabled.
            Provision or promote the root <strong className="text-white">Admin</strong> account here so it can log in and issue one-time invitations at <code className="text-slate-200">/admin/invitations</code>.
          </p>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-700/60 text-xs text-rose-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@arcade.software"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arcade Admin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrator Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {status && !status.needsBootstrap && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Bootstrap Setup Token (Required when an Admin already exists)
                </label>
                <input
                  type="password"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="BOOTSTRAP_ADMIN_TOKEN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading
                ? 'Bootstrapping Administrator...'
                : 'Bootstrap Admin & Open Invitation Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#131620] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Active Bootstrap Admins ({status?.adminCount ?? '…'})
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {status?.needsBootstrap ? 'Needs First Admin' : 'Bootstrapped'}
              </span>
            </div>

            <div className="space-y-2.5 mt-3">
              {status?.admins?.map((admin) => (
                <div
                  key={admin.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{admin.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-semibold">
                    {admin.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Admission Mode
              </span>
              <code className="text-emerald-300 font-mono">
                {status?.admissionMode || 'invitation-only'}
              </code>
            </div>
          </div>

          <div className="bg-[#131620] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              ReadWise-Compatible CLI Bootstrap
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto">
{`printf '%s\\n' 'StrongPass123!' | \\
  npm run bootstrap:admin -- \\
  --email admin@arcade.software \\
  --name "Root Admin" \\
  --password-stdin`}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
