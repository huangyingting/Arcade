import Link from 'next/link';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

export default function ChangelogPage() {
  return <><MarketingHeader /><main className="page-wrap"><header className="border-b border-slate-200 pb-12 pt-8"><p className="eyebrow">01 / Product updates</p><h1 className="page-title mt-6">A record of<br />what changes.</h1><p className="page-intro mt-6">Release notes belong here when they are verified and ready to publish.</p></header><section className="panel my-12 max-w-4xl"><p className="eyebrow">Release history</p><h2 className="mt-5 text-3xl font-semibold">No public release notes yet.</h2><p className="mt-5 leading-7 text-slate-500">This deployment has not published a release history. We do not manufacture launch dates, version announcements, or shipped-feature claims.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/product/interactive-demos" className="btn-primary">Explore the current workflow ↗</Link><Link href="/workspaces" className="btn-secondary">Open your workspace</Link></div></section></main><MarketingFooter /></>;
}
