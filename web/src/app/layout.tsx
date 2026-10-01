import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/Providers';
import { auth } from '@/content/auth';
import { LOCALE_TAG } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';

import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: { default: 'Case Desk', template: '%s | Case Desk' },
    description: auth[locale].meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await getLocale();
  return (
    <html lang={LOCALE_TAG[locale]} className={inter.variable}>
      <body>
        <AppRouterCacheProvider>
          <Providers locale={locale}>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
