'use client';

import SearchOffIcon from '@mui/icons-material/SearchOff';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LinkButton } from './common';

/** Records outside the user's scope land here too, the same 404 the API answers. */
export function NotFoundView() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '50vh', px: 2 }}>
      <SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography variant="h5">Página não encontrada</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        O endereço não existe ou o seu perfil não tem acesso a ele.
      </Typography>
      <LinkButton href="/processos" variant="outlined">
        Ir para os processos
      </LinkButton>
    </Stack>
  );
}
