'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LicenseInfo } from '@mui/x-license';
import type { ReactNode } from 'react';

import type { Locale } from '@/lib/i18n';
import { themes } from '@/theme';

import { LocaleProvider } from './LocaleProvider';

import { NotifierProvider } from './Notifier';

// MUI X validates its license in the browser, so the key ships with the bundle by design.
const licenseKey = process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY;
if (licenseKey) LicenseInfo.setLicenseKey(licenseKey);

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <ThemeProvider theme={themes[locale]}>
        <CssBaseline />
        <NotifierProvider>{children}</NotifierProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
