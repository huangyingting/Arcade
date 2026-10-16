'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Coins, Check } from 'lucide-react';

export default function PurchaseCreditsPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const router = useRouter();
  const [buying, setBuying] = useState(false);

  async function handleBuy(credits: number) {
    setBuying(true);
    await fetch(`/api/workspaces/${params.workspaceSlug}/purchase-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits }),
    });
    router.push(`/workspaces/${params.workspaceSlug}/usage`);
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-4xl space-y-6 px-8 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase AI Studio Credits</h1>
          <p className="text-xs text-slate-500">
            Top up your workspace credit pool for AI Launch Videos (50 credits) and Multi-Format Visuals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { credits: 500, price: '$25', desc: '10 AI Launch Videos or Visual Campaigns' },
            { credits: 1500, price: '$65', desc: '30 AI Launch Videos + Brand Kit Crawls' },
            { credits: 5000, price: '$190', desc: 'Enterprise Launch Pack (never expires)' },
          ].map((pack) => (
            <div key={pack.credits} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <Coins className="h-6 w-6 text-amber-500" />
              <div className="mt-3 text-2xl font-extrabold text-slate-900">
                +{pack.credits.toLocaleString()} Credits
              </div>
              <div className="mt-1 text-lg font-bold text-indigo-600">{pack.price}</div>
              <p className="mt-2 text-xs text-slate-500">{pack.desc}</p>
              <button
                disabled={buying}
                onClick={() => handleBuy(pack.credits)}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Add {pack.credits} Credits Immediately
              </button>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
