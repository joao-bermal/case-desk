import type { Lawyer } from '@/lib/api/client';

export function AccessBadge({ lawyer }: { lawyer: Lawyer }) {
  const [label, style] = !lawyer.is_active
    ? ['Inativo', 'bg-slate-100 text-slate-600 ring-slate-200']
    : lawyer.has_password || lawyer.is_demo
      ? ['Ativo', 'bg-emerald-50 text-emerald-800 ring-emerald-200']
      : ['Convite pendente', 'bg-amber-50 text-amber-800 ring-amber-200'];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {label}
    </span>
  );
}
