import { api, HttpError, workspaceAccess } from '@/lib/api';

export const POST = api<{ params: Promise<{ slug: string }> }>(async (_request, { params }) => {
  await workspaceAccess((await params).slug, true, true);
  throw new HttpError(501, 'Billing is not configured. Your plan has not been changed.');
});
