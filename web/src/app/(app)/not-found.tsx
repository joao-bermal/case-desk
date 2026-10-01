import Link from 'next/link';

import { buttonClass } from '@/components/ui';

/** Records outside the user's scope land here too, the same 404 the API answers. */
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">O endereço não existe ou o seu perfil não tem acesso a ele.</p>
      <Link href="/processos" className={buttonClass.secondary}>
        Ir para os processos
      </Link>
    </div>
  );
}
