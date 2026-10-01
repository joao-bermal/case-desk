import type { Metadata } from 'next';

import { createCompany } from '@/actions/companies';
import { ActionForm } from '@/components/forms';
import { Card, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';

import { CompanyFields } from '../CompanyFields';

export const metadata: Metadata = { title: 'Nova empresa' };

export default async function NewCompanyPage() {
  await requireUser('secretary');
  return (
    <>
      <PageHeader
        title="Nova empresa"
        description="Depois do cadastro, convide as pessoas da empresa para acompanharem os processos."
        back={{ href: '/empresas', label: 'Empresas' }}
      />
      <Card className="max-w-2xl">
        <ActionForm action={createCompany} submitLabel="Cadastrar empresa">
          <CompanyFields />
        </ActionForm>
      </Card>
    </>
  );
}
