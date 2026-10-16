'use client';

import React, { useEffect, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { Brain, Plus, Trash2 } from 'lucide-react';

export default function MemoryPage({ params: rawParams }: { params: Promise<{ workspaceSlug: string }> }) {
  const params = React.use(rawParams);
  const [memories, setMemories] = useState<any[]>([]);
  const [category, setCategory] = useState('Product Fact');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/workspaces/${params.workspaceSlug}`)
      .then((r) => r.json())
      .then((d) => setMemories(d.workspace?.memories || []));
  }, [params.workspaceSlug]);

  async function handleAddMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${params.workspaceSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMemory: {
            category,
            title: title.trim(),
            content: content.trim(),
            source: 'Workspace Admin',
          },
        }),
      });
      const data = await res.json();
      if (data.workspace?.memories) {
        setMemories(data.workspace.memories);
      }
      setTitle('');
      setContent('');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMemory(id: string) {
    const res = await fetch(`/api/workspaces/${params.workspaceSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteMemoryId: id }),
    });
    const data = await res.json();
    if (data.workspace?.memories) {
      setMemories(data.workspace.memories);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={params.workspaceSlug}>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-8 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avery AI Persistent Memory</h1>
          <p className="text-xs text-slate-500">
            Facts, product positioning, and architectural rules Avery AI remembers across every video, flow, and visual.
          </p>
        </div>

        {/* Add Memory Form */}
        <form
          onSubmit={handleAddMemory}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Teach Avery AI a New Rule or Fact
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              <option value="Product Fact">Product Fact</option>
              <option value="Style Rule">Style Rule</option>
              <option value="Security & Compliance">Security & Compliance</option>
            </select>
            <input
              type="text"
              placeholder="Rule Title (e.g., Highlight AZ-305 & SC-100)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <input
              type="text"
              placeholder="Detailed fact or instruction for Avery AI..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Save Memory
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {memories.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  <Brain className="h-3.5 w-3.5" /> {m.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{m.source}</span>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="text-slate-400 hover:text-rose-600"
                    title="Delete Memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{m.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{m.content}</p>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
