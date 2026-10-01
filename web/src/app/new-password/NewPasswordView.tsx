'use client';

import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import { ActionForm, Field } from '@/components/forms';
import type { FormState } from '@/lib/forms';

export function NewPasswordView({ action }: { action?: (state: FormState, form: FormData) => Promise<FormState> }) {
  return (
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5" component="h1">
          Criar senha
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use pelo menos 8 caracteres. Depois disso você já entra no sistema.
        </Typography>
      </div>
      {action ? (
        <ActionForm action={action} submitLabel="Salvar senha e entrar" fullWidthSubmit notifySuccess={false}>
          <Field name="new_password" label="Nova senha" type="password" autoComplete="new-password" required />
          <Field name="confirm_password" label="Repita a senha" type="password" autoComplete="new-password" required />
        </ActionForm>
      ) : (
        <Alert severity="error">
          Link incompleto. Abra o link do e-mail de novo ou peça outro em{' '}
          <Link component={NextLink} href="/esqueci-senha">
            Esqueci a senha
          </Link>
          .
        </Alert>
      )}
    </Stack>
  );
}
