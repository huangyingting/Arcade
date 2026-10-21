import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/api';

export async function publishedFlow(shareId: string) {
  const flow = await prisma.flow.findFirst({
    where: { shareId, status: 'PUBLISHED', visibility: { in: ['PUBLIC', 'LINK_ONLY'] } },
    select: {
      id: true, shareId: true, workspaceId: true, name: true, description: true, thumbnailUrl: true,
      stepsJson: true, designJson: true, variablesJson: true, translationsJson: true, menuJson: true,
    },
  });
  if (!flow) throw new HttpError(404, 'This demo is unavailable or no longer published.');
  return flow;
}

export async function publishedVideo(shareId: string) {
  const video = await prisma.promptVideo.findFirst({
    where: { shareId, status: 'PUBLISHED' },
    select: { id: true, shareId: true, workspaceId: true, name: true, durationSec: true, aspectRatio: true, exportsJson: true, thumbnailUrl: true },
  });
  if (!video) throw new HttpError(404, 'This video is unavailable or no longer published.');
  return video;
}
