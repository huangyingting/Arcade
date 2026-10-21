'use client';

import { use, useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Workspace = { monthlyCreditsQuota: number; bonusCreditsBalance: number; usedCreditsThisCycle: number; creditTransactions: Array<{ id: string; actionType: string; description: string; actorEmail?: string; creditsDelta: number; createdAt: string }> };
export default function UsagePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load workspace usage.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load usage.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8"><p className="eyebrow">09 / Usage ledger</p><h1 className="page-title mt-3">Every credit, accounted for.</h1><p className="page-intro mt-4">Recorded balances and transactions for this workspace. Online credit purchases are not available.</p></header>{error ? <p role="alert" className="status-error">{error}</p> : !workspace ? <p role="status">Loading workspace usage…</p> : <><section className="mb-8 grid gap-4 sm:grid-cols-3">{[['Monthly quota', workspace.monthlyCreditsQuota], ['Used this cycle', workspace.usedCreditsThisCycle], ['Bonus balance', workspace.bonusCreditsBalance]].map(([label, amount]) => <div className="panel" key={label}><p className="text-sm text-slate-500">{label}</p><p className="stat-number mt-3">{amount}</p></div>)}</section><section className="panel"><h2 className="panel-heading">Transaction history</h2>{!workspace.creditTransactions?.length ? <div className="empty-state mt-6"><h3 className="font-semibold">No credit transactions yet.</h3><p className="mt-2 text-sm">Credit activity will appear when it is recorded by the service.</p></div> : <div className="mt-6 overflow-x-auto"><table className="data-table w-full text-left"><thead><tr><th>Action</th><th>Description</th><th>Actor</th><th>Credits</th><th>Recorded</th></tr></thead><tbody>{workspace.creditTransactions.map(transaction => <tr key={transaction.id}><td>{transaction.actionType}</td><td>{transaction.description}</td><td>{transaction.actorEmail || 'Not recorded'}</td><td className="font-mono">{transaction.creditsDelta > 0 ? '+' : ''}{transaction.creditsDelta}</td><td className="whitespace-nowrap">{new Date(transaction.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</section></>}</main></WorkspaceShell>;
}
