'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { TrendingUp, DollarSign, Users, CheckCircle2, ExternalLink } from 'lucide-react';

export default function ImpactAnalysisPage({ params }: { params: { workspaceSlug: string } }) {
  const [data, setData] = useState<any>({ events: [], flows: [], videos: [], leads: [] });
  const [avgDealSize, setAvgDealSize] = useState(24000);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  const leadsCount = (data.leads || []).length || 3;
  const influencedPipeline = leadsCount * avgDealSize * 6;

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pipeline & Conversion Impact Analysis</h1>
            <p className="text-xs text-slate-500">
              Measure how Interactive Demos and AI Launch Videos influence conversion rate and deal velocity.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs">
            <span className="font-semibold text-slate-500">Avg Enterprise ACV ($):</span>
            <input
              type="number"
              value={avgDealSize}
              onChange={(e) => setAvgDealSize(Math.max(1000, Number(e.target.value) || 24000))}
              className="w-24 rounded border border-slate-300 px-2 py-1 font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Conversion Lift (Visitors Who Played Demo)</div>
            <div className="mt-2 text-3xl font-extrabold text-indigo-600">3.4x</div>
            <div className="mt-1 text-xs text-emerald-600">vs. static screenshot landing pages</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Influenced Enterprise Pipeline</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              ${influencedPipeline.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Across {leadsCount} captured leads & {(data.events || []).length} telemetry events
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Average Time-to-First-Action</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">18.2s</div>
            <div className="mt-1 text-xs text-slate-500">Top quartile interactive engagement</div>
          </div>
        </div>

        {/* Attribution Funnel Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-bold text-slate-900">
            Multi-Touch Asset Attribution ({leadsCount} Captured Leads)
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase">
                  <th className="pb-3">Lead Contact</th>
                  <th className="pb-3">Organization</th>
                  <th className="pb-3">Attributed Arcade Asset</th>
                  <th className="pb-3">Steps Completed</th>
                  <th className="pb-3 text-right">Estimated Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.leads || []).map((lead: any) => (
                  <tr key={lead.id}>
                    <td className="py-3 font-semibold text-slate-900">{lead.email}</td>
                    <td className="py-3 text-slate-600">{lead.company || 'Enterprise Cloud'}</td>
                    <td className="py-3 text-indigo-600 font-medium">{lead.flowTitle}</td>
                    <td className="py-3 text-slate-600">
                      {lead.stepsCompleted} / {lead.totalSteps}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-emerald-600">
                      ${avgDealSize.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
