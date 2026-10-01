'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { auth } from '@/content/auth';
import { SIDEBAR } from '@/theme';

import { Brand } from './common';
import { LanguageSwitch } from './LanguageSwitch';
import { useLocale } from './LocaleProvider';

/** Split screen of the 2022 login: dark brand panel on the left, the form on the right. */
export function AuthLayout({ children, repoUrl }: { children: ReactNode; repoUrl?: string }) {
  const t = auth[useLocale()].panel;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: SIDEBAR.text,
          background: `radial-gradient(circle at 20% 20%, #1e293b 0%, ${SIDEBAR.background} 60%)`,
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Brand tone="light" size={36} />
          <LanguageSwitch tone="light" />
        </Stack>
        <Box sx={{ maxWidth: 460 }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 2 }}>
            {t.headline}
          </Typography>
          <Stack spacing={1.5}>
            {t.points.map((point) => (
              <Stack key={point} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleOutlinedIcon sx={{ color: 'secondary.main', mt: 0.25 }} fontSize="small" />
                <Typography variant="body2">{point}</Typography>
              </Stack>
            ))}
          </Stack>
          {t.about && (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', alignItems: 'flex-start' }}
            >
              <InfoOutlinedIcon sx={{ color: SIDEBAR.text, mt: 0.25 }} fontSize="small" />
              <Typography variant="body2">{t.about}</Typography>
            </Stack>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: SIDEBAR.muted }}>
          {t.credit}
          {repoUrl && (
            <>
              {' · '}
              <Link href={repoUrl} target="_blank" rel="noreferrer" sx={{ color: SIDEBAR.text }}>
                {t.code}
              </Link>
            </>
          )}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4.5 } }}>
          <Stack direction="row" sx={{ display: { md: 'none' }, mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
            <Brand size={30} />
            <LanguageSwitch />
          </Stack>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
