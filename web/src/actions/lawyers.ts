'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { api } from '@/lib/api/client';
import { apiError, formValues, optional, type FormState } from '@/lib/forms';

function lawyerBody(values: Record<string, string>) {
  return {
    full_name: values.full_name ?? '',
    email: values.email ?? '',
    phone: optional(values.phone),
    oab_number: optional(values.oab_number),
  };
}

export async function createLawyer(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/lawyers', { body: lawyerBody(values) });
  if (!data) return apiError(error, values);
  revalidatePath('/advogados');
  redirect(`/advogados/${data.id}`);
}

export async function updateLawyer(lawyerId: number, _: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/lawyers/{lawyer_id}', {
    params: { path: { lawyer_id: lawyerId } },
    body: lawyerBody(values),
  });
  if (!data) return apiError(error, values);
  revalidatePath('/advogados', 'layout');
  revalidatePath('/processos', 'layout');
  return { success: 'Cadastro atualizado.' };
}

export async function setLawyerActive(lawyerId: number, isActive: boolean): Promise<FormState> {
  const { data, error } = await (await api()).PATCH('/lawyers/{lawyer_id}', {
    params: { path: { lawyer_id: lawyerId } },
    body: { is_active: isActive },
  });
  if (!data) return apiError(error);
  revalidatePath('/advogados', 'layout');
  return { success: isActive ? 'Acesso reativado.' : 'Acesso desativado.' };
}
