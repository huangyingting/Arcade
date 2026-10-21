'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Event = { id: string; assetTitle: string; assetType: string; eventType: string; createdAt: string; country?: string; deviceType?: string };
export default function InsightsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setEvents([]);
    void (async () => {
      try {
        const response = await fetch(`/api/analytics?workspaceSlug=${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load workspace analytics.');
        if (active) setEvents(data.events || []);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load analytics.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  const visible = events.filter(event => !filter || event.eventType === filter);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">03 / Audience insights</p><h1 className="page-title mt-3">Attention, observed.</h1><p className="page-intro mt-4">Recorded activity from your shared projects. No simulated visitors or sample events.</p></div><Link href={`/workspaces/${workspaceSlug}/impact-analysis`} className="btn-secondary">View engagement summary →</Link></header>
    {error && <p className="status-error" role="alert">{error}</p>}
    {loading ? <p role="status">Loading recorded activity…</p> : !error && <>
      <section className="mb-8 grid gap-4 sm:grid-cols-3">{[['Events returned', events.length], ['View events', events.filter(event => event.eventType === 'VIEW').length], ['Completion events', events.filter(event => event.eventType === 'COMPLETED').length]].map(([label, value]) => <div key={label} className="panel"><p className="text-sm text-slate-500">{label}</p><p className="stat-number mt-3">{value}</p></div>)}</section>
      <section className="panel"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><h2 className="panel-heading">Recent activity</h2><label htmlFor="event-filter" className="field-label flex items-center gap-3">Event type<select id="event-filter" className="field" value={filter} onChange={event => setFilter(event.target.value)}><option value="">All events</option>{Array.from(new Set(events.map(event => event.eventType))).map(type => <option key={type} value={type}>{type}</option>)}</select></label></div><p className="mb-5 text-sm text-slate-500">Counts describe the records returned by the service, not a lifetime total or unique audience.</p>
        {!visible.length ? <div className="empty-state"><h3 className="font-semibold">{events.length ? 'No events match this filter.' : 'Your audience story starts here.'}</h3><p className="mt-2 text-sm">Publish and share a project to collect real viewer activity.</p><Link className="btn-secondary mt-5" href={`/workspaces/${workspaceSlug}`}>Back to projects</Link></div> : <div className="overflow-x-auto"><table className="data-table w-full text-left"><thead><tr><th>Project</th><th>Event</th><th>Device</th><th>Recorded</th></tr></thead><tbody>{visible.map(event => <tr key={event.id}><td><span className="block font-medium">{event.assetTitle || 'Untitled project'}</span><span className="text-xs text-slate-500">{event.assetType}</span></td><td>{event.eventType}</td><td>{event.deviceType || 'Not recorded'}</td><td className="whitespace-nowrap">{new Date(event.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </main></WorkspaceShell>;
}
