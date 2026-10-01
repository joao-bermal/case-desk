'use server';

import { revalidatePath } from 'next/cache';

import { api, type Lawyer, type Schemas } from '@/lib/api/client';
import { apiError, formValues, optional, type FormState } from '@/lib/forms';

export async function createLawyer(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/lawyers', {
    body: {
      full_name: values.full_name ?? '',
      email: values.email ?? '',
      phone: optional(values.phone),
      oab_number: optional(values.oab_number),
    },
  });
  if (!data) return apiError(error, values);
  revalidatePath('/advogados');
  return { success: `${data.full_name} cadastrado(a). O convite foi enviado para ${data.email}.` };
}

/** Inline edit from the grid, answered with the saved lawyer. */
export async function patchLawyer(
  lawyerId: number,
  changes: Schemas['LawyerUpdate'],
): Promise<{ row?: Lawyer; error?: string }> {
  const { data, error } = await (await api()).PATCH('/lawyers/{lawyer_id}', {
    params: { path: { lawyer_id: lawyerId } },
    body: changes,
  });
  if (!data) {
    const state = apiError(error);
    return { error: Object.values(state.fieldErrors ?? {})[0] ?? state.error };
  }
  revalidatePath('/advogados');
  revalidatePath('/processos', 'layout');
  return { row: data };
}

export async function setLawyerActive(lawyerId: number, isActive: boolean): Promise<FormState> {
  const result = await patchLawyer(lawyerId, { is_active: isActive });
  if (result.error) return { error: result.error };
  return { success: isActive ? 'Acesso reativado.' : 'Acesso desativado.' };
}
