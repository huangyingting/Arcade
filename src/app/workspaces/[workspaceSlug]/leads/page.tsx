'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Lead = { id: string; email: string; fullName?: string; company?: string; flowTitle?: string; createdAt: string; stepsCompleted: number; totalSteps: number };
export default function LeadsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setLeads([]);
    void (async () => {
      try {
        const response = await fetch(`/api/leads?workspaceSlug=${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load captured leads.');
        if (active) setLeads(data.leads || []);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load leads.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  const filtered = leads.filter(lead => `${lead.email} ${lead.fullName || ''} ${lead.company || ''}`.toLowerCase().includes(query.toLowerCase()));
  function download() {
    const cell = (value: unknown) => {
      const text = String(value ?? '');
      return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
    };
    const rows = [['Email', 'Name', 'Company', 'Project', 'Captured at'], ...filtered.map(lead => [lead.email, lead.fullName, lead.company, lead.flowTitle, lead.createdAt])];
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${workspaceSlug}-leads.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">05 / Captured leads</p><h1 className="page-title mt-3">People, not placeholders.</h1><p className="page-intro mt-4">Contacts submitted through your workspace’s project forms.</p></div><button className="btn-secondary" disabled={loading || !!error || !filtered.length} onClick={download}>Export visible leads</button></header>{error && <p role="alert" className="status-error">{error}</p>}{loading ? <p role="status">Loading captured leads…</p> : !error && <section className="panel"><div className="mb-6 flex flex-wrap items-end justify-between gap-5"><h2 className="panel-heading">{leads.length} captured {leads.length === 1 ? 'lead' : 'leads'}</h2><label htmlFor="lead-search" className="field-label">Find a contact<input id="lead-search" className="field mt-2 w-full" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email, or company" /></label></div>{!filtered.length ? <div className="empty-state"><h3 className="font-semibold">{leads.length ? 'No matching contacts.' : 'No leads captured yet.'}</h3><p className="mt-2 text-sm">Use a lead form in a published project to collect genuine viewer submissions.</p><Link className="btn-secondary mt-5" href={`/workspaces/${workspaceSlug}`}>Back to projects</Link></div> : <div className="overflow-x-auto"><table className="data-table w-full text-left"><thead><tr><th>Contact</th><th>Company</th><th>Project</th><th>Captured</th></tr></thead><tbody>{filtered.map(lead => <tr key={lead.id}><td><p className="font-medium">{lead.fullName || lead.email}</p>{lead.fullName && <p className="text-sm text-slate-500">{lead.email}</p>}</td><td>{lead.company || 'Not provided'}</td><td>{lead.flowTitle || 'Not recorded'}</td><td className="whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}<p className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500">CRM sync is not available. This page does not imply that contacts have been sent to an external service.</p></section>}</main></WorkspaceShell>;
}
