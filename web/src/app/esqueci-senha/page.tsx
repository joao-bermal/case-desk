import type { Metadata } from 'next';

import { requestPasswordReset } from '@/actions/auth';
import { AuthLayout } from '@/components/AuthLayout';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';

import { ForgotView } from './ForgotView';

export const metadata: Metadata = { title: 'Esqueci a senha' };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout repoUrl={REPO_URL}>
      <ForgotView action={requestPasswordReset} demoMode={DEMO_MODE} />
    </AuthLayout>
  );
}
