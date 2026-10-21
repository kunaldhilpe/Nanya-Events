import { createTheme, alpha } from '@mui/material/styles';

// JD EVENTS brand: deep forest green (logo), warm brass accent, warm paper neutrals.
const brand = {
  forest: '#0b2e24',
  forestLight: '#1f6f5c',
  brass: '#c9a24a',
  brassDark: '#9c7a2c',
  paper: '#f6f4ef',
  ink: '#14201c',
};

export const statusColors = {
  Planning: '#6b7280',
  Design: '#7c3aed',
  Fabrication: '#d97706',
  Installation: '#2563eb',
  Live: '#059669',
  Completed: '#1f6f5c',
  Cancelled: '#b91c1c',
};

export const priorityColors = {
  Critical: '#b91c1c',
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#2563eb',
};

export const taskStatusColors = {
  'To Do': '#6b7280',
  'In Progress': '#2563eb',
  Review: '#d97706',
  Done: '#059669',
};

export function buildTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#4fb59a' : brand.forest, light: brand.forestLight, dark: '#07201a', contrastText: '#fff' },
      secondary: { main: brand.brass, dark: brand.brassDark, contrastText: '#1a1a1a' },
      success: { main: '#059669' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
      info: { main: '#2563eb' },
      background: dark
        ? { default: '#0e1512', paper: '#141d19' }
        : { default: brand.paper, paper: '#ffffff' },
      text: dark
        ? { primary: '#e6ece8', secondary: '#9fb0a8' }
        : { primary: brand.ink, secondary: '#5b6b65' },
      divider: dark ? 'rgba(255,255,255,0.08)' : 'rgba(11,46,36,0.1)',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      h1: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700 },
      h2: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
      overline: { fontWeight: 700, letterSpacing: '0.12em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { scrollbarWidth: 'thin' },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-thumb': { background: dark ? '#2b3a34' : '#cfd8d3', borderRadius: 8 },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            transition: 'box-shadow .2s, transform .2s',
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiTooltip: { defaultProps: { arrow: true } },
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: theme.palette.text.secondary,
            background: alpha(theme.palette.primary.main, dark ? 0.08 : 0.04),
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { border: 'none' },
        },
      },
    },
  });
}

export { brand };
