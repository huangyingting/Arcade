'use client';

import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Archive, RotateCcw } from 'lucide-react';

export default function ArchivePage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [workspace, setWorkspace] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/workspaces/${params.workspaceSlug}`);
    const data = await res.json();
    setWorkspace(data.workspace);
  }

  useEffect(() => {
    load();
  }, [params.workspaceSlug]);

  async function setStatus(assetType: 'FLOW' | 'VIDEO' | 'VISUAL', assetId: string, status: string) {
    const res = await fetch(`/api/workspaces/${params.workspaceSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetStatusChange: { assetType, assetId, status } }),
    });
    const data = await res.json();
    setWorkspace(data.workspace);
  }

  const allAssets = [
    ...(workspace?.flows || []).map((f: any) => ({ ...f, assetType: 'FLOW' as const })),
    ...(workspace?.promptVideos || []).map((v: any) => ({ ...v, assetType: 'VIDEO' as const })),
    ...(workspace?.visualProjects || []).map((vp: any) => ({ ...vp, assetType: 'VISUAL' as const })),
  ];
  const archived = allAssets.filter((a) => a.status === 'ARCHIVED');
  const active = allAssets.filter((a) => a.status !== 'ARCHIVED' && a.status !== 'DELETED');

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Archived Arcades ({archived.length})</h1>
          <p className="text-xs text-slate-500">
            Archived Interactive Demos, AI Videos, and Visual Projects appear here and remain restorable at any time.
          </p>
        </div>

        {archived.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Archive className="mx-auto h-8 w-8 text-slate-300" />
            <div className="mt-2 text-sm font-bold text-slate-900">No archived Arcades right now</div>
            <p className="mt-1 text-xs text-slate-500">
              You can archive any active Flow, AI Video, or Visual Project below to test restoration.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {archived.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-4"
              >
                <div>
                  <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    {item.assetType} • ARCHIVED
                  </span>
                  <div className="mt-1 text-sm font-bold text-slate-900">{item.name}</div>
                </div>
                <button
                  onClick={() => setStatus(item.assetType, item.id, 'PUBLISHED')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore to Workspace
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-900">Active Workspace Assets ({active.length})</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {active.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{item.assetType}</span>
                  <div className="text-xs font-bold text-slate-900">{item.name}</div>
                </div>
                <button
                  onClick={() => setStatus(item.assetType, item.id, 'ARCHIVED')}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Move to Archive
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
