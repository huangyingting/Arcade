'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

export default function BenchmarksPage() {
  const [monthlyVisitors, setMonthlyVisitors] = useState(10000);
  const staticLeads = Math.round(monthlyVisitors * 0.018);
  const interactiveLeads = Math.round(monthlyVisitors * 0.062);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="text-center">
          <span className="rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-bold uppercase text-indigo-700">
            2026 Research Report • 45,000+ Interactive Demos & Launch Videos
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-950 sm:text-5xl">
            2026 Interactive Demo & AI Video Benchmarks
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Empirical conversion, completion, and engagement telemetry across B2B SaaS, Cloud Security, and GenAI product launches.
          </p>
        </div>

        {/* Benchmark Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            { metric: '3.4x', label: 'Website Conversion Lift', sub: 'Interactive Flow vs. Static Screenshots' },
            { metric: '78.4%', label: 'Top-Quartile Completion', sub: '5–8 Step Guided Walkthroughs' },
            { metric: '62s', label: 'Time-to-First-Publish', sub: 'Using Autonomous Brand Kit + AI Video' },
            { metric: '+41%', label: 'Social CTR Improvement', sub: 'Bauhaus Kinetic Video vs. Static Banner' },
          ].map((b) => (
            <div key={b.label} className="rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="text-3xl font-extrabold text-indigo-600">{b.metric}</div>
              <div className="mt-2 text-sm font-bold text-slate-900">{b.label}</div>
              <div className="mt-1 text-xs text-slate-500">{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Interactive Conversion Calculator */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Interactive ROI & Lead Lift Calculator</h2>
              <p className="text-xs text-slate-500">
                Slide or enter your monthly landing page visitors to compare static pages vs. embedded Arcade Interactive Flows.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Monthly Visitors:</span>
              <input
                type="number"
                value={monthlyVisitors}
                onChange={(e) => setMonthlyVisitors(Math.max(500, Number(e.target.value) || 10000))}
                className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-bold"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-xs font-semibold uppercase text-slate-400">Before Arcade (1.8% CVR)</div>
              <div className="mt-2 text-3xl font-extrabold text-slate-700">
                {staticLeads.toLocaleString()} Leads / mo
              </div>
              <p className="mt-1 text-xs text-slate-500">Passive static screenshots & gated PDF forms</p>
            </div>
            <div className="rounded-2xl border-2 border-indigo-600 bg-white p-6">
              <div className="text-xs font-bold uppercase text-indigo-600">With Arcade Interactive Flow (6.2% CVR)</div>
              <div className="mt-2 text-3xl font-extrabold text-indigo-600">
                {interactiveLeads.toLocaleString()} Leads / mo (+{(interactiveLeads - staticLeads).toLocaleString()})
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Interactive hotspots + in-player Chapter Lead Capture
              </p>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
