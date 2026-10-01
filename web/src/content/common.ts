/*
 * Interface copy shared by every page. No em or en dashes in copy.
 * The demo data itself stays in Portuguese: it is a Brazilian law office.
 */
import type { CaseStatus, PracticeArea, Role } from '@/lib/api/client';
import type { Locale } from '@/lib/i18n';

export const statusLabel: Record<Locale, Record<CaseStatus, string>> = {
  pt: { open: 'Aberto', in_progress: 'Em andamento', closed: 'Concluído', archived: 'Arquivado' },
  en: { open: 'Open', in_progress: 'In progress', closed: 'Closed', archived: 'Archived' },
};

export const areaLabel: Record<Locale, Record<PracticeArea, string>> = {
  pt: {
    civil: 'Cível',
    labor: 'Trabalhista',
    tax: 'Tributário',
    corporate: 'Empresarial',
    consumer: 'Consumidor',
    intellectual_property: 'Propriedade intelectual',
  },
  en: {
    civil: 'Civil',
    labor: 'Labor',
    tax: 'Tax',
    corporate: 'Corporate',
    consumer: 'Consumer',
    intellectual_property: 'Intellectual property',
  },
};

export const roleLabel: Record<Locale, Record<Role, string>> = {
  pt: { secretary: 'Secretaria', lawyer: 'Advogado(a)', client: 'Cliente' },
  en: { secretary: 'Secretary', lawyer: 'Lawyer', client: 'Client' },
};

export const common = {
  pt: {
    saving: 'Salvando…',
    wait: 'Aguarde…',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Excluir',
    notInformed: 'Não informado',
    back: 'Voltar',
    nav: {
      office: 'Escritório',
      cases: 'Processos',
      myCases: 'Meus processos',
      companyCases: 'Processos da empresa',
      companies: 'Empresas',
      lawyers: 'Advogados',
      account: 'Minha conta',
    },
    shell: {
      home: 'Case Desk, início',
      openMenu: 'Abrir menu',
      accountMenu: 'Menu da conta',
      signOut: 'Sair',
      credit: 'Case Desk · FastAPI, Next.js e MUI.',
      code: 'Código',
      demoBanner:
        'Demonstração pública com dados fictícios, restaurados todos os dias às 03:00 (Brasília). Convites e e-mails não são enviados aqui.',
    },
    grid: {
      columns: 'Colunas',
      filters: 'Filtros',
      density: 'Densidade',
      densities: { compact: 'Compacta', standard: 'Padrão', comfortable: 'Confortável' },
      export: 'Exportar',
      search: 'Buscar…',
    },
    notFound: {
      title: 'Página não encontrada',
      body: 'O endereço não existe ou o seu perfil não tem acesso a ele.',
      cta: 'Ir para os processos',
    },
  },
  en: {
    saving: 'Saving…',
    wait: 'Please wait…',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    notInformed: 'Not provided',
    back: 'Back',
    nav: {
      office: 'Law office',
      cases: 'Cases',
      myCases: 'My cases',
      companyCases: 'Company cases',
      companies: 'Companies',
      lawyers: 'Lawyers',
      account: 'My account',
    },
    shell: {
      home: 'Case Desk, home',
      openMenu: 'Open menu',
      accountMenu: 'Account menu',
      signOut: 'Sign out',
      credit: 'Case Desk · FastAPI, Next.js and MUI.',
      code: 'Source',
      demoBanner:
        'Public demo of a Brazilian law office with fictional data, so the case records are in Portuguese. Everything resets daily at 06:00 UTC, and no emails are sent.',
    },
    grid: {
      columns: 'Columns',
      filters: 'Filters',
      density: 'Density',
      densities: { compact: 'Compact', standard: 'Standard', comfortable: 'Comfortable' },
      export: 'Export',
      search: 'Search…',
    },
    notFound: {
      title: 'Page not found',
      body: 'This address does not exist or your role cannot open it.',
      cta: 'Go to cases',
    },
  },
} as const;

/** Messages the server actions return to the snackbar or the form. */
export const messages = {
  pt: {
    fallbackError: 'Não foi possível concluir. Tente de novo.',
    passwordsDiffer: 'As senhas não conferem.',
    profileSaved: 'Dados atualizados.',
    passwordChanged: 'Senha alterada. Os outros dispositivos foram desconectados.',
    caseCreated: (id: number) => `Processo #${id} aberto.`,
    caseSaved: 'Processo atualizado.',
    casesDeleted: (count: number) => (count === 1 ? 'Processo excluído.' : `${count} processos excluídos.`),
    companyCreated: (name: string) => `${name} cadastrada.`,
    companySaved: 'Empresa atualizada.',
    companyDeleted: 'Empresa excluída.',
    inviteSent: (email: string) => `Convite enviado para ${email}.`,
    accessRemoved: 'Acesso removido.',
    lawyerCreated: (name: string, email: string) => `${name} cadastrado(a). O convite foi enviado para ${email}.`,
    lawyerSaved: 'Cadastro atualizado.',
    accessRestored: 'Acesso reativado.',
    accessRevoked: 'Acesso desativado.',
    notSaved: 'Não foi possível salvar.',
  },
  en: {
    fallbackError: 'Something went wrong. Try again.',
    passwordsDiffer: 'The passwords do not match.',
    profileSaved: 'Profile updated.',
    passwordChanged: 'Password changed. Your other devices were signed out.',
    caseCreated: (id: number) => `Case #${id} opened.`,
    caseSaved: 'Case updated.',
    casesDeleted: (count: number) => (count === 1 ? 'Case deleted.' : `${count} cases deleted.`),
    companyCreated: (name: string) => `${name} added.`,
    companySaved: 'Company updated.',
    companyDeleted: 'Company deleted.',
    inviteSent: (email: string) => `Invite sent to ${email}.`,
    accessRemoved: 'Access removed.',
    lawyerCreated: (name: string, email: string) => `${name} added. The invite went to ${email}.`,
    lawyerSaved: 'Profile updated.',
    accessRestored: 'Access restored.',
    accessRevoked: 'Access revoked.',
    notSaved: 'Could not save.',
  },
};
