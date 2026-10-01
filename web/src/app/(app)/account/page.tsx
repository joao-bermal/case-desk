import type { Metadata } from 'next';

import { accountCopy } from '@/content/pages';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';

import { AccountView } from './AccountView';

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountCopy[await getLocale()].meta };
}

export default async function AccountPage() {
  const user = await requireUser();
  return <AccountView user={user} />;
}
