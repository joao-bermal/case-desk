'use client';

import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import { ActionForm, Field } from '@/components/forms';
import { useLocale } from '@/components/LocaleProvider';
import { auth } from '@/content/auth';
import type { FormState } from '@/lib/forms';

export function NewPasswordView({ action }: { action?: (state: FormState, form: FormData) => Promise<FormState> }) {
  const t = auth[useLocale()].newPassword;
  return (
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5" component="h1">
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t.body}
        </Typography>
      </div>
      {action ? (
        <ActionForm action={action} submitLabel={t.submit} fullWidthSubmit notifySuccess={false}>
          <Field name="new_password" label={t.password} type="password" autoComplete="new-password" required />
          <Field name="confirm_password" label={t.repeat} type="password" autoComplete="new-password" required />
        </ActionForm>
      ) : (
        <Alert severity="error">
          {t.broken}{' '}
          <Link component={NextLink} href="/forgot-password">
            {t.askAgain}
          </Link>
          .
        </Alert>
      )}
    </Stack>
  );
}
