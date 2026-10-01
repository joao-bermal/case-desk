import type { Metadata } from 'next';

import { casesCopy } from '@/content/pages';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';

import { CasesView } from './CasesView';

export async function generateMetadata(): Promise<Metadata> {
  return { title: casesCopy[await getLocale()].meta };
}

function one(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

export default async function CasesPage({ searchParams }: PageProps<'/cases'>) {
  const user = await requireUser();
  const params = await searchParams;
  const client = await api();

  const [cases, companies, lawyers] = await Promise.all([
    client.GET('/cases').then((r) => {
      if (!r.data) throw new Error(`Could not load cases: ${r.response.status}`);
      return r.data.items;
    }),
    user.role !== 'client' ? client.GET('/companies').then((r) => r.data ?? []) : Promise.resolve([]),
    user.role === 'secretary' ? client.GET('/lawyers').then((r) => r.data ?? []) : Promise.resolve([]),
  ]);

  return (
    <CasesView
      role={user.role}
      userId={user.id}
      cases={cases}
      companies={companies.map(({ id, legal_name, cnpj }) => ({ id, legal_name, cnpj }))}
      lawyers={lawyers.map(({ id, full_name, is_active }) => ({ id, full_name, is_active }))}
      initialCompanyId={Number(one(params.company)) || undefined}
      initialLawyerId={Number(one(params.lawyer)) || undefined}
      openNew={one(params.new) === '1'}
    />
  );
}
