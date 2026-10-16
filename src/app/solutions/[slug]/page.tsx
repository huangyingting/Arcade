import React from 'react';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { ArrowRight, CheckCircle2, Layers, Play } from 'lucide-react';

export default function SolutionSlugPage({ params }: { params: { slug: string } }) {
  const solutionDetails: Record<
    string,
    { title: string; metric: string; metricLabel: string; useCases: string[] }
  > = {
    marketing: {
      title: 'Product Marketing & Launch Campaigns',
      metric: '3.4x',
      metricLabel: 'Higher landing page conversion rate',
      useCases: [
        'Embed interactive product tours directly on homepage & launch pages',
        'Generate 30s 60fps AI Launch Videos & 28 social visual formats from a single URL',
        'Capture qualified enterprise leads with in-player Chapter Forms',
      ],
    },
    sales: {
      title: 'Pre-Sales & Solutions Engineering',
      metric: '48%',
      metricLabel: 'Faster enterprise deal cycle velocity',
      useCases: [
        'Personalize prospect demos dynamically with {{company_name}} & {{first_name}} URL tokens',
        'Track account-level step completion and sync buyer intent to Salesforce & HubSpot',
        'Bundle multi-flow technical deep-dives into branded Collections',
      ],
    },
    enablement: {
      title: 'Customer Onboarding & Technical Enablement',
      metric: '36',
      metricLabel: 'Auto-translated languages & localized AI voiceovers',
      useCases: [
        'Auto-generate Dual-View Step-by-Step Documentation Guides from any Flow',
        'Synthesize localized ElevenLabs narration with custom acronym pronunciation rules',
        'Embed interactive guides inside Zendesk, Intercom, Notion, and Confluence',
      ],
    },
  };

  const detail = solutionDetails[params.slug] || solutionDetails.marketing;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="text-center">
          <span className="rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase text-indigo-700">
            Solutions • {params.slug}
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-950 sm:text-5xl">{detail.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Accelerate pipeline velocity, product launches, and user onboarding with interactive stories powered by your Brand Kit.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/workspaces/workspace-5p8xcsfv"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Open Workspace Studio <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/share/collections/whoami-showcase"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Live Showcase Collection ↗
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 rounded-3xl border border-slate-200 bg-slate-50 p-8">
          <div className="flex flex-col justify-center rounded-2xl bg-slate-950 p-6 text-white">
            <div className="text-4xl font-extrabold text-[#D4AF37]">{detail.metric}</div>
            <div className="mt-2 text-sm text-slate-300">{detail.metricLabel}</div>
          </div>
          <div className="md:col-span-2 space-y-3 my-auto">
            <h2 className="text-lg font-bold text-slate-900">Key Capabilities for {detail.title}</h2>
            {detail.useCases.map((uc) => (
              <div key={uc} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <span>{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
