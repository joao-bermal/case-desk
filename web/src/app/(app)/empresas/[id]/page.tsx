import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  deleteCompany,
  inviteClientUser,
  removeClientUser,
  resendInvite,
  updateCompany,
} from '@/actions/companies';
import { ActionButton, ActionForm, Field } from '@/components/forms';
import { buttonClass, Card, CardTitle, Detail, PageHeader } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { formatCnpj, formatPhone } from '@/lib/format';

import { CompanyFields } from '../CompanyFields';

export const metadata: Metadata = { title: 'Empresa' };

export default async function CompanyPage({ params }: PageProps<'/empresas/[id]'>) {
  const user = await requireUser('secretary', 'lawyer');
  const companyId = Number((await params).id);
  if (!Number.isInteger(companyId)) notFound();

  const { data: company } = await (await api()).GET('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
  });
  if (!company) notFound();
  const isSecretary = user.role === 'secretary';
  const path = `/empresas/${company.id}`;

  return (
    <>
      <PageHeader
        title={company.legal_name}
        description={`CNPJ ${formatCnpj(company.cnpj)}`}
        back={{ href: '/empresas', label: 'Empresas' }}
        actions={
          <>
            <Link href={`/processos?aba=todos&empresa=${company.id}`} className={buttonClass.secondary}>
              Ver processos ({company.active_cases + company.finished_cases})
            </Link>
            <Link href={`/processos/novo?empresa=${company.id}`} className={buttonClass.primary}>
              Novo processo
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle>Cadastro</CardTitle>
            {isSecretary ? (
              <ActionForm action={updateCompany.bind(null, company.id)} submitLabel="Salvar alterações">
                <CompanyFields current={company} />
              </ActionForm>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="E-mail">{company.email}</Detail>
                <Detail label="Telefone">{formatPhone(company.phone)}</Detail>
                <Detail label="Processos em andamento">{company.active_cases}</Detail>
                <Detail label="Processos finalizados">{company.finished_cases}</Detail>
              </dl>
            )}
          </Card>
        </div>

        {isSecretary && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardTitle hint="Pessoas da empresa que acompanham os processos. Elas só leem.">
                Acessos do cliente
              </CardTitle>
              {company.users.length === 0 ? (
                <p className="text-sm text-slate-500">Ninguém da empresa tem acesso ainda.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-slate-100">
                  {company.users.map((person) => (
                    <li key={person.id} className="flex flex-col gap-2 py-3 first:pt-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{person.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {person.email} · {person.has_password ? 'acesso ativo' : 'convite pendente'}
                        </p>
                      </div>
                      {!person.is_demo && (
                        <div className="flex flex-wrap gap-2">
                          {!person.has_password && (
                            <ActionButton action={resendInvite.bind(null, person.id, path)} label="Reenviar convite" />
                          )}
                          <ActionButton
                            action={removeClientUser.bind(null, company.id, person.id)}
                            label="Remover acesso"
                            confirm={`Remover o acesso de ${person.full_name}?`}
                            tone="danger"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardTitle hint="A pessoa recebe um link por e-mail para criar a senha.">Convidar pessoa</CardTitle>
              <ActionForm action={inviteClientUser.bind(null, company.id)} submitLabel="Enviar convite" pendingLabel="Enviando…">
                <Field name="full_name" label="Nome" required />
                <Field name="email" label="E-mail" type="email" required />
                <Field name="phone" label="Telefone" mask="phone" />
              </ActionForm>
            </Card>

            <Card>
              <CardTitle hint="Só é possível excluir empresas sem processos.">Excluir empresa</CardTitle>
              <ActionButton
                action={deleteCompany.bind(null, company.id)}
                label="Excluir empresa"
                pendingLabel="Excluindo…"
                confirm={`Excluir ${company.legal_name} e os acessos das pessoas da empresa?`}
                tone="danger"
              />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
