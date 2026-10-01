import { logout } from '@/actions/auth';
import { AppShell } from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { DEMO_MODE, REPO_URL } from '@/lib/demo';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await requireUser();
  return (
    <AppShell
      user={{ full_name: user.full_name, email: user.email, role: user.role }}
      demoMode={DEMO_MODE}
      repoUrl={REPO_URL}
      logout={logout}
    >
      {children}
    </AppShell>
  );
}
