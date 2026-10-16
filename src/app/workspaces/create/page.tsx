'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('GenisisIQ Cloud Architecture');
  const [slug, setSlug] = useState('workspace-genisisiq');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    router.push(`/workspaces/${data.workspace?.slug || 'workspace-5p8xcsfv'}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link
          href="/workspaces/workspace-5p8xcsfv"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jack wolf&apos;s workspace
        </Link>

        <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Create a new workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Workspaces have dedicated Brand Kits, team permissions, and 350 monthly AI credits.
        </p>

        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(
                  'workspace-' +
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                );
              }}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">Workspace URL Slug</label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="text-slate-400">app.arcade.software/workspaces/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="flex-1 bg-transparent font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {creating ? 'Creating workspace...' : 'Create Workspace'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
