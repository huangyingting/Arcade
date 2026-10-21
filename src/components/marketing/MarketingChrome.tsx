'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  return <header className="relative z-30 border-b border-slate-300 bg-[#f5f4ec]"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 md:px-10">
    <Link href="/" className="brand-mark"><span className="brand-symbol">a/</span>arcade</Link>
    <nav aria-label="Main navigation" className="hidden items-center gap-8 text-xs font-medium text-slate-600 md:flex"><Link href="/product/interactive-demos" className="hover:text-indigo-600">Demos</Link><Link href="/product/videos" className="hover:text-indigo-600">Videos</Link><Link href="/product/visuals" className="hover:text-indigo-600">Visuals</Link><Link href="/pricing" className="hover:text-indigo-600">Deployment</Link></nav>
    <div className="flex items-center gap-4"><Link className="btn-primary !min-h-10 !px-4 !text-xs" href="/workspaces">Open studio<ArrowUpRight size={14} /></Link><button onClick={() => setOpen(!open)} className="p-2 md:hidden" aria-expanded={open} aria-label="Navigation">{open ? <X size={20} /> : <Menu size={20} />}</button></div>
  </div>{open && <nav aria-label="Mobile navigation" className="grid gap-3 border-t border-slate-200 px-6 py-5 text-sm md:hidden"><Link href="/product/interactive-demos">Demos</Link><Link href="/product/videos">Videos</Link><Link href="/product/visuals">Visuals</Link><Link href="/pricing">Deployment</Link></nav>}</header>;
}

export function MarketingFooter() {
  return <footer className="border-t border-slate-300"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 md:px-10"><Link href="/" className="brand-mark"><span className="brand-symbol">a/</span>arcade</Link><p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Made for the work worth showing.</p><div className="flex gap-6 text-xs text-slate-500"><Link href="/auth">Sign in</Link><Link href="/register">Access by invitation</Link><Link href="/integrations">Capabilities</Link></div></div></footer>;
}
