import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClass, EmptyState, PageHeader } from '@/components/ui';
import { api } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { formatPhone } from '@/lib/format';

import { AccessBadge } from './AccessBadge';

export const metadata: Metadata = { title: 'Advogados' };

export default async function LawyersPage() {
  await requireUser('secretary');
  const { data: lawyers = [] } = await (await api()).GET('/lawyers');

  return (
    <>
      <PageHeader
        title="Advogados"
        description="Quem atende os processos. Cada advogado vê só os processos em seu nome."
        actions={
          <Link href="/advogados/novo" className={buttonClass.primary}>
            Novo advogado
          </Link>
        }
      />
      {lawyers.length === 0 ? (
        <EmptyState>Nenhum advogado cadastrado.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Acesso</th>
                <th className="px-4 py-3 text-right font-medium">Em andamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lawyers.map((lawyer) => (
                <tr key={lawyer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/advogados/${lawyer.id}`} className="font-medium text-slate-900 hover:underline">
                      {lawyer.full_name}
                    </Link>
                    {lawyer.oab_number && <span className="block text-xs text-slate-500">{lawyer.oab_number}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {lawyer.email}
                    {lawyer.phone && <span className="block text-xs text-slate-500">{formatPhone(lawyer.phone)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <AccessBadge lawyer={lawyer} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <Link href={`/processos?advogado=${lawyer.id}`} className="hover:underline">
                      {lawyer.active_cases}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
