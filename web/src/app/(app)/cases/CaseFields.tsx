'use client';

import Stack from '@mui/material/Stack';

import { AutocompleteField, Field, SelectField } from '@/components/forms';
import { useLocale } from '@/components/LocaleProvider';
import { areaLabel, statusLabel } from '@/content/common';
import { casesCopy } from '@/content/pages';
import type { CaseItem } from '@/lib/api/client';
import { AREAS, formatCnpj, STATUSES } from '@/lib/format';

export type CompanyOption = { id: number; legal_name: string; cnpj: string };
export type LawyerOption = { id: number; full_name: string; is_active: boolean };

/** Fields shared by the new case dialog and the case page. */
export function CaseFields({
  companies,
  lawyers,
  current,
  defaultCompanyId,
}: {
  companies: CompanyOption[];
  /** Only the secretary assigns lawyers; lawyers always work on their own cases. */
  lawyers?: LawyerOption[];
  current?: CaseItem;
  defaultCompanyId?: number;
}) {
  const locale = useLocale();
  const t = casesCopy[locale].fields;
  return (
    <>
      <Field name="title" label={t.title} defaultValue={current?.title} required autoFocus={!current} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <SelectField
          name="practice_area"
          label={t.area}
          defaultValue={current?.practice_area}
          placeholder={t.areaPlaceholder}
          options={AREAS.map((area) => ({ value: area, label: areaLabel[locale][area] }))}
          required
        />
        <SelectField
          name="status"
          label={t.status}
          defaultValue={current?.status ?? 'open'}
          options={STATUSES.map((status) => ({ value: status, label: statusLabel[locale][status] }))}
        />
      </Stack>
      <AutocompleteField
        name="company_id"
        label={t.company}
        defaultValue={current?.company.id ?? defaultCompanyId}
        options={companies.map((c) => ({ value: String(c.id), label: `${c.legal_name} (${formatCnpj(c.cnpj)})` }))}
        required
      />
      {lawyers && (
        <SelectField
          name="lawyer_id"
          label={t.lawyer}
          defaultValue={current?.lawyer.id}
          placeholder={t.lawyerPlaceholder}
          options={lawyers
            .filter((l) => l.is_active || l.id === current?.lawyer.id)
            .map((l) => ({ value: String(l.id), label: l.full_name }))}
          required
        />
      )}
      <Field
        name="description"
        label={t.description}
        helperText={t.descriptionHint}
        defaultValue={current?.description}
        multiline
        minRows={4}
      />
    </>
  );
}
