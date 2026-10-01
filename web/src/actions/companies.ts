'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { api } from '@/lib/api/client';
import { apiError, formValues, optional, type FormState } from '@/lib/forms';

function companyBody(values: Record<string, string>) {
  return {
    legal_name: values.legal_name ?? '',
    cnpj: values.cnpj ?? '',
    email: values.email ?? '',
    phone: optional(values.phone),
  };
}

export async function createCompany(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/companies', { body: companyBody(values) });
  if (!data) return apiError(error, values);
  revalidatePath('/empresas');
  redirect(`/empresas/${data.id}`);
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

export async function deleteCompany(companyId: number): Promise<FormState> {
  const { error, response } = await (await api()).DELETE('/companies/{company_id}', {
    params: { path: { company_id: companyId } },
  });
  if (!response.ok) return apiError(error);
  revalidatePath('/empresas');
  redirect('/empresas');
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
  return {};
}

export async function resendInvite(userId: number, revalidate: string): Promise<FormState> {
  const { data, error } = await (await api()).POST('/users/{user_id}/invite', {
    params: { path: { user_id: userId } },
  });
  if (!data) return apiError(error);
  revalidatePath(revalidate);
  return { success: data.detail };
}
