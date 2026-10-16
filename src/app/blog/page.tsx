'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { ArrowRight, BookOpen } from 'lucide-react';

const ARTICLES = [
  {
    id: 'remotion-agentic-video',
    tag: 'AI Video Engineering',
    date: 'October 2026',
    title: 'How Our 7-Stage Agentic Pipeline Turns Any URL into a 60FPS Bauhaus Launch Film',
    summary:
      'Inside the Understand → Storyboard → Script → Generate Scenes → Review → Voiceover → SFX orchestration engine.',
    body: 'By combining live Playwright DOM crawling with a 6-color parametric Design Schema and FFmpeg H.264 synthesis, product teams can generate broadcast-ready launch films in under 60 seconds while retaining full frame-accurate control over every scene.',
    ctaHref: '/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit',
    ctaLabel: 'Open AI Video Studio →',
  },
  {
    id: 'brand-kit-13-tabs',
    tag: 'Brand Systems',
    date: 'September 2026',
    title: 'Extracting 13 Dimensions of Brand Identity Automatically from a Single URL',
    summary:
      'How we crawl computed CSS palettes, typography scales, ICP personas, and voiceover pronunciation rules from sites like whoami.genisisiq.com.',
    body: 'Every interactive demo and launch video should look native to your brand from the first frame. Our 13-tab Brand Kit engine extracts colors, fonts, logos, backgrounds, ICP personas, and phonetic pronunciation rules automatically.',
    ctaHref: '/workspaces/workspace-5p8xcsfv/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0',
    ctaLabel: 'Inspect 13-Tab Brand Kit →',
  },
  {
    id: 'invite-only-security',
    tag: 'Enterprise Security',
    date: 'August 2026',
    title: 'Cryptographic Invite-Only Admission & Zero-Trust Demo Sharing',
    summary:
      'Why enterprise cloud architects rely on SHA-256 one-time invitation links, PBKDF2-SHA256 verification, and DOM PII redaction.',
    body: 'Public self-signup exposes internal product workspaces to unauthorized access. Our ReadWise-grade admission engine ensures every account is backed by a single-use cryptographic invitation token.',
    ctaHref: '/admin/invitations',
    ctaLabel: 'Open Invite Admin Console →',
  },
];

export default function BlogPage() {
  const [selectedId, setSelectedId] = useState(ARTICLES[0].id);
  const activeArticle = ARTICLES.find((a) => a.id === selectedId) || ARTICLES[0];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-950">Arcade Engineering & Product Blog</h1>
          <p className="mt-2 text-slate-600">
            Deep dives into interactive storytelling, programmatic video synthesis, and Brand Kit AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            {ARTICLES.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedId(art.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  selectedId === art.id
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                  <span>{art.tag}</span>
                  <span className="text-slate-400">{art.date}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{art.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{art.summary}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600">
              <BookOpen className="h-4 w-4" /> {activeArticle.tag} • {activeArticle.date}
            </div>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{activeArticle.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{activeArticle.summary}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{activeArticle.body}</p>
            <div className="mt-8">
              <Link
                href={activeArticle.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                {activeArticle.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
