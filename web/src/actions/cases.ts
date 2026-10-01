'use server';

import { revalidatePath } from 'next/cache';

import { messages } from '@/content/common';
import { api, type CaseItem, type Schemas } from '@/lib/api/client';
import { apiError, firstError, formValues, type FormState } from '@/lib/forms';
import { getLocale } from '@/lib/locale';

const id = (value: string | undefined) => (value ? Number(value) : undefined);
const copy = async () => messages[await getLocale()];

/** Blank fields go out as undefined, so the API answers "required" for them. */
function caseBody(values: Record<string, string>) {
  return {
    title: values.title || undefined,
    practice_area: values.practice_area || undefined,
    status: values.status || undefined,
    description: values.description ?? '',
    company_id: id(values.company_id),
    lawyer_id: id(values.lawyer_id),
  };
}

export async function createCase(_: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/cases', {
    body: caseBody(values) as Schemas['CaseIn'],
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/cases', 'layout');
  return { success: m.caseCreated(data.id) };
}

export async function updateCase(caseId: number, _: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/cases/{case_id}', {
    params: { path: { case_id: caseId } },
    body: caseBody(values) as Schemas['CaseUpdate'],
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/cases', 'layout');
  return { success: m.caseSaved };
}

/** Inline edit from the grid: one or more fields, answered with the saved case. */
export async function patchCase(
  caseId: number,
  changes: Schemas['CaseUpdate'],
): Promise<{ row?: CaseItem; error?: string }> {
  const { data, error } = await (await api()).PATCH('/cases/{case_id}', {
    params: { path: { case_id: caseId } },
    body: changes,
  });
  if (!data) return { error: firstError(apiError(error, undefined, (await copy()).fallbackError)) };
  revalidatePath('/cases', 'layout');
  return { row: data };
}

export async function deleteCases(ids: number[]): Promise<FormState> {
  const m = await copy();
  const { data, error } = await (await api()).DELETE('/cases', { params: { query: { ids } } });
  if (!data) return apiError(error, undefined, m.fallbackError);
  revalidatePath('/cases', 'layout');
  return { success: m.casesDeleted(data.deleted) };
}
