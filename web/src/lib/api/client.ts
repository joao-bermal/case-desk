import 'server-only';

import createClient from 'openapi-fetch';

import { LOCALE_TAG } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { getSessionToken } from '@/lib/session';

import type { components, paths } from './schema';

export const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000';

export type Schemas = components['schemas'];
export type User = Schemas['UserOut'];
export type Role = User['role'];
export type CaseItem = Schemas['CaseOut'];
export type CaseStatus = CaseItem['status'];
export type PracticeArea = CaseItem['practice_area'];
export type Company = Schemas['CompanyOut'];
export type CompanyDetail = Schemas['CompanyDetail'];
export type Lawyer = Schemas['LawyerOut'];

/**
 * Typed API client that sends the signed-in user's session token and language, so the
 * API's messages come back in the language on screen. Server side only.
 */
export async function api() {
  const [token, locale] = await Promise.all([getSessionToken(), getLocale()]);
  return createClient<paths>({
    baseUrl: API_URL,
    headers: {
      'Accept-Language': LOCALE_TAG[locale],
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
}
