'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';

import { deleteCompany, inviteClientUser, removeClientUser, resendInvite, updateCompany } from '@/actions/companies';
import { DetailItem, LinkButton, PageHeader } from '@/components/common';
import { ActionButton, ActionForm, Field } from '@/components/forms';
import { useLocale } from '@/components/LocaleProvider';
import { common } from '@/content/common';
import { companiesCopy } from '@/content/pages';
import type { CompanyDetail as Company } from '@/lib/api/client';
import { formatCnpj, formatPhone } from '@/lib/format';

import { CompanyFields } from '../CompanyFields';

export function CompanyDetail({ company, canEdit }: { company: Company; canEdit: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  const t = companiesCopy[locale].detail;
  const path = `/companies/${company.id}`;
  const refresh = () => router.refresh();

  return (
    <>
      <PageHeader
        title={company.legal_name}
        subtitle={t.subtitle(formatCnpj(company.cnpj), company.active_cases, company.finished_cases)}
        back={{ href: '/companies', label: companiesCopy[locale].meta }}
        actions={
          <>
            <LinkButton href={`/cases?company=${company.id}`} variant="outlined" startIcon={<GavelOutlinedIcon />}>
              {t.viewCases}
            </LinkButton>
            <LinkButton href={`/cases?new=1&company=${company.id}`} variant="contained" startIcon={<AddIcon />}>
              {t.newCase}
            </LinkButton>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: canEdit ? 7 : 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t.registration}
              </Typography>
              {canEdit ? (
                <ActionForm action={updateCompany.bind(null, company.id)} submitLabel={t.save} onSuccess={refresh}>
                  <CompanyFields current={company} />
                </ActionForm>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                  <DetailItem label={t.email}>{company.email}</DetailItem>
                  <DetailItem label={t.phone}>{formatPhone(company.phone)}</DetailItem>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {canEdit && (
          <Grid size={{ xs: 12, lg: 5 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6">{t.access}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.accessHint}
                  </Typography>
                  {company.users.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {t.noAccess}
                    </Typography>
                  ) : (
                    <List disablePadding sx={{ mt: 1 }}>
                      {company.users.map((person, index) => (
                        <Fragment key={person.id}>
                          {index > 0 && <Divider component="li" />}
                          <ListItem disableGutters sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                            <ListItemAvatar>
                              <Avatar variant="rounded">{person.full_name[0]}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={person.full_name}
                              secondary={person.email}
                              sx={{ minWidth: 160 }}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={person.has_password || person.is_demo ? 'success' : 'warning'}
                              label={person.has_password || person.is_demo ? t.active : t.pending}
                              sx={{ mt: 1 }}
                            />
                            {!person.is_demo && (
                              <Stack direction="row" spacing={1} sx={{ width: '100%', pl: 7 }}>
                                {!person.has_password && (
                                  <ActionButton
                                    size="small"
                                    startIcon={<SendOutlinedIcon />}
                                    label={t.resend}
                                    action={() => resendInvite(person.id, path)}
                                  />
                                )}
                                <ActionButton
                                  size="small"
                                  color="error"
                                  label={t.remove}
                                  confirm={{ title: t.removeTitle(person.full_name), confirmLabel: t.removeConfirm }}
                                  action={() => removeClientUser(company.id, person.id)}
                                  onDone={refresh}
                                />
                              </Stack>
                            )}
                          </ListItem>
                        </Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <PersonAddOutlinedIcon color="action" />
                    <Typography variant="h6">{t.invite}</Typography>
                  </Stack>
                  <ActionForm
                    action={inviteClientUser.bind(null, company.id)}
                    submitLabel={t.inviteSubmit}
                    pendingLabel={t.invitePending}
                    onSuccess={refresh}
                  >
                    <Field name="full_name" label={t.inviteName} required />
                    <Field name="email" label={t.inviteEmail} type="email" helperText={t.inviteEmailHint} required />
                    <Field name="phone" label={t.invitePhone} mask="phone" />
                  </ActionForm>
                </CardContent>
              </Card>

              <Card sx={{ borderColor: 'error.light' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {t.deleteTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t.deleteHint}
                  </Typography>
                  <ActionButton
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlinedIcon />}
                    label={t.deleteTitle}
                    confirm={{ title: t.deleteConfirm(company.legal_name), confirmLabel: common[locale].delete }}
                    action={() => deleteCompany(company.id)}
                    onDone={(state) => state.success && router.push('/companies')}
                  />
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        )}
      </Grid>
    </>
  );
}
