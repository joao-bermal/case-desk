'use client';

import EditIcon from '@mui/icons-material/Edit';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { changePassword, updateProfile } from '@/actions/auth';
import { DetailItem, PageHeader } from '@/components/common';
import { ActionForm, Field } from '@/components/forms';
import type { User } from '@/lib/api/client';
import { ROLE_LABEL } from '@/lib/format';

/** A field locked until its pencil is clicked, as in the 2022 profile page. */
function EditableField({ name, label, defaultValue, mask, disabled }: {
  name: string;
  label: string;
  defaultValue?: string | null;
  mask?: 'phone';
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <Field
      name={name}
      label={label}
      defaultValue={defaultValue}
      mask={mask}
      slotProps={{
        htmlInput: { readOnly: !editing },
        input: {
          endAdornment: disabled ? undefined : (
            <InputAdornment position="end">
              <Tooltip title={editing ? 'Editando' : 'Editar'}>
                <IconButton edge="end" onClick={() => setEditing(true)} color={editing ? 'primary' : 'default'} aria-label={`Editar ${label}`}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
      sx={{ '& .MuiInputBase-root': { bgcolor: editing ? 'background.paper' : 'action.hover' } }}
    />
  );
}

function PasswordField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      name={name}
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
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
  );
}

export function AccountView({ user }: { user: User }) {
  const router = useRouter();
  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .map((p, i, all) => (i === 0 || i === all.length - 1 ? p[0] : ''))
    .join('')
    .toUpperCase();

  return (
    <>
      <PageHeader title="Minha conta" subtitle="Seus dados de acesso ao Case Desk." />
      {user.is_demo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Você está numa conta de demonstração, compartilhada com outros visitantes: nome e senha ficam bloqueados.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
                <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700 }}>
                  {initials}
                </Avatar>
                <Stack spacing={0.5}>
                  <Typography variant="h6">{user.full_name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip size="small" label={ROLE_LABEL[user.role]} />
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              {user.is_demo ? (
                <Stack spacing={2}>
                  <DetailItem label="Nome">{user.full_name}</DetailItem>
                  <DetailItem label="Telefone">{user.phone}</DetailItem>
                </Stack>
              ) : (
                <ActionForm action={updateProfile} submitLabel="Atualizar dados" onSuccess={() => router.refresh()}>
                  <EditableField name="full_name" label="Nome" defaultValue={user.full_name} />
                  <EditableField name="phone" label="Telefone" mask="phone" defaultValue={user.phone} />
                  {user.oab_number && <EditableField name="oab" label="OAB" defaultValue={user.oab_number} disabled />}
                  <Typography variant="caption" color="text.secondary">
                    Para trocar o e-mail ou a OAB, fale com a secretaria do escritório.
                  </Typography>
                </ActionForm>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                <LockOutlinedIcon color="action" />
                <Typography variant="h6">Alterar senha</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ao trocar a senha, as sessões nos outros dispositivos são encerradas.
              </Typography>
              {user.is_demo ? (
                <Alert severity="info">Indisponível na conta de demonstração.</Alert>
              ) : (
                <ActionForm action={changePassword} submitLabel="Trocar senha">
                  <PasswordField name="current_password" label="Senha atual" autoComplete="current-password" />
                  <PasswordField name="new_password" label="Nova senha (mínimo de 8 caracteres)" autoComplete="new-password" />
                  <PasswordField name="confirm_password" label="Repita a nova senha" autoComplete="new-password" />
                </ActionForm>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
