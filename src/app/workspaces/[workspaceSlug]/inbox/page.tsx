'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

type Notification = { id: string; title: string; body: string; isRead: boolean; createdAt: string; actionUrl?: string };
export default function InboxPage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = use(params);
  const [workspace, setWorkspace] = useState<{ role: string; notifications: Notification[] } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  useEffect(() => {
    let active = true; setWorkspace(null); setError('');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load the workspace inbox.');
        if (active) setWorkspace(data.workspace);
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load notifications.'); }
    })();
    return () => { active = false; };
  }, [workspaceSlug]);
  async function markRead(patch: Record<string, unknown>) {
    if (!canManage) return;
    setPending(true); setError('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await response.json();
      if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to mark notifications as read.');
      setWorkspace(data.workspace);
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to update notifications.'); }
    finally { setPending(false); }
  }
  const notifications = workspace?.notifications || [];
  return <WorkspaceShell workspaceSlug={workspaceSlug}><main className="page-wrap"><header className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">08 / Workspace inbox</p><h1 className="page-title mt-3">Stay in the loop.</h1><p className="page-intro mt-4">Actual workspace notifications, collected in one quiet place.</p></div>{canManage && <button className="btn-secondary" disabled={pending || !notifications.some(item => !item.isRead)} onClick={() => void markRead({ markAllNotificationsRead: true })}>{pending ? 'Updating…' : 'Mark all as read'}</button>}</header>{error && <p role="alert" className="status-error mb-5">{error}</p>}{!workspace ? !error && <p role="status">Loading inbox…</p> : !notifications.length ? <section className="empty-state"><h2 className="text-xl font-semibold">You’re all caught up.</h2><p className="mt-3 text-sm text-slate-500">Notifications will appear here when workspace activity creates them.</p></section> : <section className="panel divide-y divide-slate-200">{notifications.map(notification => { const safeUrl = notification.actionUrl?.startsWith('/') && !notification.actionUrl.startsWith('//') && !notification.actionUrl.includes('\\'); return <article key={notification.id} className="flex flex-wrap items-start justify-between gap-4 py-6"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">{notification.title}</h2>{!notification.isRead && <span className="tag">Unread</span>}</div><p className="mt-3 text-sm text-slate-600">{notification.body}</p><p className="mt-3 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2">{safeUrl && <Link className="btn-secondary" href={notification.actionUrl!}>Open ↗</Link>}{canManage && !notification.isRead && <button className="btn-quiet" disabled={pending} onClick={() => void markRead({ markNotificationReadId: notification.id })}>Mark as read</button>}</div></article>; })}</section>}</main></WorkspaceShell>;
}
