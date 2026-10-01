import type { Metadata } from 'next';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { CompaniesView } from './CompaniesView';

export const metadata: Metadata = { title: 'Empresas' };

export default async function CompaniesPage() {
  const user = await requireUser('secretary', 'lawyer');
  const { data: companies = [] } = await (await api()).GET('/companies');
  return <CompaniesView companies={companies} canEdit={user.role === 'secretary'} />;
}
