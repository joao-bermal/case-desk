'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import { SIDEBAR } from '@/theme';

import { Brand } from './common';

const POINTS = [
  'Processos, empresas clientes e advogados num lugar só.',
  'Cada perfil vê só o que é dele: secretaria, advogado e cliente.',
  'Edição direto na tabela, filtros, colunas e exportação para Excel.',
];

/** Split screen of the 2022 login: dark brand panel on the left, the form on the right. */
export function AuthLayout({ children, repoUrl }: { children: ReactNode; repoUrl?: string }) {
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
        <Brand tone="light" size={36} />
        <Box sx={{ maxWidth: 440 }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 2 }}>
            O escritório inteiro acompanhando os mesmos processos.
          </Typography>
          <Stack spacing={1.5}>
            {POINTS.map((point) => (
              <Stack key={point} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleOutlinedIcon sx={{ color: 'secondary.main', mt: 0.25 }} fontSize="small" />
                <Typography variant="body2">{point}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Typography variant="caption" sx={{ color: SIDEBAR.muted }}>
          Case Desk · FastAPI, Next.js e MUI
          {repoUrl && (
            <>
              {' · '}
              <Link href={repoUrl} target="_blank" rel="noreferrer" sx={{ color: SIDEBAR.text }}>
                Código e documentação
              </Link>
            </>
          )}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4.5 } }}>
          <Box sx={{ display: { md: 'none' }, mb: 3 }}>
            <Brand size={30} />
          </Box>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
