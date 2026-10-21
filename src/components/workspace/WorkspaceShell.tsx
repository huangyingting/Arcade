'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Search, Home, Layers, BarChart3, Palette, Settings, Users, Inbox, Archive, Trash2, Brain, KeyRound, LogOut, Plus, Menu, X, ChevronDown, Globe } from 'lucide-react';
import { requestJson, errorMessage } from '@/lib/client';
import type { AccountUser, WorkspaceData } from '@/types/product';
import { getSavedUiLang, setSavedUiLang, UI_LANGUAGES, UI_DICTIONARY, type SupportedUiLang } from '@/lib/i18n';

export function WorkspaceShell({ workspaceSlug, children }: { workspaceSlug: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [user, setUser] = useState<AccountUser | null>(null);
  const [workspaces, setWorkspaces] = useState<{ slug: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; title: string; type: string; url: string }[]>([]);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<SupportedUiLang>('en');
  useEffect(() => {
    const controller = new AbortController();
    setWorkspace(null); setError('');
    Promise.all([
      requestJson<{ workspace: WorkspaceData; user: AccountUser }>(`/api/workspaces/${workspaceSlug}`, { signal: controller.signal }),
      requestJson<{ workspaces: { slug: string; name: string }[] }>('/api/workspaces', { signal: controller.signal }),
    ]).then(([data, list]) => { setWorkspace(data.workspace); setUser(data.user); setWorkspaces(list.workspaces); })
      .catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e)); });
    return () => controller.abort();
  }, [workspaceSlug]);
  useEffect(() => { setLang(getSavedUiLang()); }, []);
  useEffect(() => {
    setOpen(false); setSearch(false); setSwitching(false);
  }, [pathname]);
  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearch((s) => !s); }
      if (event.key === 'Escape') { setOpen(false); setSearch(false); setSwitching(false); }
    }
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, []);
  useEffect(() => {
    if (!search) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      requestJson<{ results: typeof results }>(`/api/search?workspaceSlug=${workspaceSlug}&q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((data) => setResults(data.results)).catch((e) => { if (!controller.signal.aborted) setError(errorMessage(e)); });
    }, 200);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, search, workspaceSlug]);
  const t = UI_DICTIONARY[lang];
  const base = `/workspaces/${workspaceSlug}`;
  const unread = workspace?.notifications.filter((n) => !n.isRead).length || 0;
  const admin = workspace && ['OWNER', 'ADMIN'].includes(workspace.role);
  const links = [
    { label: t.home, path: '', icon: Home },
    { label: t.library, path: '/teams/me', icon: Layers },
    { label: t.brandKits, path: '/settings/brand-kits', icon: Palette },
    { label: t.teamInsights, path: '/insights', icon: BarChart3 },
    ...(admin ? [{ label: t.leads, path: '/leads', icon: Users }] : []),
    { label: t.inbox, path: '/inbox', icon: Inbox },
    { label: t.memory, path: '/memory', icon: Brain },
  ];
  return (
    <div className="flex min-h-screen bg-[#f5f4ec]">
      <aside className={`${open ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-64 flex-col bg-slate-900 px-4 py-6 text-white md:flex`}>
        <div className="flex items-center justify-between px-3">
          <Link href={base} className="brand-mark"><span className="brand-symbol">a/</span>arcade<span className="ml-1 font-mono text-[9px] font-normal uppercase tracking-widest text-slate-400">studio</span></Link>
          <button aria-label="Close navigation" className="p-2 md:hidden" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <div className="mt-9 border-b border-slate-700/60 pb-5">
          <button onClick={() => setSwitching(!switching)} aria-expanded={switching} className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-3 text-left">
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-100">{workspace?.name || 'Workspace'}</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-slate-400">{workspace?.role || 'Loading account'}</span></span><ChevronDown size={14} className="shrink-0 text-slate-400" />
          </button>
          {switching && <div className="mt-2 space-y-1 rounded-lg border border-slate-700 p-2 text-xs">{workspaces.map((ws) => <Link key={ws.slug} href={`/workspaces/${ws.slug}`} className="block truncate rounded p-2 hover:bg-white/10">{ws.name}</Link>)}<Link href="/workspaces/create" className="flex items-center gap-2 p-2 text-orange-200"><Plus size={12} />New workspace</Link></div>}
          <button onClick={() => setSearch(!search)} className="mt-4 flex w-full items-center gap-3 px-3 text-xs text-slate-400"><Search size={15} />Search your work<kbd className="ml-auto font-mono text-[9px]">Ctrl K</kbd></button>
        </div>
        <nav aria-label="Workspace navigation" className="mt-5 space-y-1">
          <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[.2em] text-slate-500">Workspace</p>
          {links.map((item) => <Link key={item.path} className="nav-link" href={base + item.path} aria-current={pathname === base + item.path ? 'page' : undefined}><item.icon size={16} strokeWidth={1.5} /><span>{item.label}</span>{item.path === '/inbox' && unread > 0 && <span className="ml-auto rounded bg-white/10 px-1.5 text-[10px]">{unread}</span>}</Link>)}
        </nav>
        {!!workspace?.teams.length && <div className="mt-7"><div className="flex items-center justify-between px-3"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-slate-500">Teams</p>{workspace.role !== 'VIEWER' && <Link aria-label="Create team" href={`${base}/teams/create`} className="text-slate-400"><Plus size={14} /></Link>}</div>{workspace.teams.map((team) => <Link key={team.id} className="nav-link mt-1" href={`${base}/teams/${team.slug}`}><span className="h-1.5 w-1.5 rounded-full bg-[#9baa7e]" />{team.name}</Link>)}</div>}
        <div className="mt-auto space-y-1 pt-7">
          <Link className="nav-link" href={`${base}/archive`}><Archive size={15} />{t.archive}</Link>
          <Link className="nav-link" href={`${base}/trash`}><Trash2 size={15} />{t.trash}</Link>
          <Link className="nav-link" href={`${base}/settings/general`}><Settings size={15} />{t.settings}</Link>
          {user?.role === 'Admin' && <Link className="nav-link" href="/admin/invitations"><KeyRound size={15} />Account invitations</Link>}
          <div className="!mt-5 flex items-center justify-between border-t border-slate-700/60 px-3 pt-5">
            <div className="min-w-0"><p className="truncate text-xs font-medium">{user?.name || 'Account'}</p><p className="mt-1 truncate text-[10px] text-slate-400">{user?.email}</p></div>
            <button aria-label="Sign out" className="ml-2 rounded p-2 text-slate-400 hover:text-white" onClick={async () => {
              try { await requestJson('/api/auth/logout', { method: 'POST' }); router.push('/auth'); router.refresh(); } catch (e) { setError(errorMessage(e)); }
            }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 px-5 md:px-10">
          <div className="flex min-w-0 items-center gap-3"><button aria-label="Open navigation" onClick={() => setOpen(true)} className="p-2 md:hidden"><Menu size={18} /></button><span className="eyebrow truncate">{workspace?.name || 'Arcade'} <span className="mx-2 text-slate-300">/</span> {pathname === base ? 'Overview' : pathname.split('/').at(-1)?.replaceAll('-', ' ')}</span></div>
          <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-xs text-slate-500"><Globe size={13} /><select aria-label="Navigation language" className="max-w-24 bg-transparent text-xs" value={lang} onChange={(e) => { const next = UI_LANGUAGES.find((l) => l.code === e.target.value)?.code || 'en'; setLang(next); setSavedUiLang(next); }}>{UI_LANGUAGES.map((l) => <option value={l.code} key={l.code}>{l.nativeName}</option>)}</select></label><Link href={`${base}#create`} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">{t.create}<ArrowUpRight size={14} /></Link></div>
        </header>
        {search && <section aria-label="Search" className="border-b border-slate-200 bg-[#fdfcf7] px-5 py-5 md:px-10"><div className="flex items-center gap-3"><Search size={18} /><input autoFocus aria-label="Search projects" className="field" placeholder="Search your demos, videos, visuals and brand kits" value={query} onChange={(e) => setQuery(e.target.value)} /><button aria-label="Close search" onClick={() => setSearch(false)}><X size={18} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{results.map((r) => <Link href={r.url} className="flex justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-100" key={r.id}><span>{r.title}</span><span className="eyebrow">{r.type}</span></Link>)}</div>{!results.length && <p className="py-3 text-xs text-slate-500">No matching projects.</p>}</section>}
        <main id="main-content" className="min-w-0 flex-1">
          {error ? <div className="page-wrap"><div role="alert" className="status-error">{error}</div><Link className="btn-secondary" href="/workspaces">Choose a workspace</Link></div> : workspace ? children : <div className="page-wrap animate-pulse"><div className="h-10 w-64 rounded bg-slate-200" /><div className="h-64 rounded-2xl bg-slate-100" /><p className="text-sm text-slate-500">Loading your workspace…</p></div>}
        </main>
      </div>
    </div>
  );
}
