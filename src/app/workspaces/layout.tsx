import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/api';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  if (!await currentUser()) redirect('/auth');
  return children;
}
