'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LicenseInfo } from '@mui/x-license';
import type { ReactNode } from 'react';

import { theme } from '@/theme';

import { NotifierProvider } from './Notifier';

// MUI X validates its license in the browser, so the key ships with the bundle by design.
const licenseKey = process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY;
if (licenseKey) LicenseInfo.setLicenseKey(licenseKey);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotifierProvider>{children}</NotifierProvider>
    </ThemeProvider>
  );
}
