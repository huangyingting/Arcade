import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { publishedVideo } from '@/lib/published';

export const GET = api<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const { workspaceId, ...video } = await publishedVideo((await params).id);
  return NextResponse.json({ video });
});
