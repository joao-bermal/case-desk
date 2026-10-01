'use client';

import { createContext, useActionState, useContext, type ReactNode } from 'react';

import { emptyForm, type FormState } from '@/lib/forms';

import { buttonClass, Notice } from './ui';

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>(emptyForm);

/**
 * A form bound to a server action. Fields inside read the action's result from context to
 * show their error and keep what the user typed when the submit fails.
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel = 'Salvando…',
  children,
  footer,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, emptyForm);
  return (
    <FormStateContext value={state}>
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.success && <Notice tone="success">{state.success}</Notice>}
        {children}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={pending} className={buttonClass.primary}>
            {pending ? pendingLabel : submitLabel}
          </button>
          {footer}
        </div>
      </form>
    </FormStateContext>
  );
}

const inputClass =
  'mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50 disabled:text-slate-500';

function useField(name: string, defaultValue?: string | null) {
  const state = useContext(FormStateContext);
  const error = state.fieldErrors?.[name];
  return {
    error,
    value: state.values?.[name] ?? defaultValue ?? '',
    className: `${inputClass} ${error ? 'border-red-400' : 'border-slate-300'}`,
    describedBy: error ? `${name}-error` : undefined,
  };
}

function Label({ label, hint, error, name, children }: {
  label: string;
  hint?: string;
  error?: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
      {error ? (
        <span id={`${name}-error`} className="mt-1 block text-xs font-normal text-red-700">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>
      )}
    </label>
  );
}

const masks = {
  cnpj(value: string) {
    const v = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
    return v
      .replace(/^(\w{2})(\w)/, '$1.$2')
      .replace(/^(\w{2})\.(\w{3})(\w)/, '$1.$2.$3')
      .replace(/\.(\w{3})(\w)/, '.$1/$2')
      .replace(/(\w{4})(\w)/, '$1-$2');
  },
  phone(value: string) {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/^(\d{2})(\d*)/, '($1) $2');
    return v;
  },
};

export function Field({
  name,
  label,
  hint,
  defaultValue,
  mask,
  type = 'text',
  ...input
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  mask?: keyof typeof masks;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const field = useField(name, mask && defaultValue ? masks[mask](defaultValue) : defaultValue);
  return (
    <Label label={label} hint={hint} error={field.error} name={name}>
      <input
        name={name}
        type={type}
        defaultValue={field.value}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.describedBy}
        className={field.className}
        inputMode={mask === 'phone' ? 'tel' : undefined}
        onInput={mask ? (e) => (e.currentTarget.value = masks[mask](e.currentTarget.value)) : undefined}
        {...input}
      />
    </Label>
  );
}

export function SelectField({
  name,
  label,
  hint,
  defaultValue,
  options,
  placeholder,
  disabled,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const field = useField(name, defaultValue);
  return (
    <Label label={label} hint={hint} error={field.error} name={name}>
      <select
        name={name}
        defaultValue={field.value}
        disabled={disabled}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.describedBy}
        className={field.className}
        // React resets uncontrolled selects to the first option after an action; the key
        // makes the default re-apply when the server sends a different value.
        key={field.value}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Label>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  defaultValue,
  rows = 4,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  const field = useField(name, defaultValue);
  return (
    <Label label={label} hint={hint} error={field.error} name={name}>
      <textarea
        name={name}
        rows={rows}
        defaultValue={field.value}
        aria-invalid={field.error ? true : undefined}
        aria-describedby={field.describedBy}
        className={field.className}
      />
    </Label>
  );
}

/** A one-button form for destructive or one-off actions, with a confirmation prompt. */
export function ActionButton({
  action,
  label,
  pendingLabel = 'Aguarde…',
  confirm,
  tone = 'secondary',
}: {
  action: Action;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  tone?: keyof typeof buttonClass;
}) {
  const [state, formAction, pending] = useActionState(action, emptyForm);
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className="flex flex-col items-start gap-2"
    >
      <button type="submit" disabled={pending} className={buttonClass[tone]}>
        {pending ? pendingLabel : label}
      </button>
      {state.error && <span className="max-w-sm text-xs text-red-700">{state.error}</span>}
      {state.success && <span className="max-w-sm text-xs text-emerald-700">{state.success}</span>}
    </form>
  );
}
