import type { Metadata } from 'next';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { LawyersView } from './LawyersView';

export const metadata: Metadata = { title: 'Advogados' };

export default async function LawyersPage() {
  await requireUser('secretary');
  const { data: lawyers = [] } = await (await api()).GET('/lawyers');
  return <LawyersView lawyers={lawyers} />;
}
