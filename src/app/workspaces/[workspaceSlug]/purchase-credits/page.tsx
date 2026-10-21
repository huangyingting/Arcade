'use client';

import { use } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function PurchaseCreditsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap">
    <p className="eyebrow">09 / Workspace credits</p><h1 className="page-title mt-3">Keep your work moving.</h1><p className="page-intro mt-4">Credit purchases are not available in this deployment.</p>
    <section className="panel mt-8 max-w-3xl"><span className="tag">Payments unavailable</span><h2 className="mt-5 text-2xl font-semibold">Your balance, clearly recorded.</h2><p className="mt-4 text-slate-500">No payment details are collected or credits granted on this page. Contact your deployment administrator if you need a balance adjustment.</p><Link href={`/workspaces/${workspaceSlug}/usage`} className="btn-primary mt-8">Review recorded usage →</Link></section>
  </main></WorkspaceShell>;
}
