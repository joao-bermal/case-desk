import type { CaseStatus, PracticeArea, Role } from '@/lib/api/client';

export const STATUS_LABEL: Record<CaseStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  closed: 'Concluído',
  archived: 'Arquivado',
};

export const STATUSES = Object.keys(STATUS_LABEL) as CaseStatus[];

export const AREA_LABEL: Record<PracticeArea, string> = {
  civil: 'Cível',
  labor: 'Trabalhista',
  tax: 'Tributário',
  corporate: 'Empresarial',
  consumer: 'Consumidor',
  intellectual_property: 'Propriedade intelectual',
};

export const AREAS = Object.keys(AREA_LABEL) as PracticeArea[];

export const ROLE_LABEL: Record<Role, string> = {
  secretary: 'Secretaria',
  lawyer: 'Advogado(a)',
  client: 'Cliente',
};

export function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return '';
  return phone.length === 11
    ? phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    : phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

/** "há 3 dias", for the case list. */
export function timeAgo(iso: string, now = Date.now()) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}
