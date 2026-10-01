import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/Providers';

import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Case Desk', template: '%s | Case Desk' },
  description:
    'Gestão de processos para escritórios de advocacia: empresas clientes, advogados e processos, com acesso por perfil.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
