'use client';

import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

export default function ConnectorsPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${params.workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setConnectors(d.workspace?.connectors || []));
  }, [params.workspaceSlug]);

  async function toggleConnector(id: string) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/workspaces/${params.workspaceSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleConnectorId: id }),
      });
      const data = await res.json();
      if (data.workspace?.connectors) {
        setConnectors(data.workspace.connectors);
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data & Knowledge Connectors</h1>
          <p className="text-xs text-slate-500">
            Connect GitHub, Notion, Linear, Figma, Slack, and Google Drive so Avery AI can generate accurate demos and launch videos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {connectors.map((c) => {
            const connected = c.status === 'CONNECTED';
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <div className="text-sm font-bold text-slate-900">{c.name}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-wider text-slate-400">
                    Provider: {c.provider}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      connected
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {connected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {c.status}
                  </span>
                  <button
                    onClick={() => toggleConnector(c.id)}
                    disabled={togglingId === c.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <RefreshCw className={`h-3 w-3 ${togglingId === c.id ? 'animate-spin' : ''}`} />
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WorkspaceShell>
  );
}
