'use client';

import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Users, Download, Plus } from 'lucide-react';

export default function LeadsPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [leads, setLeads] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  async function loadLeads() {
    const res = await fetch('/api/leads');
    const data = await res.json();
    setLeads(data.leads || []);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, company }),
    });
    setEmail('');
    setCompany('');
    loadLeads();
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Captured Leads & Audience Reveal</h1>
            <p className="text-xs text-slate-500">
              Prospects who completed Lead Capture chapters in your Interactive Demos.
            </p>
          </div>
          <form onSubmit={handleAddLead} className="flex gap-2">
            <input
              type="email"
              placeholder="lead@enterprise.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
            />
            <input
              type="text"
              placeholder="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Capture Lead
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase">
                <th className="pb-3">Contact Email</th>
                <th className="pb-3">Company</th>
                <th className="pb-3">Source Demo</th>
                <th className="pb-3">Steps Completed</th>
                <th className="pb-3">CRM Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="py-3.5 font-semibold text-slate-900">{lead.email}</td>
                  <td className="py-3.5 text-slate-600">{lead.company}</td>
                  <td className="py-3.5 text-slate-600">{lead.flowTitle}</td>
                  <td className="py-3.5 text-slate-600">
                    {lead.stepsCompleted} / {lead.totalSteps}
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Synced to HubSpot
                    </span>
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
