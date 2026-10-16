'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Gift, Copy, Check, MailPlus, Sparkles } from 'lucide-react';

export default function ReferPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [referralUrl, setReferralUrl] = useState(
    'http://localhost:3000/invite/demo-invite-token-2026'
  );
  const [generating, setGenerating] = useState(false);
  const [claimedToast, setClaimedToast] = useState('');

  async function handleGenerateReferralInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.acceptUrl) {
        setReferralUrl(data.acceptUrl);
      }
      // Credit +200 referral bonus into workspace ledger
      await fetch(`/api/workspaces/${params.workspaceSlug}/claim-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: 200,
          reason: `Referral invite sent to ${email.trim()} (+200 AI Studio credits)`,
        }),
      });
      setClaimedToast(`One-time invite created for ${email.trim()} & +200 AI Credits added to your ledger!`);
      setEmail('');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-2xl px-8 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Gift className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Give 200 AI Credits, Get 200 AI Credits
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Invite a teammate or fellow cloud architect with a cryptographic one-time invite link. Both workspaces receive +200 bonus AI Studio credits.
          </p>

          <form onSubmit={handleGenerateReferralInvite} className="mt-6 flex gap-2">
            <input
              type="email"
              required
              placeholder="teammate@genisisiq.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs"
            />
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <MailPlus className="h-3.5 w-3.5" />
              {generating ? 'Generating...' : 'Send Invite & Claim +200 Credits'}
            </button>
          </form>

          {claimedToast && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {claimedToast}
              </span>
              <Link
                href={`/workspaces/${params.workspaceSlug}/usage`}
                className="underline hover:text-emerald-950"
              >
                View Credit Ledger →
              </Link>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-[11px] font-semibold uppercase text-slate-400">
              Active One-Time Referral Invite Link
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="flex-1 bg-transparent px-2 font-mono text-xs text-slate-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(referralUrl);
                  setCopied(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
