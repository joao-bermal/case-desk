import type { Metadata } from 'next';

import { requireUser } from '@/lib/auth';

import { AccountView } from './AccountView';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function AccountPage() {
  const user = await requireUser();
  return <AccountView user={user} />;
}
