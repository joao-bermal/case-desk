import type { Metadata } from 'next';

import { changePassword, updateProfile } from '@/actions/auth';
import { ActionForm, Field } from '@/components/forms';
import { Card, CardTitle, Detail, Notice, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/format';

export const metadata: Metadata = { title: 'Minha conta' };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Minha conta" description={`${ROLE_LABEL[user.role]} · ${user.email}`} />
      {user.is_demo && (
        <div className="mb-6 max-w-3xl">
          <Notice tone="info">
            Você está numa conta de demonstração, compartilhada com outros visitantes: nome e senha ficam bloqueados.
          </Notice>
        </div>
      )}
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Dados pessoais</CardTitle>
          {user.is_demo ? (
            <dl className="grid gap-3">
              <Detail label="Nome">{user.full_name}</Detail>
              <Detail label="E-mail">{user.email}</Detail>
            </dl>
          ) : (
            <ActionForm action={updateProfile} submitLabel="Salvar">
              <Field name="full_name" label="Nome" defaultValue={user.full_name} required />
              <Field name="phone" label="Telefone" mask="phone" defaultValue={user.phone} />
              <p className="text-xs text-slate-500">Para trocar o e-mail, fale com a secretaria do escritório.</p>
            </ActionForm>
          )}
        </Card>
        {!user.is_demo && (
          <Card>
            <CardTitle hint="Ao trocar a senha, as sessões em outros dispositivos são encerradas.">Senha</CardTitle>
            <ActionForm action={changePassword} submitLabel="Trocar senha">
              <Field name="current_password" label="Senha atual" type="password" autoComplete="current-password" required />
              <Field name="new_password" label="Nova senha" type="password" autoComplete="new-password" hint="Pelo menos 8 caracteres." required />
              <Field name="confirm_password" label="Repita a nova senha" type="password" autoComplete="new-password" required />
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
