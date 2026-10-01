/* Sign in, password pages and the brand panel. No em or en dashes in copy. */
import type { Role } from '@/lib/api/client';
import type { Locale } from '@/lib/i18n';

type DemoRole = { role: Role; title: string; text: string };

type AuthCopy = {
  panel: { headline: string; points: string[]; about: string | null; credit: string; code: string };
  login: {
    title: string;
    subtitle: string;
    demoHeading: string;
    demoIntro: string | null;
    demoRoles: DemoRole[];
    demoEnter: (title: string) => string;
    divider: string;
    email: string;
    password: string;
    submit: string;
    pending: string;
    forgot: string;
    inviteOnly: string;
    showPassword: string;
    hidePassword: string;
  };
  forgot: { title: string; body: string; demoNotice: string; email: string; submit: string; pending: string; back: string };
  newPassword: {
    title: string;
    body: string;
    password: string;
    repeat: string;
    submit: string;
    broken: string;
    askAgain: string;
  };
  meta: { login: string; forgot: string; newPassword: string; description: string };
};

export const auth: Record<Locale, AuthCopy> = {
  pt: {
    panel: {
      headline: 'O escritório inteiro acompanhando os mesmos processos.',
      points: [
        'Processos, empresas clientes e advogados num lugar só.',
        'Cada perfil vê só o que é dele: secretaria, advogado e cliente.',
        'Edição direto na tabela, filtros, colunas e exportação para Excel.',
      ],
      about: null,
      credit: 'Case Desk · FastAPI, Next.js e MUI',
      code: 'Código e documentação',
    },
    login: {
      title: 'Bem-vindo de volta!',
      subtitle: 'Faça login na sua conta do Case Desk.',
      demoHeading: 'Demonstração · dados fictícios',
      demoIntro: null,
      demoRoles: [
        { role: 'secretary', title: 'Secretaria', text: 'Cadastra empresas e advogados e distribui os processos.' },
        { role: 'lawyer', title: 'Advogada', text: 'Ana Ribeiro: cuida dos próprios processos.' },
        { role: 'client', title: 'Cliente', text: 'Vale Verde Alimentos: acompanha os processos da empresa.' },
      ],
      demoEnter: (title) => `Entrar como ${title}`,
      divider: 'ou entre com e-mail e senha',
      email: 'E-mail',
      password: 'Senha',
      submit: 'Entrar',
      pending: 'Entrando…',
      forgot: 'Esqueceu a senha?',
      inviteOnly: 'Acesso por convite',
      showPassword: 'Mostrar senha',
      hidePassword: 'Esconder senha',
    },
    forgot: {
      title: 'Esqueceu a senha?',
      body: 'Informe o e-mail da sua conta. Se ele estiver cadastrado, enviamos um link para criar uma senha nova, válido por 30 minutos.',
      demoNotice: 'Na demonstração nenhum e-mail é enviado. Use os perfis da tela de entrada.',
      email: 'E-mail',
      submit: 'Enviar link',
      pending: 'Enviando…',
      back: 'Voltar para a entrada',
    },
    newPassword: {
      title: 'Criar senha',
      body: 'Use pelo menos 8 caracteres. Depois disso você já entra no sistema.',
      password: 'Nova senha',
      repeat: 'Repita a senha',
      submit: 'Salvar senha e entrar',
      broken: 'Link incompleto. Abra o link do e-mail de novo ou peça outro em',
      askAgain: 'Esqueci a senha',
    },
    meta: {
      login: 'Entrar',
      forgot: 'Esqueci a senha',
      newPassword: 'Criar senha',
      description:
        'Gestão de processos para escritórios de advocacia: empresas clientes, advogados e processos, com acesso por perfil.',
    },
  },
  en: {
    panel: {
      headline: 'The whole law office on the same cases.',
      points: [
        'Cases, client companies and lawyers in one place.',
        'Each role sees only its own work: secretary, lawyer and client.',
        'Edit right in the table, filter, pick columns and export to Excel.',
      ],
      about:
        'Built for a Brazilian law office, so the demo records are in Portuguese. A CNPJ is the Brazilian company registration number, and OAB is the Brazilian bar association, which numbers every lawyer.',
      credit: 'Case Desk · FastAPI, Next.js and MUI',
      code: 'Source and docs',
    },
    login: {
      title: 'Welcome back!',
      subtitle: 'Sign in to your Case Desk account.',
      demoHeading: 'Demo · fictional data',
      demoIntro:
        'Try it in one click as any of the three roles. The cases belong to a fictional Brazilian law office, so they are written in Portuguese.',
      demoRoles: [
        { role: 'secretary', title: 'Secretary', text: 'Adds companies and lawyers and assigns the cases.' },
        { role: 'lawyer', title: 'Lawyer', text: 'Ana Ribeiro: works only on her own cases.' },
        { role: 'client', title: 'Client', text: 'Vale Verde Alimentos: follows the company’s cases.' },
      ],
      demoEnter: (title) => `Sign in as ${title}`,
      divider: 'or sign in with email and password',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      pending: 'Signing in…',
      forgot: 'Forgot your password?',
      inviteOnly: 'Access by invite only',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
    },
    forgot: {
      title: 'Forgot your password?',
      body: 'Enter your account email. If it is registered, we send a link to set a new password. It works for 30 minutes.',
      demoNotice: 'The demo sends no emails. Use the roles on the sign in page.',
      email: 'Email',
      submit: 'Send link',
      pending: 'Sending…',
      back: 'Back to sign in',
    },
    newPassword: {
      title: 'Set your password',
      body: 'Use at least 8 characters. You are signed in right after.',
      password: 'New password',
      repeat: 'Repeat the password',
      submit: 'Save password and sign in',
      broken: 'This link is incomplete. Open the link in the email again, or ask for a new one at',
      askAgain: 'Forgot password',
    },
    meta: {
      login: 'Sign in',
      forgot: 'Forgot password',
      newPassword: 'Set password',
      description: 'Case management for law offices: client companies, lawyers and cases, with access by role.',
    },
  },
};
