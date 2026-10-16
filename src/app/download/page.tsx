'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';
import { Chrome, Monitor, Download, ArrowRight, Globe, Sparkles } from 'lucide-react';

export default function DownloadPage() {
  const router = useRouter();
  const [liveUrl, setLiveUrl] = useState('https://whoami.genisisiq.com');
  const [recording, setRecording] = useState(false);

  async function handleStartCloudRecording(e: React.FormEvent) {
    e.preventDefault();
    if (!liveUrl.trim()) return;
    setRecording(true);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${liveUrl.replace(/^https?:\/\//, '')} — Live Recorded Demo`,
          sourceUrl: liveUrl.trim(),
        }),
      });
      const data = await res.json();
      const id = data.flow?.id || '4fLyMFzH8BjqgKQF4Bd6';
      router.push(`/flows/${id}/edit`);
    } finally {
      setRecording(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16 space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-950 sm:text-5xl">
            Capture every click, anywhere
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Download the Manifest V3 Chrome Extension bundle, launch the Cloud Playwright URL Recorder immediately in your browser, or use the Desktop App for native apps.
          </p>
        </div>

        {/* Instant Cloud Playwright URL Recorder */}
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-4 w-4" /> Zero-Install Cloud Playwright Recorder
          </div>
          <h2 className="mt-2 text-2xl font-bold">
            Record any live website directly in the browser
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Enter any URL below — our headless Chromium engine visits the page, captures multi-step screenshots, and auto-detects clickable button coordinates.
          </p>
          <form onSubmit={handleStartCloudRecording} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://whoami.genisisiq.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={recording}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {recording ? 'Crawling & Capturing Hotspots...' : 'Record Live URL in Studio →'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Chrome className="h-10 w-10 text-indigo-600" />
            <h2 className="mt-4 text-2xl font-bold">Arcade Chrome Extension (Manifest V3)</h2>
            <p className="mt-2 text-sm text-slate-600">
              Download the packaged Manifest V3 extension (<code>manifest.json</code>, <code>content.js</code>, <code>background.js</code>, <code>popup.html</code>) to capture real-time browser clicks and upload directly to your Arcade Studio.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/downloads/arcade-chrome-extension.zip"
                download="arcade-chrome-extension.zip"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" /> Download Extension (.zip)
              </a>
              <a
                href="/downloads/extension/manifest.json"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Inspect manifest.json ↗
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-8 shadow-sm">
            <Monitor className="h-10 w-10 text-violet-600" />
            <h2 className="mt-4 text-2xl font-bold">Arcade Studio & Video Renderer</h2>
            <p className="mt-2 text-sm text-slate-600">
              Jump directly into the Flow Editor, AI Launch Video Studio, or 28-Preset AI Visuals Studio with full FFmpeg MP4/GIF/PNG export.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/workspaces/workspace-5p8xcsfv"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Open Workspace Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
