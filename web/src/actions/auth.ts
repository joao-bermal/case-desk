'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { messages } from '@/content/common';
import { api, type Role } from '@/lib/api/client';
import { apiError, formValues, optional, type FormState } from '@/lib/forms';
import { getLocale } from '@/lib/locale';
import { clearSession, setSession } from '@/lib/session';

const copy = async () => messages[await getLocale()];

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/auth/login', {
    body: { email: values.email ?? '', password: values.password ?? '' },
  });
  if (!data) return apiError(error, { email: values.email ?? '' }, (await copy()).fallbackError);
  await setSession(data.token, data.expires_at);
  redirect('/cases');
}

export async function demoLogin(role: Role): Promise<FormState> {
  const { data, error } = await (await api()).POST('/auth/demo-login', { body: { role } });
  if (!data) return apiError(error, undefined, (await copy()).fallbackError);
  await setSession(data.token, data.expires_at);
  redirect('/cases');
}

export async function logout() {
  await (await api()).POST('/auth/logout');
  await clearSession();
  redirect('/login');
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const { data, error } = await (await api()).POST('/auth/password-reset', {
    body: { email: values.email ?? '' },
  });
  if (!data) return apiError(error, values, (await copy()).fallbackError);
  return { success: data.detail };
}

export async function setNewPassword(token: string, _: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  if (values.new_password !== values.confirm_password) {
    return { fieldErrors: { confirm_password: m.passwordsDiffer } };
  }
  const { data, error } = await (await api()).POST('/auth/password-reset/confirm', {
    body: { token, new_password: values.new_password ?? '' },
  });
  if (!data) return apiError(error, undefined, m.fallbackError);
  await setSession(data.token, data.expires_at);
  redirect('/cases');
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  const { data, error } = await (await api()).PATCH('/auth/me', {
    body: { full_name: values.full_name, phone: optional(values.phone) },
  });
  if (!data) return apiError(error, values, m.fallbackError);
  revalidatePath('/', 'layout');
  return { success: m.profileSaved };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const m = await copy();
  const values = formValues(form);
  if (values.new_password !== values.confirm_password) {
    return { fieldErrors: { confirm_password: m.passwordsDiffer } };
  }
  const { error, response } = await (await api()).POST('/auth/password', {
    body: { current_password: values.current_password ?? '', new_password: values.new_password ?? '' },
  });
  if (!response.ok) return apiError(error, undefined, m.fallbackError);
  return { success: m.passwordChanged };
}
