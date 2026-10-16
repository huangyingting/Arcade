import React from 'react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

export default function ChangelogPage() {
  const entries = [
    {
      date: 'March 2026',
      tag: 'AI Video Studio 2.0',
      title: 'Custom-Code Remotion Launch Videos & 5-Track NLE Timeline',
      desc: 'Generate 15s, 30s, or 45s launch videos from any URL with a 7-stage agentic pipeline, parametric Design Schema controls, and a 5-track non-linear editor.',
    },
    {
      date: 'February 2026',
      tag: 'Brand Kit 13-Tab Engine',
      title: 'Autonomous Brand Kit Extraction from Any URL',
      desc: 'Crawl any website to extract Brand Overview, Voice & Tone, Colors, Typography, Logos, Designs, Shadows, Corners, Motion, Voiceover, Music, Screenshots, and Media.',
    },
    {
      date: 'January 2026',
      tag: 'AI Visuals Studio',
      title: '28 Multi-Platform Social & Ad Size Presets + Avery AI Copy',
      desc: 'Create synchronized assets across Instagram, LinkedIn, X, Facebook, TikTok, YouTube, Pinterest, Display Ads, and Website Hero banners.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-extrabold text-slate-950">Product Changelog</h1>
        <p className="mt-2 text-slate-600">New features, AI models, and studio improvements.</p>
        <div className="mt-10 space-y-8">
          {entries.map((e) => (
            <div key={e.title} className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-500">{e.date}</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-semibold text-indigo-700">{e.tag}</span>
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">{e.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{e.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
