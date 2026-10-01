'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  DataGridPro,
  GridActionsCellItem,
  type GridColDef,
  type GridFilterModel,
  type GridRowParams,
  type GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { createCase, deleteCases, patchCase } from '@/actions/cases';
import { PageHeader, StatusChip } from '@/components/common';
import { ActionButton, ActionForm, ConfirmDialog, FormDialog } from '@/components/forms';
import { GridToolbar } from '@/components/GridToolbar';
import { useNotify } from '@/components/Notifier';
import { gridLocale } from '@/theme';
import type { CaseItem, CaseStatus, Role, Schemas } from '@/lib/api/client';
import { AREA_LABEL, AREAS, formatCnpj, formatDateTime, formatPhone, STATUS_LABEL, STATUSES } from '@/lib/format';

import { CaseFields, type CompanyOption, type LawyerOption } from './CaseFields';

type Row = {
  id: number;
  title: string;
  practice_area: CaseItem['practice_area'];
  status: CaseStatus;
  description: string;
  company_id: number;
  company_name: string;
  company_cnpj: string;
  lawyer_id: number;
  lawyer_name: string;
  lawyer_email: string;
  lawyer_phone: string | null;
  lawyer_oab: string | null;
  created_at: Date;
  updated_at: Date;
};

function toRow(item: CaseItem): Row {
  return {
    id: item.id,
    title: item.title,
    practice_area: item.practice_area,
    status: item.status,
    description: item.description,
    company_id: item.company.id,
    company_name: item.company.legal_name,
    company_cnpj: item.company.cnpj,
    lawyer_id: item.lawyer.id,
    lawyer_name: item.lawyer.full_name,
    lawyer_email: item.lawyer.email,
    lawyer_phone: item.lawyer.phone,
    lawyer_oab: item.lawyer.oab_number,
    created_at: new Date(item.created_at),
    updated_at: new Date(item.updated_at),
  };
}

const EDITABLE = ['title', 'practice_area', 'status', 'company_id', 'lawyer_id'] as const;
const ACTIVE: CaseStatus[] = ['open', 'in_progress'];
const FINISHED: CaseStatus[] = ['closed', 'archived'];
type Tab = 'active' | 'finished' | 'all';

const STATUS_ACCENT: Record<CaseStatus, string> = {
  open: '#0284c7',
  in_progress: '#d97706',
  closed: '#059669',
  archived: '#94a3b8',
};

const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() };

