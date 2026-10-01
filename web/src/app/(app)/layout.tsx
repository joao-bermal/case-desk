import Link from 'next/link';

import { logout } from '@/actions/auth';
import { Logo } from '@/components/ui';
import type { Role } from '@/lib/api/client';
import { requireUser } from '@/lib/auth';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';
import { ROLE_LABEL } from '@/lib/format';

import { NavLinks } from './NavLinks';

const NAV: Record<Role, { href: string; label: string }[]> = {
  secretary: [
    { href: '/processos', label: 'Processos' },
    { href: '/empresas', label: 'Empresas' },
    { href: '/advogados', label: 'Advogados' },
  ],
  lawyer: [
    { href: '/processos', label: 'Meus processos' },
    { href: '/empresas', label: 'Empresas' },
  ],
  client: [{ href: '/processos', label: 'Processos da empresa' }],
};

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link href="/processos" aria-label="Case Desk, início">
              <Logo />
            </Link>
            <NavLinks links={NAV[user.role]} />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/conta" className="text-right leading-tight hover:text-slate-900">
              <span className="block font-medium text-slate-800">{user.full_name}</span>
              <span className="block text-xs text-slate-500">{ROLE_LABEL[user.role]}</span>
            </Link>
            <form action={logout}>
              <button className="rounded-md border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-50">Sair</button>
            </form>
          </div>
        </div>
      </header>
      {DEMO_MODE && (
        <div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-900">
          <p className="mx-auto max-w-6xl px-4 py-2">
            Demonstração pública com dados fictícios, restaurados todos os dias às 03:00 (Brasília). Convites e
            e-mails não são enviados aqui.{' '}
            <a href={REPO_URL} className="font-medium underline underline-offset-2">
              Ver o código
            </a>
          </p>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
