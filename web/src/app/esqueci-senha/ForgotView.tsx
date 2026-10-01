'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinkButton } from '@/components/common';
import { ActionForm, Field } from '@/components/forms';
import type { FormState } from '@/lib/forms';

export function ForgotView({
  action,
  demoMode,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  demoMode: boolean;
}) {
  return (
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5" component="h1">
          Esqueceu a senha?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um link para criar uma senha nova, válido por
          30 minutos.
        </Typography>
      </div>
      {demoMode && <Alert severity="info">Na demonstração nenhum e-mail é enviado. Use os perfis da tela de entrada.</Alert>}
      <ActionForm action={action} submitLabel="Enviar link" pendingLabel="Enviando…" fullWidthSubmit successAlert notifySuccess={false}>
        <Field name="email" label="E-mail" type="email" autoComplete="email" required />
      </ActionForm>
      <LinkButton href="/login" startIcon={<ArrowBackIcon />} sx={{ alignSelf: 'flex-start', ml: -1 }}>
        Voltar para a entrada
      </LinkButton>
    </Stack>
  );
}
