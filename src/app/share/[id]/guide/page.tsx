'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, ExternalLink, CheckCircle2 } from 'lucide-react';

const toPct = (v: number | undefined, fallback = 50) => {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return v <= 1 && v >= 0 ? Math.round(v * 1000) / 10 : v;
};

export default function PublicGuidePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [flow, setFlow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/flows/${id}`);
      const data = await res.json();
      if (data.flow) {
        setFlow(data.flow);
        setSteps(JSON.parse(data.flow.stepsJson || '[]'));
      }
    }
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href={`/share/${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Interactive Player
          </Link>
          <h1 className="text-base font-bold text-slate-900">
            {flow?.name || 'whoami.genisisiq.com'} — Step-by-Step Guide
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF / Print
          </button>
          <a
            href="https://whoami.genisisiq.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            Open Live Site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Auto-Derived Step-by-Step Architecture Guide ({steps.length} Steps)
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            {flow?.name || 'whoami.genisisiq.com Interactive Tour'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {flow?.description ||
              'Complete step-by-step walkthrough of Yi-Ting Huang’s AI & Cloud Solutions Architecture portfolio.'}
          </p>

          <div className="mt-10 space-y-10">
            {steps.map((step, idx) => (
              <section key={step.id || idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-amber-400">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {step.hotspots?.[0]?.tooltipText ||
                    step.hotspots?.[0]?.calloutText ||
                    step.voiceover?.script ||
                    step.chapter?.subtitle}
                </p>
                <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                  <img
                    src={step.mediaUrl || step.imageUrl || '/media/scene1.png'}
                    alt={step.title}
                    className="w-full object-cover"
                  />
                  {step.hotspots?.[0] && (
                    <div
                      style={{
                        left: `${toPct(step.hotspots[0].x, 50)}%`,
                        top: `${toPct(step.hotspots[0].y, 50)}%`,
                      }}
                      className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#D4AF37] shadow-lg"
                    />
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
