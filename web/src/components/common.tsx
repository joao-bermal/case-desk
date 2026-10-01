'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { ReactNode } from 'react';

import type { CaseStatus } from '@/lib/api/client';
import { STATUS_LABEL } from '@/lib/format';

export function Brand({ tone = 'dark', size = 32 }: { tone?: 'dark' | 'light'; size?: number }) {
  const ink = tone === 'dark' ? '#0f172a' : '#ffffff';
  const paper = tone === 'dark' ? '#ffffff' : '#0f172a';
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box component="svg" viewBox="0 0 32 32" aria-hidden sx={{ width: size, height: size, flexShrink: 0 }}>
        <rect width="32" height="32" rx="8" fill={ink} />
        <path d="M9 12h14M9 16h14M9 20h9" stroke={paper} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="23" cy="21" r="2.6" fill="#c08a2d" />
      </Box>
      <Typography component="span" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: ink, fontSize: size * 0.56 }}>
        Case Desk
      </Typography>
    </Stack>
  );
}

const STATUS_COLOR: Record<CaseStatus, 'info' | 'warning' | 'success' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  closed: 'success',
  archived: 'default',
};

export function StatusChip({ status, size = 'small' }: { status: CaseStatus; size?: 'small' | 'medium' }) {
  return <Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size={size} variant="outlined" />;
}

export function LinkButton({ href, ...props }: ButtonProps & { href: string }) {
  return <Button component={Link} href={href} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {back && (
        <LinkButton href={back.href} size="small" startIcon={<ArrowBackIcon />} sx={{ mb: 1, ml: -1, color: 'text.secondary' }}>
          {back.label}
        </LinkButton>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <Box>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography component="div" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }} component="div">
        {children || (
          <Box component="span" sx={{ color: 'text.disabled' }}>
            Não informado
          </Box>
        )}
      </Typography>
    </Box>
  );
}
