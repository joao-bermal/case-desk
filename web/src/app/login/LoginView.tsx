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
import { useLocale } from '@/components/LocaleProvider';
import { useNotify } from '@/components/Notifier';
import { auth } from '@/content/auth';
import type { Role } from '@/lib/api/client';
import type { FormState } from '@/lib/forms';

type Action = (state: FormState, form: FormData) => Promise<FormState>;

const ICONS: Record<Role, ReactNode> = {
  secretary: <BadgeOutlinedIcon />,
  lawyer: <GavelOutlinedIcon />,
  client: <BusinessOutlinedIcon />,
};

function DemoButton({ title, text, icon, action }: { title: string; text: string; icon: ReactNode; action: () => Promise<FormState> }) {
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
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{pending ? <CircularProgress size={22} /> : icon}</Box>
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export function LoginView({ login, demoActions }: { login: Action; demoActions?: Record<Role, () => Promise<FormState>> }) {
  const t = auth[useLocale()].login;
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Typography variant="h5" component="h1">
        {t.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        {t.subtitle}
      </Typography>

      {demoActions && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t.demoHeading}
          </Typography>
          {t.demoIntro && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t.demoIntro}
            </Typography>
          )}
          <Stack spacing={1} sx={{ mt: 1, mb: 3 }}>
            {t.demoRoles.map((entry) => (
              <DemoButton
                key={entry.role}
                title={t.demoEnter(entry.title)}
                text={entry.text}
                icon={ICONS[entry.role]}
                action={demoActions[entry.role]}
              />
            ))}
          </Stack>
          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t.divider}
            </Typography>
          </Divider>
        </>
      )}

      <ActionForm action={login} submitLabel={t.submit} pendingLabel={t.pending} fullWidthSubmit notifySuccess={false}>
        <Field name="email" label={t.email} type="email" autoComplete="email" required />
        <Field
          name="password"
          label={t.password}
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setVisible((v) => !v)} aria-label={visible ? t.hidePassword : t.showPassword}>
                    {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </ActionForm>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 2 }}>
        <Link component={NextLink} href="/forgot-password" variant="body2">
          {t.forgot}
        </Link>
        <Typography variant="body2" color="text.secondary">
          {t.inviteOnly}
        </Typography>
      </Stack>
    </>
  );
}
