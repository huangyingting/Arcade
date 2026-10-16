'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Layers,
  Video,
  Image as ImageIcon,
  ChevronDown,
  ArrowRight,
  KeyRound,
  Globe,
} from 'lucide-react';
import {
  UI_LANGUAGES,
  UI_DICTIONARY,
  SupportedUiLang,
  getSavedUiLang,
  setSavedUiLang,
} from '@/lib/i18n';

export function MarketingHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [lang, setLang] = useState<SupportedUiLang>('en');

  useEffect(() => {
    setLang(getSavedUiLang());
    const handler = (e: Event) => {
      const next = (e as CustomEvent<SupportedUiLang>).detail;
      if (next) setLang(next);
    };
    window.addEventListener('arcade-lang-change', handler);
    return () => window.removeEventListener('arcade-lang-change', handler);
  }, []);

  const t = UI_DICTIONARY[lang] || UI_DICTIONARY.en;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Arcade</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('product')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
                Product <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openMenu === 'product' && (
                <div className="absolute left-0 top-full w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <Link
                    href="/product/interactive-demos"
                    className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-50"
                  >
                    <Layers className="mt-0.5 h-5 w-5 text-indigo-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Interactive Demos</div>
                      <div className="text-xs text-slate-500">Step-by-step product walkthroughs, hotspots & branches</div>
                    </div>
                  </Link>
                  <Link
                    href="/product/videos"
                    className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-50"
                  >
                    <Video className="mt-0.5 h-5 w-5 text-violet-600" />
                    <div>
                      <div className="font-semibold text-slate-900">AI Launch Videos</div>
                      <div className="text-xs text-slate-500">Custom-code Remotion scenes & 5-track NLE studio</div>
                    </div>
                  </Link>
                  <Link
                    href="/product/visuals"
                    className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-50"
                  >
                    <ImageIcon className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-900">AI Visuals</div>
                      <div className="text-xs text-slate-500">28 multi-channel presets for social, ads & changelog</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setOpenMenu('solutions')}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
                Solutions <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openMenu === 'solutions' && (
                <div className="absolute left-0 top-full w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl">
                  <Link href="/solutions/marketing" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
                    <div className="font-semibold text-slate-900">Product Marketing</div>
                    <div className="text-xs text-slate-500">Convert website visitors 3.4x faster</div>
                  </Link>
                  <Link href="/solutions/sales" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
                    <div className="font-semibold text-slate-900">Sales & Pre-Sales</div>
                    <div className="text-xs text-slate-500">Personalized leave-behinds & CRM sync</div>
                  </Link>
                  <Link href="/solutions/enablement" className="block rounded-lg px-3 py-2 hover:bg-slate-50">
                    <div className="font-semibold text-slate-900">Customer Enablement</div>
                    <div className="text-xs text-slate-500">Interactive guides & localized docs</div>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/pricing" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.pricing}
            </Link>
            <Link href="/enterprise" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.enterprise}
            </Link>
            <Link href="/showcase" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.showcase}
            </Link>
            <Link href="/integrations" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.integrations}
            </Link>
            <Link href="/changelog" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.changelog}
            </Link>
            <Link href="/download" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900">
              {t.download}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {/* UI Language Switcher (English, Chinese, Japanese, Korean) */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
            <Globe className="h-3.5 w-3.5 text-indigo-600" />
            <select
              aria-label="Interface Language"
              value={lang}
              onChange={(e) => {
                const next = e.target.value as SupportedUiLang;
                setLang(next);
                setSavedUiLang(next);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {UI_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/admin/invitations"
            className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {t.inviteAdmin}
          </Link>
          <Link
            href="/signin"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {t.signIn}
          </Link>
          <Link
            href="/workspaces/workspace-5p8xcsfv"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            {t.openStudio} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-white text-lg">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              Arcade
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Interactive demos, custom-code AI launch videos, and multi-channel visuals built for modern product teams.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Product</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/product/interactive-demos" className="hover:text-white">Interactive Demos</Link></li>
              <li><Link href="/product/videos" className="hover:text-white">AI Launch Videos</Link></li>
              <li><Link href="/product/visuals" className="hover:text-white">AI Visuals</Link></li>
              <li><Link href="/download" className="hover:text-white">Chrome & Desktop Recorder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Account Admission</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/signin" className="hover:text-white">Sign In (Scrypt Auth)</Link></li>
              <li><Link href="/register" className="hover:text-white">Register (Invite-Only Gate)</Link></li>
              <li><Link href="/invite/demo-invite-token-2026" className="text-amber-400 hover:underline">Accept Demo Invitation ↗</Link></li>
              <li><Link href="/admin/invitations" className="text-indigo-400 hover:underline">Admin Invitations Console ↗</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/changelog" className="hover:text-white">Changelog</Link></li>
              <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/benchmarks" className="hover:text-white">2026 Demo Benchmarks</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Live Demos</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/share/319HqogqYEOZH11srxTM" className="text-amber-400 hover:underline">whoami.genisisiq.com Tour ↗</Link></li>
              <li><Link href="/share/videos/qGe4L499rr5AsLtm6F4q" className="text-indigo-400 hover:underline">whoami Launch Video (30s) ↗</Link></li>
              <li><Link href="/share/collections/whoami-showcase" className="text-emerald-400 hover:underline">whoami Showcase Collection ↗</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-8 text-xs sm:flex-row">
          <p>© 2026 Arcade Software, Inc. Built with Next.js + NextAuth + Prisma + ReadWise Invite-Only Admission.</p>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <span>SOC 2 Type II Certified</span>
            <span>GDPR Compliant</span>
            <span>ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
