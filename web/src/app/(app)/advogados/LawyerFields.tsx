import { Field } from '@/components/forms';
import type { Lawyer } from '@/lib/api/client';

export function LawyerFields({ current }: { current?: Lawyer }) {
  return (
    <>
      <Field name="full_name" label="Nome completo" defaultValue={current?.full_name} required autoFocus={!current} />
      <Field
        name="email"
        label="E-mail"
        type="email"
        defaultValue={current?.email}
        hint={current ? undefined : 'O convite para criar a senha vai para este e-mail.'}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="oab_number" label="Inscrição na OAB" defaultValue={current?.oab_number} placeholder="OAB/SP 123.456" />
        <Field name="phone" label="Telefone" mask="phone" defaultValue={current?.phone} />
      </div>
    </>
  );
}
