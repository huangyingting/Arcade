'use client';
import { use, useEffect, useState } from 'react';
import { requestJson, errorMessage } from '@/lib/client';
type Video = { name: string; durationSec: number; aspectRatio: string; exportsJson: string };
export default function VideoShare({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { requestJson<{ video: Video }>(`/api/public/videos/${id}`).then((d) => setVideo(d.video)).catch((e) => setError(errorMessage(e))); }, [id]);
  const exports: { status: string; fileUrl: string; format?: string }[] = video ? JSON.parse(video.exportsJson) : [];
  const file = exports.find((e) => e.status === 'READY' && (e.format === 'mp4' || e.fileUrl?.endsWith('.mp4')));
  return <main id="main-content" className="flex min-h-screen flex-col bg-[#171e16] text-[#f2f1e8]"><header className="border-b border-white/10 px-6 py-6 md:px-12"><p className="eyebrow !text-orange-200">Launch film</p><h1 className="mt-2 text-xl font-medium tracking-tight">{video?.name || 'Shared video'}</h1></header><div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-5 py-10">{error ? <p role="alert" className="status-error">{error}</p> : file ? <video className="max-h-[75vh] w-full rounded-xl bg-black shadow-2xl" src={file.fileUrl} controls playsInline aria-label={video?.name} /> : <p className="text-sm text-slate-400">{video ? 'No rendered video is available.' : 'Loading shared video…'}</p>}</div>{video && <footer className="px-6 py-5 text-center font-mono text-[9px] uppercase tracking-widest text-slate-500">{video.durationSec} seconds · {video.aspectRatio}</footer>}</main>;
}
