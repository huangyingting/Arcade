import React from 'react';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { ArrowRight, Plug } from 'lucide-react';

export default function IntegrationsPage() {
  const integrations = [
    { name: 'HubSpot CRM', category: 'CRM & Lead Sync', desc: 'Sync demo viewers, lead form captures, and step completion directly to HubSpot contacts.' },
    { name: 'Salesforce', category: 'CRM & Lead Sync', desc: 'Push interactive demo engagement and buyer intent signals to Salesforce Leads & Accounts.' },
    { name: 'Slack', category: 'Notifications', desc: 'Get real-time alerts in Slack when prospects view your demos or AI launch videos.' },
    { name: 'Google Analytics 4', category: 'Analytics', desc: 'Stream step-by-step funnel events and video retention metrics to GA4.' },
    { name: 'Segment', category: 'CDP', desc: 'Route viewer telemetry to your data warehouse and downstream marketing tools.' },
    { name: 'Intercom & Zendesk', category: 'Support & Docs', desc: 'Embed interactive guides directly inside support articles and chat widgets.' },
    { name: 'Notion & Confluence', category: 'Knowledge Base', desc: 'Paste any Arcade share URL to unfurl an interactive player inside Notion or Confluence.' },
    { name: 'Webflow & Framer', category: 'Website CMS', desc: 'Responsive iframe and JavaScript SDK embeds with automatic postMessage sizing.' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-950">Connect Arcade to your entire GTM stack</h1>
          <p className="mt-3 text-slate-600">
            Configure live integrations in your workspace settings or connect data sources for Avery AI.
          </p>
          <Link
            href="/workspaces/workspace-5p8xcsfv/settings/integrations"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Manage Workspace Integrations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map((intg) => (
            <div key={intg.name} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <Plug className="h-5 w-5 text-indigo-600" />
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {intg.category}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{intg.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{intg.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
