import type { Metadata } from 'next';

import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { CasesView } from './CasesView';

export const metadata: Metadata = { title: 'Processos' };

function one(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

export default async function CasesPage({ searchParams }: PageProps<'/processos'>) {
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
      initialCompanyId={Number(one(params.empresa)) || undefined}
      initialLawyerId={Number(one(params.advogado)) || undefined}
      openNew={one(params.novo) === '1'}
    />
  );
}
