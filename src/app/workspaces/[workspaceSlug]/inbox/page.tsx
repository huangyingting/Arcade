'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { CheckCircle2, ExternalLink, CheckCheck } from 'lucide-react';

export default function InboxPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/workspaces/${params.workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setNotifications(d.workspace?.notifications || []));
  }, [params.workspaceSlug]);

  async function markAllRead() {
    const res = await fetch(`/api/workspaces/${params.workspaceSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllNotificationsRead: true }),
    });
    const data = await res.json();
    if (data.workspace?.notifications) {
      setNotifications(data.workspace.notifications);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Workspace Inbox</h1>
            <p className="text-xs text-slate-500">
              Notifications from Avery AI video rendering, Brand Kit extraction, and viewer milestones.
            </p>
          </div>
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            Mark All Read
          </button>
        </div>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center justify-between p-5 ${
                !n.isRead ? 'bg-amber-50/30' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">{n.title}</span>
                  {!n.isRead && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600">{n.body}</p>
              </div>
              {n.actionUrl && (
                <Link
                  href={n.actionUrl}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50"
                >
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
