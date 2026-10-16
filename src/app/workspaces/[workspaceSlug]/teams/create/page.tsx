'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CreateTeamPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const router = useRouter();
  const [name, setName] = useState('Cloud Architecture GTM');
  const [visibility, setVisibility] = useState<'workspace' | 'private'>('workspace');
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);

  async function handleCreateTeam() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const teamSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await fetch(`/api/workspaces/${params.workspaceSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createTeamName: name.trim(), visibility }),
      });
      router.push(`/workspaces/${params.workspaceSlug}/teams/${teamSlug}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-xl px-8 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Create a Team — Step {step} of 2
          </h1>
          {step === 1 ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500">Team Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Continue to Permissions <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-600">
                Choose default visibility for Interactive Demos, AI Videos, and Visuals created in{' '}
                <strong>{name}</strong>.
              </p>
              <div className="space-y-2">
                {[
                  {
                    id: 'workspace',
                    label: 'Workspace-Wide Access',
                    desc: 'All workspace members can view and collaborate on assets in this team.',
                  },
                  {
                    id: 'private',
                    label: 'Invite-Only Team Vault',
                    desc: 'Only explicitly assigned team members can edit assets in this team.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisibility(opt.id as 'workspace' | 'private')}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      visibility === opt.id
                        ? 'border-indigo-600 bg-indigo-50/60'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      {opt.label}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreateTeam}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creating Team...' : 'Create Team & Open Library'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
