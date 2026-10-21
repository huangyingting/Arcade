'use client';

import { use } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function ConnectorsPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><p className="eyebrow">12 / Connected services</p><h1 className="page-title mt-3">Connections with clarity.</h1><p className="page-intro mt-4">External data connections need real authentication and verified delivery—not a status switch.</p><section className="panel mt-8 max-w-3xl"><span className="tag">Not available</span><h2 className="mt-5 text-2xl font-semibold">No live connectors are configured.</h2><p className="mt-4 text-slate-500">OAuth account connections, scheduled source synchronization, and CRM delivery are not available in this deployment. No external account is connected by visiting this page.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" href={`/workspaces/${workspaceSlug}/memory`}>Manage workspace knowledge →</Link><Link className="btn-secondary" href={`/workspaces/${workspaceSlug}/leads`}>View captured leads</Link></div></section></main></WorkspaceShell>;
}
