'use client';

import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import {
  ColumnsPanelTrigger,
  ExportCsv,
  FilterPanelTrigger,
  QuickFilter,
  QuickFilterControl,
  Toolbar,
  useGridApiContext,
  type GridDensity,
} from '@mui/x-data-grid-pro';
import { useState, type ReactNode } from 'react';

import { common } from '@/content/common';

import { useLocale } from './LocaleProvider';

declare module '@mui/x-data-grid-pro' {
  interface ToolbarPropsOverrides {
    /** Buttons on the left of the toolbar, such as "Excluir selecionados". */
    actions?: ReactNode;
    /** CSV file name, without the extension. */
    exportName?: string;
  }
}

const DENSITIES: { value: GridDensity; icon: ReactNode }[] = [
  { value: 'compact', icon: <DensitySmallIcon fontSize="small" /> },
  { value: 'standard', icon: <DensityMediumIcon fontSize="small" /> },
  { value: 'comfortable', icon: <DensityLargeIcon fontSize="small" /> },
];

function DensityMenu() {
  const t = common[useLocale()].grid;
  const apiRef = useGridApiContext();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Button size="small" startIcon={<DensityMediumIcon />} onClick={(e) => setAnchor(e.currentTarget)}>
        {t.density}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {DENSITIES.map((density) => (
          <MenuItem
            key={density.value}
            onClick={() => {
              apiRef.current?.setDensity(density.value);
              setAnchor(null);
            }}
          >
            <ListItemIcon>{density.icon}</ListItemIcon>
            {t.densities[density.value]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * The toolbar of the 2022 version (Colunas, Filtros, Densidade, Exportar and the bulk
 * action), rebuilt on the DataGrid v9 toolbar parts, plus a quick search.
 */
export function GridToolbar({ actions, exportName = 'export' }: { actions?: ReactNode; exportName?: string }) {
  const t = common[useLocale()].grid;
  return (
    // The toolbar root has a fixed height; let it grow so the buttons can wrap on phones.
    <Toolbar style={{ height: 'auto', minHeight: 52, flex: '0 0 auto', flexWrap: 'wrap', rowGap: 4, paddingBlock: 6 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
        <ColumnsPanelTrigger size="small" startIcon={<ViewColumnOutlinedIcon />}>
          {t.columns}
        </ColumnsPanelTrigger>
        <FilterPanelTrigger
          render={(props, state) => (
            <Button
              {...props}
              size="small"
              startIcon={
                <Badge badgeContent={state.filterCount} color="secondary" variant="dot">
                  <FilterListIcon />
                </Badge>
              }
            >
              {t.filters}
            </Button>
          )}
        />
        <DensityMenu />
        <ExportCsv
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          options={{ fileName: exportName, delimiter: ';', utf8WithBom: true }}
        >
          {t.export}
        </ExportCsv>
        {actions}
      </Box>
      <QuickFilter debounceMs={300}>
        <QuickFilterControl
          render={({ ref, ...controlProps }) => (
            <TextField
              {...controlProps}
              inputRef={ref}
              size="small"
              placeholder={t.search}
              aria-label={t.search}
              sx={{ width: { xs: '100%', sm: 260 } }}
              slotProps={{
                ...controlProps.slotProps,
                input: {
                  ...(controlProps.slotProps?.input as object | undefined),
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
      </QuickFilter>
    </Toolbar>
  );
}
