/**
 * Two languages, the same rules as joaosantaniello.com: Portuguese by default, English for
 * visitors whose browser and country are not Portuguese-speaking. Unlike the site, the app
 * keeps one URL per page and stores the choice in a cookie, so signed-in pages and links
 * stay the same in both languages.
 */
export type Locale = 'pt' | 'en';

export const LOCALES: Locale[] = ['pt', 'en'];

/** Set by the language switch, or by the proxy on the first visit. */
export const LOCALE_COOKIE = 'cd-lang';

/** BCP 47 tags for <html lang>, Intl and the API's Accept-Language. */
export const LOCALE_TAG: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };

export function isLocale(value: string | undefined): value is Locale {
  return value === 'pt' || value === 'en';
}

const PORTUGUESE_COUNTRIES = /^(BR|PT|AO|MZ|CV|GW|ST|TL)$/i;
const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|linkedin|telegram|discord|embedly|vercel|lighthouse/i;

/**
 * First visit only. Portuguese when any Accept-Language entry is Portuguese, when the
 * country is Portuguese-speaking, for bots and link previews, and when nothing is known.
 */
export function detectLocale(headers: { get(name: string): string | null }): Locale {
  const languages = headers.get('accept-language');
  if (!languages) return 'pt';
  if (BOTS.test(headers.get('user-agent') ?? '')) return 'pt';
  if (/(^|[\s,])pt\b/i.test(languages)) return 'pt';
  if (PORTUGUESE_COUNTRIES.test(headers.get('x-vercel-ip-country') ?? '')) return 'pt';
  return 'en';
}
