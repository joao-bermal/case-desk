'use server';

import { revalidatePath } from 'next/cache';

import { messages } from '@/content/common';
import { api, type Company, type Schemas } from '@/lib/api/client';
import { apiError, firstError, formValues, optional, type FormState } from '@/lib/forms';
import { getLocale } from '@/lib/locale';

const copy = async () => messages[await getLocale()];

function companyBody(values: Record<string, string>) {
  return {
    legal_name: values.legal_name ?? '',
    cnpj: values.cnpj ?? '',
    email: values.email ?? '',
    phone: optional(values.phone),
  };
}

export async function createCompany(_: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/companies', { body: companyBody(values) });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/companies', 'layout');
  return { success: m.companyCreated(data.legal_name) };
}

export async function updateCompany(companyId: number, _: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
    body: companyBody(values),
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/companies', 'layout');
  revalidatePath('/cases', 'layout');
  return { success: m.companySaved };
}

/** Inline edit from the grid, answered with the saved company. */
export async function patchCompany(
  companyId: number,
  changes: Schemas['CompanyUpdate'],
): Promise<{ row?: Company; error?: string }> {
  const { data, error } = await (await api()).PATCH('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
    body: changes,
  });
  if (!data) return { error: firstError(apiError(error, undefined, (await copy()).fallbackError)) };
  revalidatePath('/companies', 'layout');
  revalidatePath('/cases', 'layout');
  return { row: data };
}

export async function deleteCompany(companyId: number): Promise<FormState> {
  const m = await copy();
  const { error, response } = await (await api()).DELETE('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
  });
  if (!response.ok) return apiError(error, undefined, m.fallbackError);
  revalidatePath('/companies', 'layout');
  return { success: m.companyDeleted };
}

export async function inviteClientUser(companyId: number, _: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/companies/{company_id}/users', {
    params: { path: { company_id: companyId } },
    body: { full_name: values.full_name ?? '', email: values.email ?? '', phone: optional(values.phone) },
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath(`/companies/${companyId}`);
  return { success: m.inviteSent(data.email) };
}

export async function removeClientUser(companyId: number, userId: number): Promise<FormState> {
  const m = await copy();
  const { error, response } = await (await api()).DELETE('/companies/{company_id}/users/{user_id}', {
    params: { path: { company_id: companyId, user_id: userId } },
  });
  if (!response.ok) return apiError(error, undefined, m.fallbackError);
  revalidatePath(`/companies/${companyId}`);
  return { success: m.accessRemoved };
}

export async function resendInvite(userId: number, revalidate: string): Promise<FormState> {
  const { data, error } = await (await api()).POST('/users/{user_id}/invite', {
    params: { path: { user_id: userId } },
  });
  if (!data) return apiError(error, undefined, (await copy()).fallbackError);
  revalidatePath(revalidate);
  return { success: data.detail };
}
