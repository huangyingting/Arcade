'use client';

import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Trash2, RotateCcw } from 'lucide-react';

export default function TrashPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${params.workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setWorkspace(d.workspace));
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
  const trashed = allAssets.filter((a) => a.status === 'DELETED');
  const active = allAssets.filter((a) => a.status !== 'DELETED');

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trash ({trashed.length})</h1>
          <p className="text-xs text-slate-500">
            Deleted Arcades are kept here for 30 days before permanent removal and can be restored with 1 click.
          </p>
        </div>

        {trashed.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-slate-300" />
            <div className="mt-2 text-sm font-bold text-slate-900">Trash is empty</div>
          </div>
        ) : (
          <div className="space-y-3">
            {trashed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/40 p-4"
              >
                <div>
                  <span className="rounded bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                    {item.assetType} • IN TRASH
                  </span>
                  <div className="mt-1 text-sm font-bold text-slate-900">{item.name}</div>
                </div>
                <button
                  onClick={() => setStatus(item.assetType, item.id, 'PUBLISHED')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-900">Move Active Asset to Trash ({active.length})</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {active.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{item.assetType}</span>
                  <div className="text-xs font-bold text-slate-900">{item.name}</div>
                </div>
                <button
                  onClick={() => setStatus(item.assetType, item.id, 'DELETED')}
                  className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Move to Trash
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
