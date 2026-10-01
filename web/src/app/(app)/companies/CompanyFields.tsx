'use client';

import Stack from '@mui/material/Stack';

import { Field } from '@/components/forms';
import type { Company } from '@/lib/api/client';

export function CompanyFields({ current }: { current?: Company }) {
  return (
    <>
      <Field name="legal_name" label="Razão social" defaultValue={current?.legal_name} required autoFocus={!current} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Field
          name="cnpj"
          label="CNPJ"
          mask="cnpj"
          defaultValue={current?.cnpj}
          helperText="Numérico ou alfanumérico."
          required
        />
        <Field name="phone" label="Telefone" mask="phone" defaultValue={current?.phone} />
      </Stack>
      <Field name="email" label="E-mail de contato" type="email" defaultValue={current?.email} required />
    </>
  );
}
