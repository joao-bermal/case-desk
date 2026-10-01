import type { Metadata } from 'next';
import Link from 'next/link';

import { requestPasswordReset } from '@/actions/auth';
import { ActionForm, Field } from '@/components/forms';
import { Logo, Notice } from '@/components/ui';
import { DEMO_MODE } from '@/lib/demo';

export const metadata: Metadata = { title: 'Esqueci a senha' };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Esqueci a senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um link para criar uma
          senha nova, válido por 30 minutos.
        </p>
        {DEMO_MODE && (
          <div className="mt-4">
            <Notice tone="info">Na demonstração nenhum e-mail é enviado. Use os perfis da tela de entrada.</Notice>
          </div>
        )}
        <div className="mt-6">
          <ActionForm action={requestPasswordReset} submitLabel="Enviar link" pendingLabel="Enviando…">
            <Field name="email" label="E-mail" type="email" autoComplete="email" required />
          </ActionForm>
        </div>
        <Link href="/login" className="mt-4 inline-block text-sm text-slate-600 hover:underline">
          ← Voltar para a entrada
        </Link>
      </div>
    </main>
  );
}
