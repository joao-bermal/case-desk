import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { CompanyDetail } from './CompanyDetail';

export const metadata: Metadata = { title: 'Empresa' };

export default async function CompanyPage({ params }: PageProps<'/empresas/[id]'>) {
  const user = await requireUser('secretary', 'lawyer');
  const companyId = Number((await params).id);
  if (!Number.isInteger(companyId)) notFound();

  const { data: company } = await (await api()).GET('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
  });
  if (!company) notFound();

  return <CompanyDetail company={company} canEdit={user.role === 'secretary'} />;
}
