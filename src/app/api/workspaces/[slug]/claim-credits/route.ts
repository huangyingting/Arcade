import { api, HttpError, workspaceAccess } from '@/lib/api';

export const POST = api<{ params: Promise<{ slug: string }> }>(async (_request, { params }) => {
  await workspaceAccess((await params).slug, true);
  throw new HttpError(410, 'Promotional credits are not available. No balance has been changed.');
});
