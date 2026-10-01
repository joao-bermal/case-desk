'use client';

import Stack from '@mui/material/Stack';

import { Field } from '@/components/forms';
import { useLocale } from '@/components/LocaleProvider';
import { companiesCopy } from '@/content/pages';
import type { Company } from '@/lib/api/client';

export function CompanyFields({ current }: { current?: Company }) {
  const t = companiesCopy[useLocale()].fields;
  return (
    <>
      <Field name="legal_name" label={t.legalName} defaultValue={current?.legal_name} required autoFocus={!current} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Field
          name="cnpj"
          label={t.cnpj}
          mask="cnpj"
          defaultValue={current?.cnpj}
          helperText={t.cnpjHint}
          required
        />
        <Field name="phone" label={t.phone} mask="phone" defaultValue={current?.phone} />
      </Stack>
      <Field name="email" label={t.email} type="email" defaultValue={current?.email} required />
    </>
  );
}
