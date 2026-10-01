import type { Metadata } from 'next';

import { requestPasswordReset } from '@/actions/auth';
import { AuthLayout } from '@/components/AuthLayout';
import { auth } from '@/content/auth';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';
import { getLocale } from '@/lib/locale';

import { ForgotView } from './ForgotView';

export async function generateMetadata(): Promise<Metadata> {
  return { title: auth[await getLocale()].meta.forgot };
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout repoUrl={REPO_URL}>
      <ForgotView action={requestPasswordReset} demoMode={DEMO_MODE} />
    </AuthLayout>
  );
}
