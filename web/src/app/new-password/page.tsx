import type { Metadata } from 'next';

import { setNewPassword } from '@/actions/auth';
import { AuthLayout } from '@/components/AuthLayout';
import { auth } from '@/content/auth';
import { getLocale } from '@/lib/locale';

import { NewPasswordView } from './NewPasswordView';

// The link carries a one-time token: never send it to another site as a referrer.
export async function generateMetadata(): Promise<Metadata> {
  return { title: auth[await getLocale()].meta.newPassword, referrer: 'no-referrer' };
}

/** Target of both the invite email and the password reset email. */
export default async function NewPasswordPage({ searchParams }: PageProps<'/new-password'>) {
  const { token } = await searchParams;
  return (
    <AuthLayout>
      <NewPasswordView action={typeof token === 'string' && token ? setNewPassword.bind(null, token) : undefined} />
    </AuthLayout>
  );
}
