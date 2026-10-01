'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { Locale } from '@/lib/i18n';

const LocaleContext = createContext<Locale>('pt');

/** The language chosen on the server (cookie), shared with every client component. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
