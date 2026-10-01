import { Field, SelectField, TextAreaField } from '@/components/forms';
import type { CaseItem, Company, Lawyer } from '@/lib/api/client';
import { AREA_LABEL, AREAS, formatCnpj, STATUS_LABEL, STATUSES } from '@/lib/format';

/** Fields shared by the new case and edit case forms. */
export function CaseFields({
  companies,
  lawyers,
  current,
  defaultCompanyId,
}: {
  companies: Company[];
  /** Only the secretary assigns lawyers; lawyers always work on their own cases. */
  lawyers?: Lawyer[];
  current?: CaseItem;
  defaultCompanyId?: number;
}) {
  return (
    <>
      <Field name="title" label="Título" defaultValue={current?.title} required autoFocus={!current} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="practice_area"
          label="Área"
          defaultValue={current?.practice_area}
          placeholder="Escolha a área"
          options={AREAS.map((area) => ({ value: area, label: AREA_LABEL[area] }))}
        />
        <SelectField
          name="status"
          label="Situação"
          defaultValue={current?.status ?? 'open'}
          options={STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="company_id"
          label="Empresa cliente"
          defaultValue={String(current?.company.id ?? defaultCompanyId ?? '')}
          placeholder="Escolha a empresa"
          options={companies.map((c) => ({ value: String(c.id), label: `${c.legal_name} (${formatCnpj(c.cnpj)})` }))}
        />
        {lawyers && (
          <SelectField
            name="lawyer_id"
            label="Advogado responsável"
            defaultValue={String(current?.lawyer.id ?? '')}
            placeholder="Escolha o advogado"
            options={lawyers
              .filter((l) => l.is_active || l.id === current?.lawyer.id)
              .map((l) => ({ value: String(l.id), label: l.full_name }))}
          />
        )}
      </div>
      <TextAreaField
        name="description"
        label="Descrição"
        hint="Contexto, prazos e próximos passos. A empresa cliente também vê este texto."
        defaultValue={current?.description}
        rows={5}
      />
    </>
  );
}
