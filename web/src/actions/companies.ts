'use server';

import { revalidatePath } from 'next/cache';

import { api, type Company, type Schemas } from '@/lib/api/client';
import { apiError, formValues, optional, type FormState } from '@/lib/forms';

function companyBody(values: Record<string, string>) {
  return {
    legal_name: values.legal_name ?? '',
    cnpj: values.cnpj ?? '',
    email: values.email ?? '',
    phone: optional(values.phone),
  };
}

function firstError(error: unknown) {
  const state = apiError(error);
  return Object.values(state.fieldErrors ?? {})[0] ?? state.error;
}

export async function createCompany(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/companies', { body: companyBody(values) });
  if (!data) return apiError(error, values);
  revalidatePath('/empresas', 'layout');
  return { success: `${data.legal_name} cadastrada.` };
}

export async function updateCompany(companyId: number, _: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
    body: companyBody(values),
  });
  if (!data) return apiError(error, values);
  revalidatePath('/empresas', 'layout');
  revalidatePath('/processos', 'layout');
  return { success: 'Empresa atualizada.' };
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
  if (!data) return { error: firstError(error) };
  revalidatePath('/empresas', 'layout');
  revalidatePath('/processos', 'layout');
  return { row: data };
}

export async function deleteCompany(companyId: number): Promise<FormState> {
  const { error, response } = await (await api()).DELETE('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
  });
  if (!response.ok) return apiError(error);
  revalidatePath('/empresas', 'layout');
  return { success: 'Empresa excluída.' };
}

export async function inviteClientUser(companyId: number, _: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/companies/{company_id}/users', {
    params: { path: { company_id: companyId } },
    body: { full_name: values.full_name ?? '', email: values.email ?? '', phone: optional(values.phone) },
  });
  if (!data) return apiError(error, values);
  revalidatePath(`/empresas/${companyId}`);
  return { success: `Convite enviado para ${data.email}.` };
}

export async function removeClientUser(companyId: number, userId: number): Promise<FormState> {
  const { error, response } = await (await api()).DELETE('/companies/{company_id}/users/{user_id}', {
    params: { path: { company_id: companyId, user_id: userId } },
  });
  if (!response.ok) return apiError(error);
  revalidatePath(`/empresas/${companyId}`);
  return { success: 'Acesso removido.' };
}

export async function resendInvite(userId: number, revalidate: string): Promise<FormState> {
  const { data, error } = await (await api()).POST('/users/{user_id}/invite', {
    params: { path: { user_id: userId } },
  });
  if (!data) return apiError(error);
  revalidatePath(revalidate);
  return { success: data.detail };
}
