'use server';

import { revalidatePath } from 'next/cache';

import { messages } from '@/content/common';
import { api, type Lawyer, type Schemas } from '@/lib/api/client';
import { apiError, firstError, formValues, optional, type FormState } from '@/lib/forms';
import { getLocale } from '@/lib/locale';

const copy = async () => messages[await getLocale()];

export async function createLawyer(_: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/lawyers', {
    body: {
      full_name: values.full_name ?? '',
      email: values.email ?? '',
      phone: optional(values.phone),
      oab_number: optional(values.oab_number),
    },
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/lawyers');
  return { success: m.lawyerCreated(data.full_name, data.email) };
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
  if (!data) return { error: firstError(apiError(error, undefined, (await copy()).fallbackError)) };
  revalidatePath('/lawyers');
  revalidatePath('/cases', 'layout');
  return { row: data };
}

export async function setLawyerActive(lawyerId: number, isActive: boolean): Promise<FormState> {
  const m = await copy();
  const result = await patchLawyer(lawyerId, { is_active: isActive });
  if (result.error) return { error: result.error };
  return { success: isActive ? m.accessRestored : m.accessRevoked };
}
