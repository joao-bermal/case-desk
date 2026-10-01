import type { Metadata } from 'next';
import Link from 'next/link';

import { setNewPassword } from '@/actions/auth';
import { ActionForm, Field } from '@/components/forms';
import { Logo, Notice } from '@/components/ui';

// The link carries a one-time token: never send it to another site as a referrer.
export const metadata: Metadata = { title: 'Criar senha', referrer: 'no-referrer' };

/** Target of both the invite email and the password reset email. */
export default async function NewPasswordPage({ searchParams }: PageProps<'/nova-senha'>) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Criar senha</h1>
        <p className="mt-1 text-sm text-slate-500">Use pelo menos 8 caracteres. Depois disso você já entra no sistema.</p>
        <div className="mt-6">
          {typeof token === 'string' && token ? (
            <ActionForm action={setNewPassword.bind(null, token)} submitLabel="Salvar senha e entrar">
              <Field name="new_password" label="Nova senha" type="password" autoComplete="new-password" required />
              <Field name="confirm_password" label="Repita a senha" type="password" autoComplete="new-password" required />
            </ActionForm>
          ) : (
            <Notice tone="error">
              Link incompleto. Abra o link do e-mail de novo ou peça outro em <Link href="/esqueci-senha" className="underline">Esqueci a senha</Link>.
            </Notice>
          )}
        </div>
      </div>
    </main>
  );
}
