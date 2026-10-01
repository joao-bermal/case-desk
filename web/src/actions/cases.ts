'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { api, type Schemas } from '@/lib/api/client';
import { apiError, formValues, type FormState } from '@/lib/forms';

const id = (value: string | undefined) => (value ? Number(value) : undefined);

/** Blank fields go out as undefined, so the API answers "Campo obrigatório." for them. */
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
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/cases', {
    body: caseBody(values) as Schemas['CaseIn'],
  });
  if (!data) return apiError(error, values);
  revalidatePath('/processos');
  redirect(`/processos/${data.id}`);
}

export async function updateCase(caseId: number, _: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/cases/{case_id}', {
    params: { path: { case_id: caseId } },
    body: caseBody(values) as Schemas['CaseUpdate'],
  });
  if (!data) return apiError(error, values);
  revalidatePath('/processos', 'layout');
  return { success: 'Processo atualizado.' };
}

export async function deleteCase(caseId: number): Promise<FormState> {
  const { error, response } = await (await api()).DELETE('/cases/{case_id}', {
    params: { path: { case_id: caseId } },
  });
  if (!response.ok) return apiError(error);
  revalidatePath('/processos');
  redirect('/processos');
}
