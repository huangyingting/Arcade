'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Inbox,
  FolderKanban,
  BarChart3,
  Users,
  Sparkles,
  Brain,
  Plug,
  Palette,
  Archive,
  Trash2,
  Settings,
  Search,
  ChevronDown,
  Plus,
  Coins,
  Gift,
  Zap,
  KeyRound,
  LogOut,
  TrendingUp,
  ExternalLink,
  X,
  Globe,
} from 'lucide-react';
import {
  UI_LANGUAGES,
  UI_DICTIONARY,
  SupportedUiLang,
  getSavedUiLang,
  setSavedUiLang,
} from '@/lib/i18n';

interface WorkspaceShellProps {
  workspaceSlug?: string;
  children: React.ReactNode;
}

export function WorkspaceShell({
  workspaceSlug = 'workspace-5p8xcsfv',
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [wsOpen, setWsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [workspaceData, setWorkspaceData] = useState<any>(null);
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

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.workspace) setWorkspaceData(data.workspace);
      })
      .catch(() => {});
  }, [workspaceSlug]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(data.results || []))
      .catch(() => {});
  }, [searchOpen, searchQuery]);

  const totalCredits =
    (workspaceData?.monthlyCreditsQuota ?? 200) +
    (workspaceData?.bonusCreditsBalance ?? 200);
  const usedCredits = workspaceData?.usedCreditsThisCycle ?? 100;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  const navItems = [
    { label: t.home, href: `/workspaces/${workspaceSlug}`, icon: Home },
    { label: t.inbox, href: `/workspaces/${workspaceSlug}/inbox`, icon: Inbox, badge: '3' },
    { label: t.library, href: `/workspaces/${workspaceSlug}/teams/me`, icon: FolderKanban },
    { label: t.teamInsights, href: `/workspaces/${workspaceSlug}/insights`, icon: BarChart3 },
    { label: t.leads, href: `/workspaces/${workspaceSlug}/leads`, icon: Users },
    { label: t.impactAnalysis, href: `/workspaces/${workspaceSlug}/impact-analysis`, icon: TrendingUp },
    { label: t.memory, href: `/workspaces/${workspaceSlug}/memory`, icon: Brain },
    { label: t.connectors, href: `/workspaces/${workspaceSlug}/connectors`, icon: Plug },
    {
      label: t.brandKits,
      href: `/workspaces/${workspaceSlug}/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0`,
      icon: Palette,
    },
    { label: t.inviteOnlyAdmin, href: `/admin/invitations`, icon: KeyRound },
    { label: t.archive, href: `/workspaces/${workspaceSlug}/archive`, icon: Archive },
    { label: t.trash, href: `/workspaces/${workspaceSlug}/trash`, icon: Trash2 },
    { label: t.settings, href: `/workspaces/${workspaceSlug}/settings/general`, icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900">
      {/* 240px Fixed Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col justify-between border-r border-slate-200 bg-slate-50/90">
        <div className="flex flex-col overflow-y-auto p-3">
          {/* Workspace Switcher Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setWsOpen(!wsOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white">
                  JW
                </div>
                <div className="truncate">
                  <div className="truncate font-bold text-slate-900">
                    {workspaceData?.name || "jack wolf's workspace"}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    {workspaceData?.planTier || 'FREE'} PLAN
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {wsOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl text-xs">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase text-slate-400">
                  Signed in as wlfjck@gmail.com
                </div>
                <Link
                  href={`/workspaces/${workspaceSlug}/settings/general`}
                  onClick={() => setWsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100"
                >
                  <Settings className="h-3.5 w-3.5" /> Workspace settings
                </Link>
                <Link
                  href="/admin/invitations"
                  onClick={() => setWsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100"
                >
                  <KeyRound className="h-3.5 w-3.5 text-indigo-600" /> Invite-only admissions
                </Link>
                <Link
                  href="/workspaces/create"
                  onClick={() => setWsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Create new workspace
                </Link>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/signin');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>

          {/* Command+K Search Trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 hover:border-slate-300"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{t.searchPlaceholder}</span>
            </span>
            <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* UI Language Switcher (EN / 中文 / 日本語 / 한국어) */}
          <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <Globe className="h-3.5 w-3.5 text-indigo-600" />
              Language
            </span>
            <select
              aria-label="Workspace Language"
              value={lang}
              onChange={(e) => {
                const next = e.target.value as SupportedUiLang;
                setLang(next);
                setSavedUiLang(next);
              }}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              {UI_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Teams Section */}
          <div className="mt-5 border-t border-slate-200/80 pt-4">
            <div className="flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Teams ({(workspaceData?.teams || []).length || 1})</span>
              <Link
                href={`/workspaces/${workspaceSlug}/teams/create`}
                className="rounded p-0.5 hover:bg-slate-200 text-slate-600"
                title="Create team"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {(workspaceData?.teams?.length
                ? workspaceData.teams
                : [{ id: 't_me', name: 'jack wolf (me)', slug: 'me', iconColor: '#10B981' }]
              ).map((team: any) => (
                <Link
                  key={team.id || team.slug}
                  href={`/workspaces/${workspaceSlug}/teams/${team.slug}`}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    pathname === `/workspaces/${workspaceSlug}/teams/${team.slug}`
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: team.iconColor || '#10B981' }}
                  />
                  <span className="truncate">{team.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Credit Meter & Upgrade Footer */}
        <div className="border-t border-slate-200 bg-white p-3 space-y-2.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                {remainingCredits} credits left
              </span>
              <Link
                href={`/workspaces/${workspaceSlug}/usage`}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                Usage
              </Link>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600"
                style={{
                  width: `${Math.min(100, Math.round((remainingCredits / Math.max(1, totalCredits)) * 100))}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <Link
                href={`/workspaces/${workspaceSlug}/purchase-credits`}
                className="font-semibold text-indigo-600 hover:underline"
              >
                + Buy credits
              </Link>
              <Link
                href={`/workspaces/${workspaceSlug}/refer`}
                className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
              >
                <Gift className="h-3 w-3" /> +200 free
              </Link>
            </div>
          </div>

          <Link
            href={`/workspaces/${workspaceSlug}/upgrade`}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
          >
            <Zap className="h-3.5 w-3.5" />
            Upgrade Plan
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>

      {/* Command+K Search Palette Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 pt-24 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center border-b border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search demos, AI videos, visual projects, brand kits..."
                className="ml-3 flex-1 text-sm text-slate-900 focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching assets found.
                </div>
              ) : (
                searchResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.url}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.type}</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
