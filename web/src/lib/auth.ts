import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

import { api, type Role, type User } from '@/lib/api/client';
import { getSessionToken } from '@/lib/session';

/** The signed-in user, or null. Cached per request, so layouts and pages share one call. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await getSessionToken())) return null;
  const { data, response } = await (await api()).GET('/auth/me');
  if (response.status === 401) return null;
  if (!data) throw new Error(`GET /auth/me failed with ${response.status}`);
  return data;
});

/**
 * Pages call this first. Roles that may not open the page get a 404, the same answer the
 * API gives for records outside a user's scope. The API checks every request again.
 */
export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (roles.length && !roles.includes(user.role)) notFound();
  return user;
}
