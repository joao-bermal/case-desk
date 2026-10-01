import type { Metadata } from 'next';

import { lawyersCopy } from '@/content/pages';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';

import { LawyersView } from './LawyersView';

export async function generateMetadata(): Promise<Metadata> {
  return { title: lawyersCopy[await getLocale()].meta };
}

export default async function LawyersPage() {
  await requireUser('secretary');
  const { data: lawyers = [] } = await (await api()).GET('/lawyers');
  return <LawyersView lawyers={lawyers} />;
}
