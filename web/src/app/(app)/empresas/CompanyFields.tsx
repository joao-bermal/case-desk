import { Field } from '@/components/forms';
import type { Company } from '@/lib/api/client';

export function CompanyFields({ current }: { current?: Company }) {
  return (
    <>
      <Field name="legal_name" label="Razão social" defaultValue={current?.legal_name} required autoFocus={!current} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name="cnpj"
          label="CNPJ"
          mask="cnpj"
          defaultValue={current?.cnpj}
          hint="Aceita o formato numérico e o alfanumérico."
          required
        />
        <Field name="phone" label="Telefone" mask="phone" defaultValue={current?.phone} />
      </div>
      <Field name="email" label="E-mail de contato" type="email" defaultValue={current?.email} required />
    </>
  );
}
