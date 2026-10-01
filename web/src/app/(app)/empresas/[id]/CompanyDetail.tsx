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
import type { CompanyDetail as Company } from '@/lib/api/client';
import { formatCnpj, formatPhone } from '@/lib/format';

import { CompanyFields } from '../CompanyFields';

export function CompanyDetail({ company, canEdit }: { company: Company; canEdit: boolean }) {
  const router = useRouter();
  const path = `/empresas/${company.id}`;
  const refresh = () => router.refresh();

  return (
    <>
      <PageHeader
        title={company.legal_name}
        subtitle={`CNPJ ${formatCnpj(company.cnpj)} · ${company.active_cases} em andamento · ${company.finished_cases} finalizados`}
        back={{ href: '/empresas', label: 'Empresas' }}
        actions={
          <>
            <LinkButton href={`/processos?empresa=${company.id}`} variant="outlined" startIcon={<GavelOutlinedIcon />}>
              Ver processos
            </LinkButton>
            <LinkButton href={`/processos?novo=1&empresa=${company.id}`} variant="contained" startIcon={<AddIcon />}>
              Novo processo
            </LinkButton>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: canEdit ? 7 : 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cadastro
              </Typography>
              {canEdit ? (
                <ActionForm action={updateCompany.bind(null, company.id)} submitLabel="Salvar alterações" onSuccess={refresh}>
                  <CompanyFields current={company} />
                </ActionForm>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                  <DetailItem label="E-mail">{company.email}</DetailItem>
                  <DetailItem label="Telefone">{formatPhone(company.phone)}</DetailItem>
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
                  <Typography variant="h6">Acessos do cliente</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pessoas da empresa que acompanham os processos. Elas só leem.
                  </Typography>
                  {company.users.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Ninguém da empresa tem acesso ainda.
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
                              label={person.has_password || person.is_demo ? 'Acesso ativo' : 'Convite pendente'}
                              sx={{ mt: 1 }}
                            />
                            {!person.is_demo && (
                              <Stack direction="row" spacing={1} sx={{ width: '100%', pl: 7 }}>
                                {!person.has_password && (
                                  <ActionButton
                                    size="small"
                                    startIcon={<SendOutlinedIcon />}
                                    label="Reenviar convite"
                                    action={() => resendInvite(person.id, path)}
                                  />
                                )}
                                <ActionButton
                                  size="small"
                                  color="error"
                                  label="Remover acesso"
                                  confirm={{ title: `Remover o acesso de ${person.full_name}?`, confirmLabel: 'Remover' }}
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
                    <Typography variant="h6">Convidar pessoa</Typography>
                  </Stack>
                  <ActionForm
                    action={inviteClientUser.bind(null, company.id)}
                    submitLabel="Enviar convite"
                    pendingLabel="Enviando…"
                    onSuccess={refresh}
                  >
                    <Field name="full_name" label="Nome" required />
                    <Field name="email" label="E-mail" type="email" helperText="Recebe um link para criar a senha." required />
                    <Field name="phone" label="Telefone" mask="phone" />
                  </ActionForm>
                </CardContent>
              </Card>

              <Card sx={{ borderColor: 'error.light' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Excluir empresa
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Só é possível excluir empresas sem processos. Os acessos das pessoas da empresa saem junto.
                  </Typography>
                  <ActionButton
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlinedIcon />}
                    label="Excluir empresa"
                    confirm={{ title: `Excluir ${company.legal_name}?`, confirmLabel: 'Excluir' }}
                    action={() => deleteCompany(company.id)}
                    onDone={(state) => state.success && router.push('/empresas')}
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
