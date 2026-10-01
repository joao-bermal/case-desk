'use client';

import Stack from '@mui/material/Stack';

import { AutocompleteField, Field, SelectField } from '@/components/forms';
import type { CaseItem } from '@/lib/api/client';
import { AREA_LABEL, AREAS, formatCnpj, STATUS_LABEL, STATUSES } from '@/lib/format';

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
  return (
    <>
      <Field name="title" label="Título do processo" defaultValue={current?.title} required autoFocus={!current} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <SelectField
          name="practice_area"
          label="Área"
          defaultValue={current?.practice_area}
          placeholder="Escolha a área"
          options={AREAS.map((area) => ({ value: area, label: AREA_LABEL[area] }))}
          required
        />
        <SelectField
          name="status"
          label="Situação"
          defaultValue={current?.status ?? 'open'}
          options={STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] }))}
        />
      </Stack>
      <AutocompleteField
        name="company_id"
        label="Empresa cliente"
        defaultValue={current?.company.id ?? defaultCompanyId}
        options={companies.map((c) => ({ value: String(c.id), label: `${c.legal_name} (${formatCnpj(c.cnpj)})` }))}
        required
      />
      {lawyers && (
        <SelectField
          name="lawyer_id"
          label="Advogado responsável"
          defaultValue={current?.lawyer.id}
          placeholder="Escolha o advogado"
          options={lawyers
            .filter((l) => l.is_active || l.id === current?.lawyer.id)
            .map((l) => ({ value: String(l.id), label: l.full_name }))}
          required
        />
      )}
      <Field
        name="description"
        label="Descrição e andamento"
        helperText="Contexto, prazos e próximos passos. A empresa cliente também vê este texto."
        defaultValue={current?.description}
        multiline
        minRows={4}
      />
    </>
  );
}
