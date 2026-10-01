import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { deleteCase, updateCase } from '@/actions/cases';
import { ActionButton, ActionForm } from '@/components/forms';
import { buttonClass, Card, CardTitle, Detail, PageHeader, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { AREA_LABEL, formatCnpj, formatDate, formatDateTime, formatPhone } from '@/lib/format';

import { CaseFields } from '../CaseFields';

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
  const [companies, lawyers] = isStaff
    ? await Promise.all([
        client.GET('/companies').then((r) => r.data ?? []),
        user.role === 'secretary' ? client.GET('/lawyers').then((r) => r.data ?? []) : undefined,
      ])
    : [[], undefined];

  const mailto = `mailto:${item.lawyer.email}?subject=${encodeURIComponent(`Processo #${item.id}: ${item.title}`)}`;

  return (
    <>
      <PageHeader
        title={item.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <span>
              #{item.id} · {AREA_LABEL[item.practice_area]} · aberto em {formatDate(item.created_at)}
            </span>
          </span>
        }
        back={{ href: '/processos', label: 'Processos' }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isStaff ? (
            <Card>
              <CardTitle>Dados do processo</CardTitle>
              <ActionForm action={updateCase.bind(null, item.id)} submitLabel="Salvar alterações">
                <CaseFields companies={companies} lawyers={lawyers} current={item} />
              </ActionForm>
            </Card>
          ) : (
            <Card>
              <CardTitle>Andamento</CardTitle>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                {item.description || 'O advogado ainda não registrou uma descrição.'}
              </p>
              <p className="mt-4 text-xs text-slate-500">Última atualização em {formatDateTime(item.updated_at)}.</p>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardTitle>Empresa cliente</CardTitle>
            <dl className="grid gap-3">
              <Detail label="Razão social">
                {isStaff ? (
                  <Link href={`/empresas/${item.company.id}`} className="hover:underline">
                    {item.company.legal_name}
                  </Link>
                ) : (
                  item.company.legal_name
                )}
              </Detail>
              <Detail label="CNPJ">{formatCnpj(item.company.cnpj)}</Detail>
            </dl>
          </Card>

          <Card>
            <CardTitle>Advogado responsável</CardTitle>
            <dl className="grid gap-3">
              <Detail label="Nome">{item.lawyer.full_name}</Detail>
              {item.lawyer.oab_number && <Detail label="OAB">{item.lawyer.oab_number}</Detail>}
              <Detail label="E-mail">{item.lawyer.email}</Detail>
              {item.lawyer.phone && <Detail label="Telefone">{formatPhone(item.lawyer.phone)}</Detail>}
            </dl>
            {user.id !== item.lawyer.id && (
              <a href={mailto} className={`${buttonClass.secondary} mt-4 w-full`}>
                Enviar e-mail
              </a>
            )}
          </Card>

          {user.role === 'secretary' && (
            <Card>
              <CardTitle hint="Remove o processo de vez. Para guardar o histórico, use a situação Arquivado.">
                Excluir processo
              </CardTitle>
              <ActionButton
                action={deleteCase.bind(null, item.id)}
                label="Excluir processo"
                pendingLabel="Excluindo…"
                confirm={`Excluir o processo "${item.title}"? Esta ação não pode ser desfeita.`}
                tone="danger"
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
