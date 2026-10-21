'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Analytics = {
  events: Array<{ id: string; assetId: string; eventType: string }>;
  flows: Array<{ id: string; name: string }>;
  leads: Array<{ id: string; flowId: string }>;
};
export default function ImpactAnalysisPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setData(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/analytics?workspaceSlug=${encodeURIComponent(workspaceSlug)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load engagement data.');
        if (active) setData({ leads: result.leads || [], events: result.events || [], flows: result.flows || [] });
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load engagement data.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  const flows = data?.flows.filter(flow => data.events.some(event => event.assetId === flow.id) || data.leads.some(lead => lead.flowId === flow.id)) || [];
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap">
    <header className="mb-8"><p className="eyebrow">04 / Engagement summary</p><h1 className="page-title mt-3">Evidence, not estimates.</h1><p className="page-intro mt-4">Review recorded project activity without invented pipeline value or conversion lift.</p></header>
    {error ? <p role="alert" className="status-error">{error}</p> : !data ? <p role="status">Loading workspace engagement…</p> : <>
      <section className="mb-8 grid gap-4 sm:grid-cols-2"><div className="panel"><p className="text-sm text-slate-500">Captured lead records returned</p><p className="stat-number mt-3">{data.leads.length}</p></div><div className="panel"><p className="text-sm text-slate-500">Recorded events returned</p><p className="stat-number mt-3">{data.events.length}</p></div></section>
      <section className="panel"><h2 className="panel-heading">Walkthrough engagement</h2><p className="mt-3 text-sm text-slate-500">Counts below summarize the recent records returned by the service. They are not lifetime totals or a conversion-rate calculation.</p>
        {!flows.length ? <div className="empty-state mt-6"><h3 className="font-semibold">No walkthrough engagement recorded yet.</h3><p className="mt-2 text-sm">Share a published walkthrough to start collecting real viewer activity.</p><Link className="btn-secondary mt-5" href={`/workspaces/${workspaceSlug}`}>Go to projects →</Link></div> :
          <div className="mt-6 overflow-x-auto"><table className="data-table w-full text-left"><thead><tr><th>Walkthrough</th><th>View events</th><th>Completion events</th><th>Captured leads</th></tr></thead><tbody>{flows.map(flow => <tr key={flow.id}><td className="font-medium">{flow.name}</td><td>{data.events.filter(event => event.assetId === flow.id && event.eventType === 'VIEW').length}</td><td>{data.events.filter(event => event.assetId === flow.id && event.eventType === 'COMPLETED').length}</td><td>{data.leads.filter(lead => lead.flowId === flow.id).length}</td></tr>)}</tbody></table></div>}
      </section>
      <aside className="mt-6 border-l-2 border-orange-700 pl-5"><h2 className="font-semibold">Revenue attribution is not connected.</h2><p className="mt-2 text-sm text-slate-500">CRM opportunities and revenue are unavailable. Activity alone does not establish deal influence, causation, or conversion improvement.</p></aside>
    </>}
  </main></WorkspaceShell>;
}
