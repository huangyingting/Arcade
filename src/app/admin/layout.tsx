import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/api';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/auth');
  if (user.role !== 'Admin') redirect('/workspaces');
  return children;
}
