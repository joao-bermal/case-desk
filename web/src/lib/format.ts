import type { CaseStatus, PracticeArea } from '@/lib/api/client';
import { LOCALE_TAG, type Locale } from '@/lib/i18n';

export const STATUSES: CaseStatus[] = ['open', 'in_progress', 'closed', 'archived'];

export const AREAS: PracticeArea[] = ['civil', 'labor', 'tax', 'corporate', 'consumer', 'intellectual_property'];

export function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return '';
  return phone.length === 11
    ? phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    : phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

// The office is in Brazil, so times are shown in Brasília time in both languages.
const TIME_ZONE = 'America/Sao_Paulo';

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { dateStyle: 'short', timeZone: TIME_ZONE }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}
