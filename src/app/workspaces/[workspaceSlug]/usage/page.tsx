'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Coins } from 'lucide-react';

export default function UsagePage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${params.workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setWorkspace(d.workspace));
  }, [params.workspaceSlug]);

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Studio Credit Usage Ledger</h1>
            <p className="text-xs text-slate-500">
              Every Brand Kit crawl, AI Launch Video render, and Visuals batch is logged transparently.
            </p>
          </div>
          <Link
            href={`/workspaces/${params.workspaceSlug}/purchase-credits`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
          >
            <Coins className="h-3.5 w-3.5" /> Purchase More Credits
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase">
                <th className="pb-3">Action</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3 text-right">Credits Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(workspace?.creditTransactions || []).map((tx: any) => (
                <tr key={tx.id}>
                  <td className="py-3 font-semibold text-slate-900">{tx.actionType}</td>
                  <td className="py-3 text-slate-600">{tx.description}</td>
                  <td className="py-3 text-slate-500">{tx.actorEmail}</td>
                  <td
                    className={`py-3 text-right font-mono font-bold ${
                      tx.creditsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.creditsDelta >= 0 ? `+${tx.creditsDelta}` : tx.creditsDelta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspaceShell>
  );
}
