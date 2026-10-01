import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/session-cookie';

const PUBLIC_PATHS = ['/login', '/esqueci-senha', '/nova-senha'];

/**
 * Optimistic check: visitors without a session cookie go to /login before any page renders.
 * Pages still validate the session with the API, and the API authorizes every request.
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
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.svg|.*\.(?:svg|png|jpg|webp|ico)$).*)'],
};
