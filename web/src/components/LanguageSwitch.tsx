'use client';

import ButtonBase from '@mui/material/ButtonBase';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { LOCALE_COOKIE, LOCALE_TAG } from '@/lib/i18n';

import { useLocale } from './LocaleProvider';

/**
 * The pill of joaosantaniello.com: shows the other language ("EN" or "PT") and announces it
 * in that language. The choice is saved for a year and the page re-renders in place.
 */
export function LanguageSwitch({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const target = locale === 'pt' ? 'en' : 'pt';

  return (
    <ButtonBase
      disabled={pending}
      lang={LOCALE_TAG[target]}
      aria-label={target === 'en' ? 'Read in English' : 'Ler em português'}
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => router.refresh());
      }}
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        border: 1,
        borderColor: tone === 'light' ? 'rgba(255,255,255,0.3)' : 'divider',
        color: tone === 'light' ? '#e2e8f0' : 'text.secondary',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        opacity: pending ? 0.6 : 1,
        '&:hover': { bgcolor: tone === 'light' ? 'rgba(255,255,255,0.08)' : 'action.hover' },
      }}
    >
      {target.toUpperCase()}
    </ButtonBase>
  );
}
