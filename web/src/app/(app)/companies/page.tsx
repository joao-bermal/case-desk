import type { Metadata } from 'next';

import { companiesCopy } from '@/content/pages';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';

import { CompaniesView } from './CompaniesView';

export async function generateMetadata(): Promise<Metadata> {
  return { title: companiesCopy[await getLocale()].meta };
}

export default async function CompaniesPage() {
  const user = await requireUser('secretary', 'lawyer');
  const { data: companies = [] } = await (await api()).GET('/companies');
  return <CompaniesView companies={companies} canEdit={user.role === 'secretary'} />;
}
