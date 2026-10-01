'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinkButton } from '@/components/common';
import { ActionForm, Field } from '@/components/forms';
import { useLocale } from '@/components/LocaleProvider';
import { auth } from '@/content/auth';
import type { FormState } from '@/lib/forms';

export function ForgotView({
  action,
  demoMode,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  demoMode: boolean;
}) {
  const t = auth[useLocale()].forgot;
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
      {demoMode && <Alert severity="info">{t.demoNotice}</Alert>}
      <ActionForm action={action} submitLabel={t.submit} pendingLabel={t.pending} fullWidthSubmit successAlert notifySuccess={false}>
        <Field name="email" label={t.email} type="email" autoComplete="email" required />
      </ActionForm>
      <LinkButton href="/login" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start', ml: -1 }}>
        {t.back}
      </LinkButton>
    </Stack>
  );
}
