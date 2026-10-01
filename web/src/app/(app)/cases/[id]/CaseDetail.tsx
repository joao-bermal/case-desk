'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

import { deleteCases, updateCase } from '@/actions/cases';
import { DetailItem, PageHeader, StatusChip } from '@/components/common';
import { ActionButton, ActionForm } from '@/components/forms';
import type { CaseItem, Role } from '@/lib/api/client';
import { AREA_LABEL, formatCnpj, formatDate, formatDateTime, formatPhone } from '@/lib/format';

import { CaseFields, type CompanyOption, type LawyerOption } from '../CaseFields';

export function CaseDetail({
  item,
  role,
  userId,
  companies,
  lawyers,
}: {
  item: CaseItem;
  role: Role;
  userId: number;
  companies: CompanyOption[];
  lawyers?: LawyerOption[];
}) {
  const router = useRouter();
  const isStaff = role !== 'client';
  const mailto = `mailto:${item.lawyer.email}?subject=${encodeURIComponent(`Processo #${item.id}: ${item.title}`)}`;

  return (
    <>
      <PageHeader
        title={item.title}
        back={{ href: '/processos', label: 'Processos' }}
        subtitle={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip status={item.status} />
            <span>
              #{item.id} · {AREA_LABEL[item.practice_area]} · aberto em {formatDate(item.created_at)}
            </span>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {isStaff ? 'Dados do processo' : 'Andamento'}
              </Typography>
              {isStaff ? (
                <ActionForm
                  action={updateCase.bind(null, item.id)}
                  submitLabel="Salvar alterações"
                  onSuccess={() => router.refresh()}
                >
                  <CaseFields companies={companies} lawyers={lawyers} current={item} />
                </ActionForm>
              ) : (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {item.description || 'O advogado ainda não registrou uma descrição.'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    Última atualização em {formatDateTime(item.updated_at)}.
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Empresa cliente
                </Typography>
                <Stack spacing={1.5}>
                  <DetailItem label="Razão social">
                    {isStaff ? (
                      <NextLink href={`/empresas/${item.company.id}`}>{item.company.legal_name}</NextLink>
                    ) : (
                      item.company.legal_name
                    )}
                  </DetailItem>
                  <DetailItem label="CNPJ">{formatCnpj(item.company.cnpj)}</DetailItem>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Advogado responsável
                </Typography>
                <Stack spacing={1.5}>
                  <DetailItem label="Nome">{item.lawyer.full_name}</DetailItem>
                  {item.lawyer.oab_number && <DetailItem label="OAB">{item.lawyer.oab_number}</DetailItem>}
                  <DetailItem label="E-mail">{item.lawyer.email}</DetailItem>
                  {item.lawyer.phone && <DetailItem label="Telefone">{formatPhone(item.lawyer.phone)}</DetailItem>}
                </Stack>
                {userId !== item.lawyer.id && (
                  <Button href={mailto} variant="outlined" startIcon={<MailOutlinedIcon />} fullWidth sx={{ mt: 2.5 }}>
                    Enviar e-mail
                  </Button>
                )}
              </CardContent>
            </Card>

            {role === 'secretary' && (
              <Card sx={{ borderColor: 'error.light' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Excluir processo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Remove o processo de vez. Para guardar o histórico, use a situação Arquivado.
                  </Typography>
                  <ActionButton
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlinedIcon />}
                    label="Excluir processo"
                    confirm={{ title: 'Excluir este processo?', body: `"${item.title}" será removido de vez.`, confirmLabel: 'Excluir' }}
                    action={() => deleteCases([item.id])}
                    onDone={(state) => state.success && router.push('/processos')}
                  />
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
