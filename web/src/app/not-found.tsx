import Link from 'next/link';

import { buttonClass, Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo />
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">
        O endereço não existe ou o seu perfil não tem acesso a ele.
      </p>
      <Link href="/processos" className={buttonClass.secondary}>
        Ir para os processos
      </Link>
    </main>
  );
}
