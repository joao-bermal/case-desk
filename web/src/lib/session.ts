import 'server-only';

import { cookies } from 'next/headers';

import { SESSION_COOKIE } from '@/lib/session-cookie';

/*
 * The API's session token lives in an httpOnly cookie on the web app's domain. Browser code
 * never sees it: server components and server actions read it and call the API with it.
 */

export async function getSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
