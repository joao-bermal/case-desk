import { enUS as coreEnUS, ptBR as corePtBR } from '@mui/material/locale';
import { createTheme } from '@mui/material/styles';
import { enUS as gridEnUS, ptBR as gridPtBR } from '@mui/x-data-grid-pro/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';

import type { Locale } from '@/lib/i18n';


const GRID_LOCALE = { pt: gridPtBR, en: gridEnUS };
const CORE_LOCALE = { pt: corePtBR, en: coreEnUS };

/**
 * Grid texts in the visitor's language plus per-grid overrides. A `localeText` prop replaces
 * the theme's translations instead of merging with them, so grids pass this instead.
 */
export function gridLocale(locale: Locale, overrides: Record<string, string>) {
  return { ...GRID_LOCALE[locale].components.MuiDataGrid.defaultProps.localeText, ...overrides };
}

export const SIDEBAR = {
  width: 256,
  background: '#0f172a',
  text: '#cbd5e1',
  muted: '#64748b',
  hover: 'rgba(255, 255, 255, 0.06)',
  selected: 'rgba(255, 255, 255, 0.1)',
};

const border = '#e2e8f0';

const baseTheme = (locale: Locale) =>
  createTheme(
  {
    palette: {
      primary: { main: '#1e293b', dark: '#0f172a', light: '#334155', contrastText: '#ffffff' },
      secondary: { main: '#c08a2d', contrastText: '#ffffff' },
      info: { main: '#0284c7' },
      warning: { main: '#d97706' },
      success: { main: '#059669' },
      error: { main: '#dc2626' },
      background: { default: '#f1f5f9', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#475569' },
      divider: border,
      DataGrid: { bg: '#ffffff', headerBg: '#f8fafc', pinnedBg: '#ffffff' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { whiteSpace: 'nowrap' } } },
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiPaper: { styleOverrides: { outlined: { borderColor: border } } },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiDataGrid: {
        defaultProps: { density: 'standard' },
        styleOverrides: {
          // Colors live in palette.DataGrid: root overrides also reach inner slots (the
          // scroll shadows), so a background here would paint over the rows.
          root: { borderColor: border },
          columnHeaderTitle: { fontWeight: 600, color: '#334155' },
          cell: { '&:focus, &:focus-within': { outline: 'none' } },
          columnHeader: { '&:focus, &:focus-within': { outline: 'none' } },
        },
      },
    },
  },
  GRID_LOCALE[locale],
  CORE_LOCALE[locale],
);

/** One theme per language, built once. */
export const themes: Record<Locale, ReturnType<typeof baseTheme>> = {
  pt: baseTheme('pt'),
  en: baseTheme('en'),
};
