import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/api';
export async function PrivateStudio({ children }: { children: React.ReactNode }) {
  if (!(await currentUser())) redirect('/auth');
  return children;
}
