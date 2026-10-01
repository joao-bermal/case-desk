import { NextResponse, type NextRequest } from 'next/server';

import { detectLocale, isLocale, LOCALE_COOKIE } from '@/lib/i18n';
import { SESSION_COOKIE } from '@/lib/session-cookie';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/new-password'];
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * 1. First visit: detect the language and keep it in a cookie, also on this request, so the
 *    first page already renders in it.
 * 2. Optimistic check: visitors without a session cookie go to /login before any page
 *    renders. Pages still validate the session with the API, which authorizes every call.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!isPublic && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) return NextResponse.next();
  const locale = detectLocale(request.headers);
  request.cookies.set(LOCALE_COOKIE, locale);
  const response = NextResponse.next({ request });
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.svg|.*\\.(?:svg|png|jpg|webp|ico)$).*)'],
};
