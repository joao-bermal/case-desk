import type { Metadata } from 'next';

import { setNewPassword } from '@/actions/auth';
import { AuthLayout } from '@/components/AuthLayout';

import { NewPasswordView } from './NewPasswordView';

// The link carries a one-time token: never send it to another site as a referrer.
export const metadata: Metadata = { title: 'Criar senha', referrer: 'no-referrer' };

/** Target of both the invite email and the password reset email. */
export default async function NewPasswordPage({ searchParams }: PageProps<'/nova-senha'>) {
  const { token } = await searchParams;
  return (
    <AuthLayout>
      <NewPasswordView action={typeof token === 'string' && token ? setNewPassword.bind(null, token) : undefined} />
    </AuthLayout>
  );
}
