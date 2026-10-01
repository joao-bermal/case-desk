import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { demoLogin, login } from '@/actions/auth';
import { AuthLayout } from '@/components/AuthLayout';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';

import { LoginView } from './LoginView';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/processos');

  const demoActions = DEMO_MODE
    ? {
        secretary: demoLogin.bind(null, 'secretary'),
        lawyer: demoLogin.bind(null, 'lawyer'),
        client: demoLogin.bind(null, 'client'),
      }
    : undefined;

  return (
    <AuthLayout repoUrl={REPO_URL}>
      <LoginView login={login} demoActions={demoActions} />
    </AuthLayout>
  );
}
