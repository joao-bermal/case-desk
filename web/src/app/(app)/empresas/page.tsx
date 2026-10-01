import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClass, EmptyState, PageHeader } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { formatCnpj, formatPhone } from '@/lib/format';

export const metadata: Metadata = { title: 'Empresas' };

export default async function CompaniesPage() {
  const user = await requireUser('secretary', 'lawyer');
  const { data: companies = [] } = await (await api()).GET('/companies');

  return (
    <>
      <PageHeader
        title="Empresas clientes"
        description={
          user.role === 'secretary'
            ? 'Cadastre as empresas e dê acesso às pessoas de cada uma.'
            : 'Contatos das empresas atendidas pelo escritório.'
        }
        actions={
          user.role === 'secretary' && (
            <Link href="/empresas/nova" className={buttonClass.primary}>
              Nova empresa
            </Link>
          )
        }
      />
      {companies.length === 0 ? (
        <EmptyState>Nenhuma empresa cadastrada.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 text-right font-medium">Em andamento</th>
                <th className="px-4 py-3 text-right font-medium">Finalizados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/empresas/${company.id}`} className="font-medium text-slate-900 hover:underline">
                      {company.legal_name}
                    </Link>
                    <span className="block font-mono text-xs text-slate-500">{formatCnpj(company.cnpj)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {company.email}
                    {company.phone && <span className="block text-xs text-slate-500">{formatPhone(company.phone)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <Link href={`/processos?empresa=${company.id}`} className="hover:underline">
                      {company.active_cases}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{company.finished_cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
