'use client';

import { use } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function UpgradePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><p className="eyebrow">09 / Plan management</p><h1 className="page-title mt-3">Know where you stand.</h1><p className="page-intro mt-4">Self-service subscriptions and paid plan upgrades are not available.</p><section className="panel mt-8 max-w-3xl"><span className="tag">Billing not connected</span><h2 className="mt-5 text-2xl font-semibold">No plan changes without a real billing flow.</h2><p className="mt-4 text-slate-500">This page cannot activate a subscription, create an invoice, or accept payment. Your existing plan remains unchanged. Ask your deployment administrator about available access.</p><div className="mt-8 flex flex-wrap gap-3"><Link href={`/workspaces/${workspaceSlug}/settings/billing`} className="btn-primary">View recorded plan →</Link><Link href={`/workspaces/${workspaceSlug}/usage`} className="btn-secondary">Usage ledger</Link></div></section></main></WorkspaceShell>;
}
