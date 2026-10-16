'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  const plans = [
    {
      name: 'Free',
      price: 0,
      desc: 'For individuals creating their first interactive product demos and AI launch videos.',
      cta: 'Current Plan',
      href: '/workspaces/workspace-5p8xcsfv',
      features: [
        '3 published Interactive Demos',
        '350 AI Studio credits / month',
        '1 Autonomous Brand Kit extraction',
        '720p & 1080p MP4 Video export',
        'Public share links & iframe embeds',
      ],
    },
    {
      name: 'Pro',
      price: annual ? 32 : 38,
      desc: 'For creators who need unbranded sharing, 4K exports, and full AI customization.',
      cta: 'Upgrade to Pro',
      href: '/workspaces/workspace-5p8xcsfv/upgrade',
      popular: true,
      features: [
        'Unlimited Interactive Demos & Visuals',
        '1,000 AI Studio credits / month',
        'Custom watermark & white-label player',
        '4K 60FPS Video export & GIF export',
        '11 ElevenLabs voices & 36 languages',
      ],
    },
    {
      name: 'Growth',
      price: annual ? 42 : 50,
      desc: 'For teams scaling product marketing, sales enablement, and CRM lead capture.',
      cta: 'Start 14-day Growth Trial',
      href: '/workspaces/workspace-5p8xcsfv/upgrade',
      features: [
        'Up to 10 creators included',
        '2,500 AI Studio credits / month',
        'Multi-choice branching & page morphing',
        'Audience Reveal & Lead Capture forms',
        'HubSpot, Salesforce & Slack sync',
      ],
    },
    {
      name: 'Enterprise',
      price: null,
      desc: 'For organizations requiring SAML SSO, custom domains, and dedicated security.',
      cta: 'Contact Sales',
      href: '/enterprise',
      features: [
        'Unlimited creators & workspaces',
        'Custom AI Studio credit pool',
        'Okta / Azure AD SAML SSO & SCIM',
        'Custom CNAME share domains',
        'SOC 2 Type II & dedicated CSM',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Simple, transparent pricing for every team
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Start free with 350 monthly AI credits, or upgrade for white-label embeds, branching, and 4K exports.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
                  annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Annual Billing <span className="ml-1 text-xs text-emerald-600 font-bold">(-16%)</span>
              </button>
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
                  !annual ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Monthly Billing
              </button>
            </div>

            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
              {(['USD', 'EUR', 'GBP'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg px-3 py-1.5 ${
                    currency === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col justify-between rounded-2xl border p-6 ${
                p.popular
                  ? 'border-indigo-600 bg-indigo-50/20 shadow-lg ring-2 ring-indigo-600'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  {p.popular && (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-600 min-h-[36px]">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  {p.price !== null ? (
                    <>
                      <span className="text-4xl font-extrabold text-slate-950">
                        {symbol}{p.price}
                      </span>
                      <span className="text-xs text-slate-500">/ user / month</span>
                    </>
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-950">Custom</span>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={p.href}
                className={`mt-8 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                  p.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
