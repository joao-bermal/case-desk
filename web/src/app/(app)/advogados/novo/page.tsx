import type { Metadata } from 'next';

import { createLawyer } from '@/actions/lawyers';
import { ActionForm } from '@/components/forms';
import { Card, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';

import { LawyerFields } from '../LawyerFields';

export const metadata: Metadata = { title: 'Novo advogado' };

export default async function NewLawyerPage() {
  await requireUser('secretary');
  return (
    <>
      <PageHeader
        title="Novo advogado"
        description="A pessoa recebe um convite por e-mail e cria a própria senha."
        back={{ href: '/advogados', label: 'Advogados' }}
      />
      <Card className="max-w-2xl">
        <ActionForm action={createLawyer} submitLabel="Cadastrar e enviar convite">
          <LawyerFields />
        </ActionForm>
      </Card>
    </>
  );
}
