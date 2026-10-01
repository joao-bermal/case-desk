/** State returned by server actions to the forms that call them through useActionState. */
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
  /** What the user typed, so a failed submit does not wipe the form. */
  values?: Record<string, string>;
};

export const emptyForm: FormState = {};

export function formValues(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) values[key] = value;
  }
  return values;
}

/** Text fields left blank are sent as null, so optional fields can be cleared. */
export function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Turns an API error body into form state. The API answers {detail, errors?} in the
 * language it was asked for; `fallback` covers network failures with no body.
 */
export function apiError(error: unknown, values?: Record<string, string>, fallback = 'Error'): FormState {
  const body = (error ?? {}) as { detail?: unknown; errors?: Record<string, string> };
  const message = typeof body.detail === 'string' ? body.detail : fallback;
  return { error: message, fieldErrors: body.errors, values };
}

/** The first field error, or the general message: what a grid edit shows in the snackbar. */
export function firstError(state: FormState) {
  return Object.values(state.fieldErrors ?? {})[0] ?? state.error;
}