export function CasesView({
  role,
  userId,
  cases,
  companies,
  lawyers,
  initialCompanyId,
  initialLawyerId,
  openNew,
}: {
  role: Role;
  userId: number;
  cases: CaseItem[];
  companies: CompanyOption[];
  lawyers: LawyerOption[];
  initialCompanyId?: number;
  initialLawyerId?: number;
  openNew?: boolean;
}) {
  const router = useRouter();
  const notify = useNotify();
  const isStaff = role !== 'client';
  const isSecretary = role === 'secretary';

  const [rows, setRows] = useState(() => cases.map(toRow));
  // Fresh data from the server (after router.refresh) replaces the local rows.
  const [source, setSource] = useState(cases);
  if (source !== cases) {
    setSource(cases);
    setRows(cases.map(toRow));
  }

  const [tab, setTab] = useState<Tab>(initialCompanyId || initialLawyerId ? 'all' : 'active');
  const [filterModel, setFilterModel] = useState<GridFilterModel>(() => ({
    items: [
      ...(initialCompanyId ? [{ id: 1, field: 'company_id', operator: 'is', value: initialCompanyId }] : []),
      ...(initialLawyerId ? [{ id: 2, field: 'lawyer_id', operator: 'is', value: initialLawyerId }] : []),
    ],
  }));
  const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION);
  const [creating, setCreating] = useState(Boolean(openNew));
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const counts = useMemo(() => {
    const result = { open: 0, in_progress: 0, closed: 0, archived: 0 } as Record<CaseStatus, number>;
    for (const row of rows) result[row.status] += 1;
    return result;
  }, [rows]);

  const visibleRows = useMemo(
    () => (tab === 'all' ? rows : rows.filter((r) => (tab === 'active' ? ACTIVE : FINISHED).includes(r.status))),
    [rows, tab],
  );

  const filterByStatus = (status: CaseStatus) => {
    setTab('all');
    setFilterModel({ items: [{ id: 3, field: 'status', operator: 'is', value: status }] });
  };

  const removeRows = useCallback((ids: number[]) => {
    setRows((current) => current.filter((r) => !ids.includes(r.id)));
    setSelection(EMPTY_SELECTION);
    router.refresh();
  }, [router]);

  const processRowUpdate = useCallback(
    async (newRow: Row, oldRow: Row) => {
      const changes: Record<string, unknown> = {};
      for (const field of EDITABLE) if (newRow[field] !== oldRow[field]) changes[field] = newRow[field];
      if (Object.keys(changes).length === 0) return oldRow;
      const result = await patchCase(newRow.id, changes as Schemas['CaseUpdate']);
      if (!result.row) throw new Error(result.error ?? 'Não foi possível salvar.');
      notify('Processo atualizado.');
      return toRow(result.row);
    },
    [notify],
  );

  const columns = useMemo<GridColDef<Row>[]>(() => {
    const list: (GridColDef<Row> | false)[] = [
      { field: 'id', headerName: '#', width: 70, type: 'number', align: 'left', headerAlign: 'left' },
      { field: 'title', headerName: 'Processo', flex: 2, minWidth: 300, editable: isStaff },
      {
        field: 'practice_area',
        headerName: 'Área',
        width: 180,
        type: 'singleSelect',
        editable: isStaff,
        valueOptions: AREAS.map((a) => ({ value: a, label: AREA_LABEL[a] })),
      },
      {
        field: 'status',
        headerName: 'Situação',
        width: 160,
        type: 'singleSelect',
        editable: isStaff,
        valueOptions: STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
        renderCell: ({ row }) => <StatusChip status={row.status} />,
      },
      role !== 'client' && {
        field: 'company_id',
        headerName: 'Empresa',
        flex: 1.2,
        minWidth: 220,
        type: 'singleSelect',
        editable: isStaff,
        valueOptions: companies.map((c) => ({ value: c.id, label: c.legal_name })),
      },
      role !== 'lawyer' && {
        field: 'lawyer_id',
        headerName: 'Advogado',
        width: 180,
        type: 'singleSelect',
        editable: isSecretary,
        valueOptions: isSecretary
          ? lawyers.filter((l) => l.is_active).map((l) => ({ value: l.id, label: l.full_name }))
          : Array.from(new Map(rows.map((r) => [r.lawyer_id, r.lawyer_name]))).map(([value, label]) => ({ value, label })),
      },
      {
        field: 'updated_at',
        headerName: 'Atualizado em',
        type: 'dateTime',
        width: 150,
        valueFormatter: (value: Date) => formatDateTime(value.toISOString()),
      },
      { field: 'created_at', headerName: 'Aberto em', type: 'date', width: 130 },
      {
        field: 'actions',
        type: 'actions',
        headerName: '',
        width: isSecretary ? 90 : 60,
        getActions: ({ row }: GridRowParams<Row>) => [
          <GridActionsCellItem
            key="open"
            icon={<OpenInNewIcon fontSize="small" />}
            label="Abrir processo"
            onClick={() => router.push(`/processos/${row.id}`)}
          />,
          ...(isSecretary
            ? [
                <GridActionsCellItem
                  key="delete"
                  icon={<DeleteOutlinedIcon fontSize="small" />}
                  label="Excluir"
                  onClick={() => setToDelete(row)}
                />,
              ]
            : []),
        ],
      },
    ];
    return list.filter(Boolean) as GridColDef<Row>[];
  }, [companies, isSecretary, isStaff, lawyers, role, router, rows]);

  const selectedIds = [...selection.ids].map(Number);

  const bulkDelete = isSecretary && selectedIds.length > 0 && (
    <ActionButton
      size="small"
      color="error"
      startIcon={<DeleteOutlinedIcon />}
      label={selectedIds.length === 1 ? 'Excluir selecionado' : `Excluir ${selectedIds.length} selecionados`}
      confirm={{
        title: selectedIds.length === 1 ? 'Excluir este processo?' : `Excluir ${selectedIds.length} processos?`,
        body: 'A exclusão é definitiva. Para guardar o histórico, mude a situação para Arquivado.',
        confirmLabel: 'Excluir',
      }}
      action={() => deleteCases(selectedIds)}
      onDone={(state) => state.success && removeRows(selectedIds)}
    />
  );

  const detailPanel = useCallback(
    ({ row }: GridRowParams<Row>) => (
      // One column on the left: the grid can be wider than the screen, and a wide panel
      // would push the contact details out of view.
      <Stack spacing={2} sx={{ pl: 13, pr: 3, py: 2, bgcolor: '#f8fafc', maxWidth: 820 }}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Andamento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {row.description || 'Sem descrição registrada.'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {row.company_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CNPJ {formatCnpj(row.company_cnpj)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {row.lawyer_name}
            {row.lawyer_oab ? ` · ${row.lawyer_oab}` : ''}
            <br />
            {row.lawyer_email}
            {row.lawyer_phone ? ` · ${formatPhone(row.lawyer_phone)}` : ''}
          </Typography>
          {row.lawyer_id !== userId && (
            <Button
              size="small"
              startIcon={<MailOutlinedIcon />}
              href={`mailto:${row.lawyer_email}?subject=${encodeURIComponent(`Processo #${row.id}: ${row.title}`)}`}
              sx={{ mt: 1, ml: -0.5 }}
            >
              Falar com o advogado
            </Button>
          )}
        </Box>
      </Stack>
    ),
    [userId],
  );

  return (
    <>
      <PageHeader
        title={role === 'lawyer' ? 'Meus processos' : 'Processos'}
        subtitle={
          role === 'client'
            ? 'Acompanhe os processos da sua empresa. Expanda uma linha para ver o andamento.'
            : isStaff
              ? 'Clique duas vezes numa célula para editar. Expanda uma linha para ver o andamento.'
              : undefined
        }
        actions={
          <>
            {isStaff && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} sx={{ whiteSpace: 'nowrap' }}>
                Novo processo
              </Button>
            )}
          </>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {STATUSES.map((status) => (
          <Card key={status} sx={{ borderLeft: 4, borderLeftColor: STATUS_ACCENT[status] }}>
            <CardActionArea onClick={() => filterByStatus(status)} sx={{ px: 2.5, py: 2 }} aria-label={`Filtrar: ${STATUS_LABEL[status]}`}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {STATUS_LABEL[status]}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {counts[status]}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Stack direction="row" sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={tab}
          onChange={(_, value: Tab | null) => value && setTab(value)}
          aria-label="Filtrar por situação"
        >
          <ToggleButton value="active">Em andamento ({counts.open + counts.in_progress})</ToggleButton>
          <ToggleButton value="finished">Finalizados ({counts.closed + counts.archived})</ToggleButton>
          <ToggleButton value="all">Todos ({rows.length})</ToggleButton>
        </ToggleButtonGroup>
        {filterModel.items.length > 0 && (
          <Button size="small" onClick={() => setFilterModel({ items: [] })}>
            Limpar filtros
          </Button>
        )}
      </Stack>

      <Box sx={{ height: { xs: 560, md: 'calc(100vh - 360px)' }, minHeight: 460 }}>
        <DataGridPro
          rows={visibleRows}
          columns={columns}
          showToolbar
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { actions: bulkDelete, exportName: 'processos' } }}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          checkboxSelection={isSecretary}
          disableRowSelectionOnClick
          rowSelectionModel={selection}
          onRowSelectionModelChange={setSelection}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error: Error) => notify(error.message, 'error')}
          getDetailPanelContent={detailPanel}
          getDetailPanelHeight={() => 'auto'}
          initialState={{
            sorting: { sortModel: [{ field: 'updated_at', sort: 'desc' }] },
            columns: { columnVisibilityModel: { created_at: false } },
            pinnedColumns: { right: ['actions'] },
          }}
          localeText={gridLocale({ noRowsLabel: 'Nenhum processo nesta lista.' })}
        />
      </Box>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={`Excluir o processo #${toDelete?.id}?`}
        body={`"${toDelete?.title}" será removido de vez. Para guardar o histórico, mude a situação para Arquivado.`}
        confirmLabel="Excluir"
        action={() => deleteCases([toDelete!.id])}
        onDone={(state) => state.success && toDelete && removeRows([toDelete.id])}
      />

      {isStaff && (
        <FormDialog
          open={creating}
          onClose={() => setCreating(false)}
          title="Novo processo"
          description={role === 'lawyer' ? 'O processo fica no seu nome.' : undefined}
        >
          <ActionForm
            action={createCase}
            submitLabel="Abrir processo"
            onSuccess={() => {
              setCreating(false);
              router.replace('/processos');
              router.refresh();
            }}
            secondary={
              <Button color="inherit" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            }
          >
            <CaseFields companies={companies} lawyers={isSecretary ? lawyers : undefined} defaultCompanyId={initialCompanyId} />
          </ActionForm>
        </FormDialog>
      )}
    </>
  );
}

