import type { Metadata } from 'next';
import Link from 'next/link';

import { buttonClass, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import { api, type CaseStatus } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { AREA_LABEL, STATUS_LABEL, STATUSES, timeAgo } from '@/lib/format';

export const metadata: Metadata = { title: 'Processos' };

const TABS = [
  { key: 'andamento', label: 'Em andamento', group: 'active' },
  { key: 'finalizados', label: 'Finalizados', group: 'finished' },
  { key: 'todos', label: 'Todos', group: undefined },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function one(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : undefined;
}

export default async function CasesPage({ searchParams }: PageProps<'/processos'>) {
  const user = await requireUser();
  const params = await searchParams;
  const tab = TABS.find((t) => t.key === one(params.aba)) ?? TABS[0];
  const q = one(params.q)?.trim() || undefined;
  const companyId = Number(one(params.empresa)) || undefined;
  const lawyerId = Number(one(params.advogado)) || undefined;

  const query = { group: tab.group, q, company_id: companyId, lawyer_id: lawyerId };
  const { data, error } = await (await api()).GET('/cases', { params: { query } });
  if (!data) throw new Error(`Could not load cases: ${JSON.stringify(error)}`);

  const link = (changes: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { aba: tab.key as TabKey, q, empresa: companyId, advogado: lawyerId, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, String(value));
    return `/processos?${next}`;
  };
  const exportQuery = new URLSearchParams(
    Object.entries(query).flatMap(([k, v]) => (v ? [[k, String(v)]] : [])),
  );

  const isStaff = user.role !== 'client';
  const filterLabel =
    (companyId && data.items[0]?.company.legal_name) || (lawyerId && data.items[0]?.lawyer.full_name);

  return (
    <>
      <PageHeader
        title={user.role === 'lawyer' ? 'Meus processos' : 'Processos'}
        description={
          user.role === 'client'
            ? 'Acompanhe os processos da sua empresa e fale com o advogado responsável.'
            : user.role === 'lawyer'
              ? 'Os processos em que você é o advogado responsável.'
              : 'Todos os processos do escritório.'
        }
        actions={
          <>
            <a href={`/processos/exportar?${exportQuery}`} className={buttonClass.secondary}>
              Exportar CSV
            </a>
            {isStaff && (
              <Link href="/processos/novo" className={buttonClass.primary}>
                Novo processo
              </Link>
            )}
          </>
        }
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((status: CaseStatus) => (
          <div key={status} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <dt className="text-xs font-medium text-slate-500">{STATUS_LABEL[status]}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{data.counts[status]}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm" aria-label="Filtrar por situação">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={link({ aba: t.key })}
              aria-current={t.key === tab.key ? 'page' : undefined}
              className={`rounded-md px-3 py-1.5 ${t.key === tab.key ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/processos" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="aba" value={tab.key} />
          {companyId && <input type="hidden" name="empresa" value={companyId} />}
          {lawyerId && <input type="hidden" name="advogado" value={lawyerId} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título, descrição ou empresa"
            aria-label="Buscar processos"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 sm:w-72"
          />
          <button className={buttonClass.secondary}>Buscar</button>
        </form>
      </div>

      {(companyId || lawyerId) && (
        <p className="mb-4 text-sm text-slate-600">
          Filtrando por {companyId ? 'empresa' : 'advogado'}
          {filterLabel ? `: ${filterLabel}` : ''}.{' '}
          <Link href={link({ empresa: undefined, advogado: undefined })} className="underline underline-offset-2">
            Limpar filtro
          </Link>
        </p>
      )}

      {data.items.length === 0 ? (
        <EmptyState>
          {q ? `Nenhum processo encontrado para "${q}".` : 'Nenhum processo nesta lista.'}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Processo</th>
                {user.role !== 'client' && <th className="px-4 py-3 font-medium">Empresa</th>}
                {user.role !== 'lawyer' && <th className="px-4 py-3 font-medium">Advogado</th>}
                <th className="px-4 py-3 font-medium">Situação</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/processos/${item.id}`} className="font-medium text-slate-900 hover:underline">
                      {item.title}
                    </Link>
                    <span className="block text-xs text-slate-500">
                      #{item.id} · {AREA_LABEL[item.practice_area]}
                    </span>
                  </td>
                  {user.role !== 'client' && <td className="px-4 py-3 text-slate-700">{item.company.legal_name}</td>}
                  {user.role !== 'lawyer' && <td className="px-4 py-3 text-slate-700">{item.lawyer.full_name}</td>}
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{timeAgo(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
