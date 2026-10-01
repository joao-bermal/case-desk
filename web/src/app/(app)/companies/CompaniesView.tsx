'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DataGridPro, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid-pro';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { createCompany, deleteCompany, patchCompany } from '@/actions/companies';
import { PageHeader } from '@/components/common';
import { ActionForm, ConfirmDialog, FormDialog } from '@/components/forms';
import { GridToolbar } from '@/components/GridToolbar';
import { useLocale } from '@/components/LocaleProvider';
import { useNotify } from '@/components/Notifier';
import { common, messages } from '@/content/common';
import { companiesCopy } from '@/content/pages';
import { gridLocale } from '@/theme';
import type { Company } from '@/lib/api/client';
import { formatCnpj, formatPhone } from '@/lib/format';

import { CompanyFields } from './CompanyFields';

const EDITABLE = ['legal_name', 'cnpj', 'email', 'phone'] as const;

export function CompaniesView({ companies, canEdit }: { companies: Company[]; canEdit: boolean }) {
  const router = useRouter();
  const notify = useNotify();
  const locale = useLocale();
  const t = companiesCopy[locale];
  const [rows, setRows] = useState(companies);
  // Fresh data from the server (after router.refresh) replaces the local rows.
  const [source, setSource] = useState(companies);
  if (source !== companies) {
    setSource(companies);
    setRows(companies);
  }
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Company | null>(null);

  const processRowUpdate = useCallback(
    async (newRow: Company, oldRow: Company) => {
      const changes: Record<string, string | null> = {};
      for (const field of EDITABLE) {
        if ((newRow[field] ?? '') !== (oldRow[field] ?? '')) changes[field] = newRow[field] || null;
      }
      if (Object.keys(changes).length === 0) return oldRow;
      const result = await patchCompany(newRow.id, changes);
      if (!result.row) throw new Error(result.error ?? messages[locale].notSaved);
      notify(messages[locale].companySaved);
      return result.row;
    },
    [locale, notify],
  );

  const columns = useMemo<GridColDef<Company>[]>(
    () => [
      { field: 'legal_name', headerName: t.columns.legalName, flex: 1.4, minWidth: 240, editable: canEdit },
      {
        field: 'cnpj',
        headerName: t.columns.cnpj,
        width: 190,
        editable: canEdit,
        valueFormatter: (value: string) => formatCnpj(value),
      },
      { field: 'email', headerName: t.columns.email, flex: 1, minWidth: 220, editable: canEdit },
      {
        field: 'phone',
        headerName: t.columns.phone,
        width: 160,
        editable: canEdit,
        valueFormatter: (value: string | null) => formatPhone(value),
      },
      { field: 'active_cases', headerName: t.columns.active, type: 'number', width: 130 },
      { field: 'finished_cases', headerName: t.columns.finished, type: 'number', width: 120 },
      {
        field: 'actions',
        type: 'actions',
        width: canEdit ? 120 : 90,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key="open"
            icon={<OpenInNewIcon fontSize="small" />}
            label={t.openCompany}
            onClick={() => router.push(`/companies/${row.id}`)}
          />,
          <GridActionsCellItem
            key="cases"
            icon={<GavelOutlinedIcon fontSize="small" />}
            label={t.viewCases}
            onClick={() => router.push(`/cases?company=${row.id}`)}
          />,
          ...(canEdit
            ? [
                <GridActionsCellItem
                  key="delete"
                  icon={<DeleteOutlinedIcon fontSize="small" />}
                  label={common[locale].delete}
                  onClick={() => setToDelete(row)}
                />,
              ]
            : []),
        ],
      },
    ],
    [canEdit, locale, router, t],
  );

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={canEdit ? t.subtitleEdit : t.subtitleRead}
        actions={
          canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
              {t.newCompany}
            </Button>
          )
        }
      />
      <Box sx={{ height: { xs: 560, md: 'calc(100vh - 220px)' }, minHeight: 460 }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          showToolbar
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { exportName: locale === 'pt' ? 'empresas' : 'companies' } }}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error: Error) => notify(error.message, 'error')}
          initialState={{ sorting: { sortModel: [{ field: 'legal_name', sort: 'asc' }] }, pinnedColumns: { right: ['actions'] } }}
          localeText={gridLocale(locale, { noRowsLabel: t.empty })}
        />
      </Box>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t.deleteTitle(toDelete?.legal_name ?? '')}
        body={t.deleteBody}
        confirmLabel={common[locale].delete}
        action={() => deleteCompany(toDelete!.id)}
        onDone={(state) => {
          if (!state.success || !toDelete) return;
          setRows((current) => current.filter((r) => r.id !== toDelete.id));
          router.refresh();
        }}
      />

      {canEdit && (
        <FormDialog
          open={creating}
          onClose={() => setCreating(false)}
          title={t.newCompany}
          description={t.newCompanyHint}
        >
          <ActionForm
            action={createCompany}
            submitLabel={t.fields.submit}
            onSuccess={() => {
              setCreating(false);
              router.refresh();
            }}
            secondary={
              <Button color="inherit" onClick={() => setCreating(false)}>
                {common[locale].cancel}
              </Button>
            }
          >
            <CompanyFields />
          </ActionForm>
        </FormDialog>
      )}
    </>
  );
}
