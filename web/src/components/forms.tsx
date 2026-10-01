'use client';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button, { type ButtonProps } from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { createContext, useActionState, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';

import { common } from '@/content/common';
import { emptyForm, type FormState } from '@/lib/forms';

import { useLocale } from './LocaleProvider';
import { useNotify } from './Notifier';

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const FormStateContext = createContext<FormState>(emptyForm);

/**
 * A form bound to a server action. Fields read the action's result from context to show
 * their error and keep what the user typed when the submit fails.
 */
export function ActionForm({
  action,
  submitLabel,
  pendingLabel,
  children,
  secondary,
  onSuccess,
  notifySuccess = true,
  successAlert = false,
  fullWidthSubmit = false,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
  secondary?: ReactNode;
  onSuccess?: (state: FormState) => void;
  notifySuccess?: boolean;
  /** Keep the success message on screen instead of only in the snackbar. */
  successAlert?: boolean;
  fullWidthSubmit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, emptyForm);
  const notify = useNotify();
  const locale = useLocale();
  const handled = useRef<FormState | null>(null);

  useEffect(() => {
    if (state === handled.current || !state.success) return;
    handled.current = state;
    if (notifySuccess) notify(state.success);
    onSuccess?.(state);
  }, [state, notify, notifySuccess, onSuccess]);

  return (
    <FormStateContext value={state}>
      <Stack component="form" action={formAction} noValidate spacing={2}>
        {state.error && <Alert severity="error">{state.error}</Alert>}
        {successAlert && state.success && <Alert severity="success">{state.success}</Alert>}
        {children}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', pt: 0.5 }}>
          <Button type="submit" variant="contained" disabled={pending} fullWidth={fullWidthSubmit}>
            {pending ? (pendingLabel ?? common[locale].saving) : submitLabel}
          </Button>
          {secondary}
        </Stack>
      </Stack>
    </FormStateContext>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useContext(FormStateContext);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue == null ? '' : String(defaultValue));
  return { error, value };
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

export function maskValue(mask: keyof typeof masks, value: string | null | undefined) {
  return value ? masks[mask](value) : '';
}

type FieldProps = Omit<TextFieldProps, 'name' | 'defaultValue' | 'error'> & {
  name: string;
  defaultValue?: string | number | null;
  mask?: keyof typeof masks;
};

export function Field({ name, defaultValue, mask, helperText, slotProps, ...props }: FieldProps) {
  const field = useField(name, mask && typeof defaultValue === 'string' ? masks[mask](defaultValue) : defaultValue);
  return (
    <TextField
      // Remount when the server sends new defaults, so a saved form shows the saved values.
      key={field.value}
      name={name}
      defaultValue={field.value}
      error={Boolean(field.error)}
      helperText={field.error ?? helperText}
      slotProps={{
        ...slotProps,
        htmlInput: {
          ...(slotProps?.htmlInput as object | undefined),
          ...(mask && {
            inputMode: mask === 'phone' ? 'tel' : undefined,
            onInput: (e: React.FormEvent<HTMLInputElement>) => {
              e.currentTarget.value = masks[mask](e.currentTarget.value);
            },
          }),
        },
      }}
      {...props}
    />
  );
}

export function SelectField({
  name,
  defaultValue,
  options,
  placeholder,
  helperText,
  ...props
}: FieldProps & { options: { value: string; label: string }[]; placeholder?: string }) {
  const field = useField(name, defaultValue);
  return (
    <TextField
      key={field.value}
      select
      name={name}
      defaultValue={field.value}
      error={Boolean(field.error)}
      helperText={field.error ?? helperText}
      {...props}
    >
      {placeholder && (
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** Searchable select, like the company picker of the 2022 version. Submits the option's value. */
export function AutocompleteField({
  name,
  label,
  defaultValue,
  options,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const field = useField(name, defaultValue);
  const [selected, setSelected] = useState(() => options.find((o) => o.value === field.value) ?? null);
  return (
    <>
      <Autocomplete
        key={field.value}
        options={options}
        value={selected}
        onChange={(_, option) => setSelected(option)}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        renderInput={(params) => (
          <TextField {...params} label={label} required={required} error={Boolean(field.error)} helperText={field.error} />
        )}
      />
      <input type="hidden" name={name} value={selected?.value ?? ''} />
    </>
  );
}

function useRunAction(action: () => Promise<FormState>, onDone?: (state: FormState) => void) {
  const [pending, startTransition] = useTransition();
  const notify = useNotify();
  const run = (after?: () => void) =>
    startTransition(async () => {
      const state = await action();
      after?.();
      if (state.error) notify(state.error, 'error');
      else if (state.success) notify(state.success);
      onDone?.(state);
    });
  return { pending, run };
}

/** A confirmation dialog that runs a server action; results go to the app snackbar. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  danger = true,
  action,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  action: () => Promise<FormState>;
  onDone?: (state: FormState) => void;
}) {
  const { pending, run } = useRunAction(action, onDone);
  const t = common[useLocale()];
  return (
    <Dialog open={open} onClose={() => !pending && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {body && (
        <DialogContent>
          <DialogContentText>{body}</DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={pending} color="inherit">
          {t.cancel}
        </Button>
        <Button onClick={() => run(onClose)} disabled={pending} variant="contained" color={danger ? 'error' : 'primary'}>
          {pending ? t.wait : (confirmLabel ?? t.confirm)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** A button that runs a server action, after a confirmation dialog when `confirm` is set. */
export function ActionButton({
  action,
  label,
  confirm,
  onDone,
  ...button
}: Omit<ButtonProps, 'action' | 'onClick'> & {
  action: () => Promise<FormState>;
  label: ReactNode;
  confirm?: { title: string; body?: string; confirmLabel?: string };
  onDone?: (state: FormState) => void;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useRunAction(action, onDone);
  return (
    <>
      <Button disabled={pending} onClick={() => (confirm ? setOpen(true) : run())} {...button}>
        {label}
      </Button>
      {confirm && (
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          danger={button.color === 'error'}
          action={action}
          onDone={onDone}
        />
      )}
    </>
  );
}

/** A dialog holding an ActionForm; closes itself when the action succeeds. */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: description ? 0.5 : 2 }}>{title}</DialogTitle>
      <DialogContent>
        {description && <DialogContentText sx={{ mb: 2.5 }}>{description}</DialogContentText>}
        <Stack sx={{ pt: description ? 0 : 1 }}>{children}</Stack>
      </DialogContent>
    </Dialog>
  );
}
