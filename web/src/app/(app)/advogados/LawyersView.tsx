'use client';

import AddIcon from '@mui/icons-material/Add';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { DataGridPro, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid-pro';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { resendInvite } from '@/actions/companies';
import { createLawyer, patchLawyer, setLawyerActive } from '@/actions/lawyers';
import { PageHeader } from '@/components/common';
import { ActionForm, ConfirmDialog, Field, FormDialog } from '@/components/forms';
import { GridToolbar } from '@/components/GridToolbar';
import { useNotify } from '@/components/Notifier';
import { gridLocale } from '@/theme';
import type { Lawyer } from '@/lib/api/client';
import type { FormState } from '@/lib/forms';
import { formatPhone } from '@/lib/format';

const EDITABLE = ['full_name', 'email', 'phone', 'oab_number'] as const;

type Access = 'active' | 'pending' | 'inactive';

function access(lawyer: Lawyer): Access {
  if (!lawyer.is_active) return 'inactive';
  return lawyer.has_password || lawyer.is_demo ? 'active' : 'pending';
}

const ACCESS = {
  active: { label: 'Ativo', color: 'success' },
  pending: { label: 'Convite pendente', color: 'warning' },
  inactive: { label: 'Inativo', color: 'default' },
} as const;

export function LawyersView({ lawyers }: { lawyers: Lawyer[] }) {
  const router = useRouter();
  const notify = useNotify();
  const [rows, setRows] = useState(lawyers);
  // Fresh data from the server (after router.refresh) replaces the local rows.
  const [source, setSource] = useState(lawyers);
  if (source !== lawyers) {
    setSource(lawyers);
    setRows(lawyers);
  }
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<{ lawyer: Lawyer; activate: boolean } | null>(null);

  const replaceRow = (row: Lawyer) => setRows((current) => current.map((r) => (r.id === row.id ? row : r)));

  const run = useCallback(
    async (action: Promise<FormState>) => {
      const state = await action;
      if (state.error) notify(state.error, 'error');
      else if (state.success) notify(state.success);
      router.refresh();
    },
    [notify, router],
  );

  const processRowUpdate = useCallback(
    async (newRow: Lawyer, oldRow: Lawyer) => {
      const changes: Record<string, string | null> = {};
      for (const field of EDITABLE) {
        if ((newRow[field] ?? '') !== (oldRow[field] ?? '')) changes[field] = newRow[field] || null;
      }
      if (Object.keys(changes).length === 0) return oldRow;
      const result = await patchLawyer(newRow.id, changes);
      if (!result.row) throw new Error(result.error ?? 'Não foi possível salvar.');
      notify('Cadastro atualizado.');
      return result.row;
    },
    [notify],
  );

  const columns = useMemo<GridColDef<Lawyer>[]>(
    () => [
      { field: 'full_name', headerName: 'Nome', flex: 1.2, minWidth: 200, editable: true },
      { field: 'oab_number', headerName: 'OAB', width: 150, editable: true },
      { field: 'email', headerName: 'E-mail', flex: 1, minWidth: 230, editable: true },
      {
        field: 'phone',
        headerName: 'Telefone',
        width: 160,
        editable: true,
        valueFormatter: (value: string | null) => formatPhone(value),
      },
      {
        field: 'access',
        headerName: 'Acesso',
        width: 170,
        type: 'singleSelect',
        valueOptions: Object.entries(ACCESS).map(([value, { label }]) => ({ value, label })),
        valueGetter: (_: unknown, row: Lawyer) => access(row),
        renderCell: ({ row }) => {
          const { label, color } = ACCESS[access(row)];
          return <Chip size="small" variant="outlined" color={color} label={label} />;
        },
      },
      { field: 'active_cases', headerName: 'Em andamento', type: 'number', width: 130 },
      {
        field: 'actions',
        type: 'actions',
        width: 130,
        getActions: ({ row }) => {
          const items = [
            <GridActionsCellItem
              key="cases"
              icon={<GavelOutlinedIcon fontSize="small" />}
              label="Ver processos"
              onClick={() => router.push(`/processos?advogado=${row.id}`)}
            />,
          ];
          if (row.is_demo) return items;
          if (access(row) === 'pending') {
            items.push(
              <GridActionsCellItem
                key="invite"
                icon={<SendOutlinedIcon fontSize="small" />}
                label="Reenviar convite"
                onClick={() => run(resendInvite(row.id, '/advogados'))}
              />,
            );
          }
          items.push(
            row.is_active ? (
              <GridActionsCellItem
                key="deactivate"
                icon={<BlockOutlinedIcon fontSize="small" />}
                label="Desativar acesso"
                onClick={() => setConfirm({ lawyer: row, activate: false })}
              />
            ) : (
              <GridActionsCellItem
                key="activate"
                icon={<CheckCircleOutlinedIcon fontSize="small" />}
                label="Reativar acesso"
                onClick={() => setConfirm({ lawyer: row, activate: true })}
              />
            ),
          );
          return items;
        },
      },
    ],
    [router, run],
  );

  return (
    <>
      <PageHeader
        title="Advogados"
        subtitle="Clique duas vezes numa célula para editar. Cada advogado vê só os processos em seu nome."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            Novo advogado
          </Button>
        }
      />
      <Box sx={{ height: { xs: 560, md: 'calc(100vh - 220px)' }, minHeight: 460 }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          showToolbar
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { exportName: 'advogados' } }}
          disableRowSelectionOnClick
          isCellEditable={({ row }) => !row.is_demo}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error: Error) => notify(error.message, 'error')}
          initialState={{ sorting: { sortModel: [{ field: 'full_name', sort: 'asc' }] }, pinnedColumns: { right: ['actions'] } }}
          localeText={gridLocale({ noRowsLabel: 'Nenhum advogado cadastrado.' })}
        />
      </Box>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.activate ? `Reativar o acesso de ${confirm.lawyer.full_name}?` : `Desativar o acesso de ${confirm?.lawyer.full_name}?`}
        body={
          confirm?.activate
            ? 'A pessoa volta a entrar com a senha que já tinha.'
            : 'A pessoa sai de todas as sessões e não entra mais. Os processos continuam no histórico.'
        }
        confirmLabel={confirm?.activate ? 'Reativar' : 'Desativar'}
        danger={!confirm?.activate}
        action={() => setLawyerActive(confirm!.lawyer.id, confirm!.activate)}
        onDone={(state) => {
          if (state.success && confirm) replaceRow({ ...confirm.lawyer, is_active: confirm.activate });
          router.refresh();
        }}
      />

      <FormDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Novo advogado"
        description="A pessoa recebe um convite por e-mail e cria a própria senha."
      >
        <ActionForm
          action={createLawyer}
          submitLabel="Cadastrar e enviar convite"
          onSuccess={() => {
            setCreating(false);
            router.refresh();
          }}
          secondary={
            <Button color="inherit" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          }
        >
          <Field name="full_name" label="Nome completo" required autoFocus />
          <Field name="email" label="E-mail" type="email" required />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field name="oab_number" label="Inscrição na OAB" placeholder="OAB/SP 123.456" />
            <Field name="phone" label="Telefone" mask="phone" />
          </Stack>
        </ActionForm>
      </FormDialog>
    </>
  );
}
