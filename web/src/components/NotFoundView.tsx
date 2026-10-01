'use client';

import SearchOffIcon from '@mui/icons-material/SearchOff';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { common } from '@/content/common';

import { LinkButton } from './common';
import { useLocale } from './LocaleProvider';

/** Records outside the user's scope land here too, the same 404 the API answers. */
export function NotFoundView() {
  const t = common[useLocale()].notFound;
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '50vh', px: 2 }}>
      <SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="h5">{t.title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        {t.body}
      </Typography>
      <LinkButton href="/cases" variant="outlined">
        {t.cta}
      </LinkButton>
    </Stack>
  );
}
