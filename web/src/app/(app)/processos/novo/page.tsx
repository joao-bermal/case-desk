import type { Metadata } from 'next';

import { createCase } from '@/actions/cases';
import { ActionForm } from '@/components/forms';
import { Card, PageHeader } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { CaseFields } from '../CaseFields';

export const metadata: Metadata = { title: 'Novo processo' };

export default async function NewCasePage({ searchParams }: PageProps<'/processos/novo'>) {
  const user = await requireUser('secretary', 'lawyer');
  const { empresa } = await searchParams;
  const client = await api();

  const [companies, lawyers] = await Promise.all([
    client.GET('/companies').then((r) => r.data ?? []),
    user.role === 'secretary' ? client.GET('/lawyers').then((r) => r.data ?? []) : undefined,
  ]);

  return (
    <>
      <PageHeader
        title="Novo processo"
        description={user.role === 'lawyer' ? 'O processo fica no seu nome.' : undefined}
        back={{ href: '/processos', label: 'Processos' }}
      />
      <Card className="max-w-3xl">
        <ActionForm action={createCase} submitLabel="Abrir processo">
          <CaseFields
            companies={companies}
            lawyers={lawyers}
            defaultCompanyId={typeof empresa === 'string' ? Number(empresa) : undefined}
          />
        </ActionForm>
      </Card>
    </>
  );
}
