'use client';

import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';

import { ActionForm, Field } from '@/components/forms';
import { useNotify } from '@/components/Notifier';
import type { Role } from '@/lib/api/client';
import type { FormState } from '@/lib/forms';

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const DEMO: { role: Role; title: string; text: string; icon: ReactNode }[] = [
  { role: 'secretary', title: 'Secretaria', text: 'Cadastra empresas e advogados e distribui os processos.', icon: <BadgeOutlinedIcon /> },
  { role: 'lawyer', title: 'Advogada', text: 'Ana Ribeiro: cuida dos próprios processos.', icon: <GavelOutlinedIcon /> },
  { role: 'client', title: 'Cliente', text: 'Vale Verde Alimentos: acompanha os processos da empresa.', icon: <BusinessOutlinedIcon /> },
];

function DemoButton({ entry, action }: { entry: (typeof DEMO)[number]; action: () => Promise<FormState> }) {
  const [pending, startTransition] = useTransition();
  const notify = useNotify();
  return (
    <ButtonBase
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const state = await action();
          if (state?.error) notify(state.error, 'error');
        })
      }
      sx={{
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{pending ? <CircularProgress size={22} /> : entry.icon}</Box>
      <Box>
        <Typography variant="subtitle2">Entrar como {entry.title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.text}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export function LoginView({
  login,
  demoActions,
}: {
  login: Action;
  demoActions?: Record<Role, () => Promise<FormState>>;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Typography variant="h5" component="h1">
        Bem-vindo de volta!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Faça login na sua conta do Case Desk.
      </Typography>

      {demoActions && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            Demonstração · dados fictícios
          </Typography>
          <Stack spacing={1} sx={{ mt: 1, mb: 3 }}>
            {DEMO.map((entry) => (
              <DemoButton key={entry.role} entry={entry} action={demoActions[entry.role]} />
            ))}
          </Stack>
          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              ou entre com e-mail e senha
            </Typography>
          </Divider>
        </>
      )}

      <ActionForm action={login} submitLabel="Entrar" pendingLabel="Entrando…" fullWidthSubmit notifySuccess={false}>
        <Field name="email" label="E-mail" type="email" autoComplete="email" required />
        <Field
          name="password"
          label="Senha"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}>
                    {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </ActionForm>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
        <Link component={NextLink} href="/esqueci-senha" variant="body2">
          Esqueceu a senha?
        </Link>
        <Typography variant="body2" color="text.secondary">
          Acesso por convite
        </Typography>
      </Stack>
    </>
  );
}
