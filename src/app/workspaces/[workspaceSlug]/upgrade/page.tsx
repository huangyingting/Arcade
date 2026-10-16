'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Zap, Check } from 'lucide-react';

export default function UpgradePage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade(planTier: string) {
    setUpgrading(true);
    await fetch(`/api/workspaces/${params.workspaceSlug}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planTier }),
    });
    router.push(`/workspaces/${params.workspaceSlug}`);
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upgrade Workspace Plan</h1>
          <p className="text-xs text-slate-500">
            Unlock white-label embeds, 4K 60FPS video exports, branching chapters, and 2,500 monthly AI credits.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { tier: 'PRO', price: '$32/mo', credits: '1,000 credits/mo', features: ['Unbranded share player', '4K 60FPS Video export', '11 ElevenLabs voices'] },
            { tier: 'GROWTH', price: '$42/mo', credits: '2,500 credits/mo', features: ['Branching chapters', 'Lead capture & CRM sync', 'Team insights & Audience Reveal'] },
            { tier: 'ENTERPRISE', price: 'Custom', credits: '10,000 credits/mo', features: ['SAML 2.0 SSO & SCIM', 'Invite-Only Admission', 'Custom CNAME domains'] },
          ].map((p) => (
            <div key={p.tier} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
              <div>
                <div className="text-xs font-bold uppercase text-indigo-600">{p.tier}</div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{p.price}</div>
                <div className="mt-1 text-xs font-semibold text-emerald-600">{p.credits}</div>
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-indigo-600" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                disabled={upgrading}
                onClick={() => handleUpgrade(p.tier)}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Activate {p.tier} Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
