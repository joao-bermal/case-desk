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
import { useLocale } from '@/components/LocaleProvider';
import { roleLabel } from '@/content/common';
import { accountCopy } from '@/content/pages';
import type { User } from '@/lib/api/client';

/** A field locked until its pencil is clicked, as in the 2022 profile page. */
function EditableField({ name, label, defaultValue, mask, disabled }: {
  name: string;
  label: string;
  defaultValue?: string | null;
  mask?: 'phone';
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const t = accountCopy[useLocale()];
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
              <Tooltip title={editing ? t.editing : t.edit}>
                <IconButton edge="end" onClick={() => setEditing(true)} color={editing ? 'primary' : 'default'} aria-label={t.editField(label)}>
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
  const t = accountCopy[useLocale()];
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
              <IconButton edge="end" onClick={() => setVisible((v) => !v)} aria-label={visible ? t.hidePassword : t.showPassword}>
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
  const locale = useLocale();
  const t = accountCopy[locale];
  const initials = user.full_name
    .split(' ')
    .filter(Boolean)
    .map((p, i, all) => (i === 0 || i === all.length - 1 ? p[0] : ''))
    .join('')
    .toUpperCase();

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      {user.is_demo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t.demoNotice}
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
                    <Chip size="small" label={roleLabel[locale][user.role]} />
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              {user.is_demo ? (
                <Stack spacing={2}>
                  <DetailItem label={t.name}>{user.full_name}</DetailItem>
                  <DetailItem label={t.phone}>{user.phone}</DetailItem>
                </Stack>
              ) : (
                <ActionForm action={updateProfile} submitLabel={t.save} onSuccess={() => router.refresh()}>
                  <EditableField name="full_name" label={t.name} defaultValue={user.full_name} />
                  <EditableField name="phone" label={t.phone} mask="phone" defaultValue={user.phone} />
                  {user.oab_number && <EditableField name="oab" label={t.oab} defaultValue={user.oab_number} disabled />}
                  <Typography variant="caption" color="text.secondary">
                    {t.emailHint}
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
                <Typography variant="h6">{t.passwordTitle}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t.passwordHint}
              </Typography>
              {user.is_demo ? (
                <Alert severity="info">{t.passwordDemo}</Alert>
              ) : (
                <ActionForm action={changePassword} submitLabel={t.change}>
                  <PasswordField name="current_password" label={t.current} autoComplete="current-password" />
                  <PasswordField name="new_password" label={t.next} autoComplete="new-password" />
                  <PasswordField name="confirm_password" label={t.repeat} autoComplete="new-password" />
                </ActionForm>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
