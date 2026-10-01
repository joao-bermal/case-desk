import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { CaseDetail } from './CaseDetail';

export async function generateMetadata({ params }: PageProps<'/processos/[id]'>): Promise<Metadata> {
  return { title: `Processo #${(await params).id}` };
}

export default async function CasePage({ params }: PageProps<'/processos/[id]'>) {
  const user = await requireUser();
  const caseId = Number((await params).id);
  if (!Number.isInteger(caseId)) notFound();

  const client = await api();
  const { data: item } = await client.GET('/cases/{case_id}', { params: { path: { case_id: caseId } } });
  if (!item) notFound();

  const isStaff = user.role !== 'client';
  const [companies, lawyers] = await Promise.all([
    isStaff ? client.GET('/companies').then((r) => r.data ?? []) : Promise.resolve([]),
    user.role === 'secretary' ? client.GET('/lawyers').then((r) => r.data ?? []) : Promise.resolve(undefined),
  ]);

  return (
    <CaseDetail
      item={item}
      role={user.role}
      userId={user.id}
      companies={companies.map(({ id, legal_name, cnpj }) => ({ id, legal_name, cnpj }))}
      lawyers={lawyers?.map(({ id, full_name, is_active }) => ({ id, full_name, is_active }))}
    />
  );
}
