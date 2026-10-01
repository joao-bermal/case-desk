import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { demoLogin, login } from '@/actions/auth';
import { ActionButton, ActionForm, Field } from '@/components/forms';
import { Logo } from '@/components/ui';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';

export const metadata: Metadata = { title: 'Entrar' };

const DEMO_ROLES = [
  { role: 'secretary', label: 'Secretaria', hint: 'Cadastra empresas e advogados e distribui os processos.' },
  { role: 'lawyer', label: 'Advogada', hint: 'Ana Ribeiro: cuida dos próprios processos.' },
  { role: 'client', label: 'Cliente', hint: 'Vale Verde Alimentos: acompanha os processos da empresa.' },
] as const;

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/processos');

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Entrar no escritório</h1>
          <p className="mt-1 text-sm text-slate-500">
            Processos, clientes e advogados num lugar só, com acesso por perfil.
          </p>

          {DEMO_MODE && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">Demonstração: entre com um perfil</p>
              <p className="mt-0.5 text-xs text-slate-500">Dados fictícios, restaurados todos os dias.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {DEMO_ROLES.map(({ role, label, hint }) => (
                  <li key={role} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600">{hint}</span>
                    <ActionButton
                      action={demoLogin.bind(null, role)}
                      label={label}
                      pendingLabel="Entrando…"
                      tone="primary"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <ActionForm action={login} submitLabel="Entrar" pendingLabel="Entrando…">
              <Field name="email" label="E-mail" type="email" autoComplete="email" required />
              <Field name="password" label="Senha" type="password" autoComplete="current-password" required />
            </ActionForm>
            <Link href="/esqueci-senha" className="mt-4 inline-block text-sm text-slate-600 underline-offset-2 hover:underline">
              Esqueci a senha
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Acesso por convite: a secretaria cadastra advogados e clientes.{' '}
          <a href={REPO_URL} className="underline underline-offset-2">
            Código e documentação
          </a>
        </p>
      </div>
    </main>
  );
}
