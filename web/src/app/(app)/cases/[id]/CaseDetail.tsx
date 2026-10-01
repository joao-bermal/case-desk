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
import { useLocale } from '@/components/LocaleProvider';
import { areaLabel, common } from '@/content/common';
import { casesCopy } from '@/content/pages';
import type { CaseItem, Role } from '@/lib/api/client';
import { formatCnpj, formatDate, formatDateTime, formatPhone } from '@/lib/format';

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
  const locale = useLocale();
  const t = casesCopy[locale].detail;
  const isStaff = role !== 'client';
  const mailto = `mailto:${item.lawyer.email}?subject=${encodeURIComponent(t.mailSubject(item.id, item.title))}`;

  return (
    <>
      <PageHeader
        title={item.title}
        back={{ href: '/cases', label: casesCopy[locale].meta }}
        subtitle={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip status={item.status} />
            <span>
              #{item.id} · {areaLabel[locale][item.practice_area]} · {t.openedOn(formatDate(item.created_at, locale))}
            </span>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {isStaff ? t.dataTitle : t.historyTitle}
              </Typography>
              {isStaff ? (
                <ActionForm
                  action={updateCase.bind(null, item.id)}
                  submitLabel={t.save}
                  onSuccess={() => router.refresh()}
                >
                  <CaseFields companies={companies} lawyers={lawyers} current={item} />
                </ActionForm>
              ) : (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                    {item.description || t.noDescription}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    {t.lastUpdate(formatDateTime(item.updated_at, locale))}
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
                  {t.company}
                </Typography>
                <Stack spacing={1.5}>
                  <DetailItem label={t.legalName}>
                    {isStaff ? (
                      <NextLink href={`/companies/${item.company.id}`}>{item.company.legal_name}</NextLink>
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
                  {t.lawyer}
                </Typography>
                <Stack spacing={1.5}>
                  <DetailItem label={t.name}>{item.lawyer.full_name}</DetailItem>
                  {item.lawyer.oab_number && <DetailItem label="OAB">{item.lawyer.oab_number}</DetailItem>}
                  <DetailItem label={t.email}>{item.lawyer.email}</DetailItem>
                  {item.lawyer.phone && <DetailItem label={t.phone}>{formatPhone(item.lawyer.phone)}</DetailItem>}
                </Stack>
                {userId !== item.lawyer.id && (
                  <Button href={mailto} variant="outlined" startIcon={<MailOutlinedIcon />} fullWidth sx={{ mt: 2.5 }}>
                    {t.sendEmail}
                  </Button>
                )}
              </CardContent>
            </Card>

            {role === 'secretary' && (
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
                    confirm={{ title: t.deleteConfirm, body: t.deleteBody(item.title), confirmLabel: common[locale].delete }}
                    action={() => deleteCases([item.id])}
                    onDone={(state) => state.success && router.push('/cases')}
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
