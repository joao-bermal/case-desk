import 'server-only';

import createClient from 'openapi-fetch';

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

/** Typed API client that sends the signed-in user's session token. Server side only. */
export async function api() {
  const token = await getSessionToken();
  return createClient<paths>({
    baseUrl: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: 'no-store',
  });
}
