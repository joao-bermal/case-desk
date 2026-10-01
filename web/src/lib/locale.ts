import 'server-only';

import { cookies, headers } from 'next/headers';

import { detectLocale, isLocale, LOCALE_COOKIE, type Locale } from '@/lib/i18n';

/** The visitor's language on the server: the cookie, or the same detection as the proxy. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(saved) ? saved : detectLocale(await headers());
}
