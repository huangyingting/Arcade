'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState('jack wolf');
  const [role, setRole] = useState('Product Marketing & Solutions Architecture');
  const [useCase, setUseCase] = useState('Launch Videos & Interactive Demos');
  const [saving, setSaving] = useState(false);

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, useCase }),
    });
    const data = await res.json();
    router.push(data.redirectUrl || '/workspaces/workspace-5p8xcsfv');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <Sparkles className="h-4 w-4" />
          <span>Welcome to Arcade</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Let’s personalize your workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tell us how you plan to use Arcade so Avery AI can tailor your Brand Kit and templates.
        </p>

        <form onSubmit={handleFinish} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Primary Role</label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {[
                'Product Marketing & Solutions Architecture',
                'Product Management',
                'Sales & Pre-Sales Engineering',
                'Customer Enablement & Docs',
              ].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-xl border p-3 text-left text-xs font-medium transition ${
                    role === r
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Primary Goal</label>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {[
                'Launch Videos & Interactive Demos',
                'Website Product Tours',
                'Social & Changelog Visuals',
              ].map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUseCase(u)}
                  className={`rounded-xl border p-3 text-left text-xs font-medium transition ${
                    useCase === u
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {saving ? 'Saving preferences...' : 'Enter Workspace'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
