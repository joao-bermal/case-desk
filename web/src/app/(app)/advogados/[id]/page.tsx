import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { resendInvite } from '@/actions/companies';
import { setLawyerActive, updateLawyer } from '@/actions/lawyers';
import { ActionButton, ActionForm } from '@/components/forms';
import { buttonClass, Card, CardTitle, Notice, PageHeader } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';

import { LawyerFields } from '../LawyerFields';
import { AccessBadge } from '../AccessBadge';

export const metadata: Metadata = { title: 'Advogado' };

export default async function LawyerPage({ params }: PageProps<'/advogados/[id]'>) {
  await requireUser('secretary');
  const lawyerId = Number((await params).id);
  if (!Number.isInteger(lawyerId)) notFound();

  const { data: lawyer } = await (await api()).GET('/lawyers/{lawyer_id}', {
    params: { path: { lawyer_id: lawyerId } },
  });
  if (!lawyer) notFound();
  const path = `/advogados/${lawyer.id}`;

  return (
    <>
      <PageHeader
        title={lawyer.full_name}
        description={<AccessBadge lawyer={lawyer} />}
        back={{ href: '/advogados', label: 'Advogados' }}
        actions={
          <Link href={`/processos?aba=todos&advogado=${lawyer.id}`} className={buttonClass.secondary}>
            Ver processos
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle>Cadastro</CardTitle>
            {lawyer.is_demo ? (
              <Notice tone="info">Esta é uma conta de demonstração e não pode ser alterada.</Notice>
            ) : (
              <ActionForm action={updateLawyer.bind(null, lawyer.id)} submitLabel="Salvar alterações">
                <LawyerFields current={lawyer} />
              </ActionForm>
            )}
          </Card>
        </div>
        {!lawyer.is_demo && (
          <div className="flex flex-col gap-6">
            {lawyer.is_active && !lawyer.has_password && (
              <Card>
                <CardTitle hint="O link anterior deixa de valer.">Convite pendente</CardTitle>
                <ActionButton action={resendInvite.bind(null, lawyer.id, path)} label="Reenviar convite" />
              </Card>
            )}
            <Card>
              {lawyer.is_active ? (
                <>
                  <CardTitle hint="A pessoa sai de todas as sessões e não entra mais. Os processos continuam no histórico.">
                    Desativar acesso
                  </CardTitle>
                  <ActionButton
                    action={setLawyerActive.bind(null, lawyer.id, false)}
                    label="Desativar acesso"
                    confirm={`Desativar o acesso de ${lawyer.full_name}?`}
                    tone="danger"
                  />
                </>
              ) : (
                <>
                  <CardTitle>Acesso desativado</CardTitle>
                  <ActionButton action={setLawyerActive.bind(null, lawyer.id, true)} label="Reativar acesso" />
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
