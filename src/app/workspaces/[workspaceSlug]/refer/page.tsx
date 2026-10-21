'use client';

import { use } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default function ReferralPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><p className="eyebrow">13 / Bring your team</p><h1 className="page-title mt-3">Better work, together.</h1><p className="page-intro mt-4">Arcade accounts are invitation-only. There is no referral-credit program or automatic reward.</p><section className="panel mt-8 max-w-3xl"><h2 className="panel-heading">Invite with intention.</h2><p className="mt-4 text-slate-500">Ask your platform administrator to issue an account invitation. Workspace membership and team access are separate from public project sharing.</p><div className="mt-8 flex flex-wrap gap-3"><Link href={`/workspaces/${workspaceSlug}/settings/members`} className="btn-primary">View workspace members →</Link><Link href={`/workspaces/${workspaceSlug}`} className="btn-secondary">Back to projects</Link></div></section></main></WorkspaceShell>;
}
