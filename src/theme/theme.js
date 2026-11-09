import { createTheme } from '@mui/material/styles';
import { colors, radius, fontFamily, withAlpha, divider, rowDivider, focusOutline } from './tokens';

const floatingShadow = '0 12px 32px rgba(0, 0, 0, 0.35)';

// Ojo: `shape.borderRadius` se queda en 4 (el valor por defecto de MUI). Las
// páginas usan `borderRadius: 2` en `sx`, que MUI multiplica por este valor;
// cambiarlo agrandaría todos los radios de golpe. Los radios del sistema se
// fijan en píxeles en los overrides de abajo.
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary,
      light: colors.primary,
      dark: colors.primaryDim,
      contrastText: colors.primaryOnContainer,
    },
    secondary: {
      main: colors.onSurfaceVariant,
      light: colors.onSurface,
      dark: colors.outline,
      contrastText: colors.surface,
    },
    error: { main: colors.error, contrastText: colors.surfaceLowest },
    warning: { main: colors.attention, contrastText: colors.surfaceLowest },
    success: { main: colors.goodNews, contrastText: colors.surfaceLowest },
    info: { main: '#93c5fd', contrastText: colors.surfaceLowest },
    background: {
      default: colors.surface,
      paper: colors.surfaceLow,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
      disabled: colors.outline,
    },
    divider,
    action: {
      hover: withAlpha(colors.onSurface, 0.05),
      selected: colors.surfaceHigh,
      focus: withAlpha(colors.primary, 0.12),
      disabled: colors.outline,
      disabledBackground: colors.surfaceContainer,
    },
  },
  typography: {
    fontFamily,
    h1: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.025em' },
    h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.33, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.4, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: 0, textTransform: 'none', lineHeight: 1.5 },
    button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.surface,
          color: colors.onSurface,
          minHeight: '100vh',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { '&.Mui-focusVisible': focusOutline },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          minHeight: 40,
          padding: '8px 18px',
          fontWeight: 600,
          transition: 'background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out',
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeSmall: { minHeight: 32, padding: '4px 12px', borderRadius: radius.md },
        containedPrimary: {
          backgroundColor: colors.primary,
          color: colors.primaryOnContainer,
          '&:hover': { backgroundColor: colors.primaryDim },
        },
        containedError: {
          backgroundColor: colors.error,
          color: colors.surfaceLowest,
          '&:hover': { backgroundColor: '#ff8597' },
        },
        outlined: {
          borderColor: withAlpha(colors.outlineVariant, 0.6),
          color: colors.onSurface,
          '&:hover': {
            borderColor: colors.outlineVariant,
            backgroundColor: colors.surfaceHigh,
          },
        },
        text: {
          '&:hover': { backgroundColor: colors.surfaceContainer },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          color: colors.onSurfaceVariant,
          '&:hover': { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceLow,
          backgroundImage: 'none',
          border: 'none',
          boxShadow: 'none',
        },
        rounded: { borderRadius: radius.lg },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceLow,
          backgroundImage: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: radius.lg,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surfaceLow,
          borderRadius: radius.xl,
          boxShadow: floatingShadow,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.015em' },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          '&:not(.MuiBackdrop-invisible)': { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surfaceHighest,
          borderRadius: radius.md,
          boxShadow: floatingShadow,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surfaceHighest,
          borderRadius: radius.md,
          boxShadow: floatingShadow,
        },
        list: { padding: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.DEFAULT,
          fontSize: '0.875rem',
          minHeight: 36,
          '&:hover': { backgroundColor: withAlpha(colors.onSurface, 0.06) },
          '&.Mui-selected': {
            backgroundColor: withAlpha(colors.primary, 0.12),
            '&:hover': { backgroundColor: withAlpha(colors.primary, 0.18) },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: withAlpha(colors.surface, 0.95),
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: `1px solid ${divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surfaceLow,
          borderRadius: 0,
          border: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          fontWeight: 600,
        },
        sizeSmall: { height: 22, fontSize: '0.6875rem' },
        filled: {
          backgroundColor: colors.surfaceHigh,
          color: colors.onSurface,
        },
        outlined: { borderColor: withAlpha(colors.outlineVariant, 0.6) },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceContainer,
          borderRadius: radius.lg,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: withAlpha(colors.outlineVariant, 0.3),
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: withAlpha(colors.outlineVariant, 0.7),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary,
            borderWidth: 2,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.error,
          },
        },
        input: {
          '&::placeholder': { color: colors.onSurfaceVariant, opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: colors.onSurfaceVariant,
          '&.Mui-focused': { color: colors.primary },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { color: colors.onSurfaceVariant } },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: colors.primary, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 44,
          color: colors.onSurfaceVariant,
          '&.Mui-selected': { color: colors.onSurface, fontWeight: 600 },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: colors.surfaceContainer,
          borderRadius: radius.md,
          padding: 2,
          gap: 2,
        },
        grouped: {
          border: 'none !important',
          borderRadius: `${radius.DEFAULT}px !important`,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: colors.onSurfaceVariant,
          minHeight: 32,
          '&:hover': { backgroundColor: colors.surfaceHigh, color: colors.onSurface },
          '&.Mui-selected': {
            backgroundColor: colors.surfaceHighest,
            color: colors.onSurface,
            '&:hover': { backgroundColor: colors.surfaceHighest },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: rowDivider },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          color: colors.onSurfaceVariant,
          textTransform: 'none',
          letterSpacing: 0,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: colors.surfaceContainer },
          '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: colors.surfaceHigh },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 6, backgroundColor: colors.surfaceHigh },
        bar: { borderRadius: 999 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.surfaceHighest,
          color: colors.onSurface,
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: radius.DEFAULT,
          boxShadow: floatingShadow,
        },
        arrow: { color: colors.surfaceHighest },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: divider } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.DEFAULT,
          '&.Mui-selected': { backgroundColor: colors.surfaceHigh },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        colorDefault: { backgroundColor: colors.surfaceHighest, color: colors.onSurface },
      },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: colors.surfaceHigh } },
    },
    MuiSwitch: {
      styleOverrides: {
        track: { backgroundColor: colors.outlineVariant, opacity: 1 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: radius.lg, alignItems: 'center' },
        standardError: { backgroundColor: withAlpha(colors.error, 0.1), color: colors.onSurface },
        standardWarning: { backgroundColor: withAlpha(colors.attention, 0.1), color: colors.onSurface },
        standardSuccess: { backgroundColor: withAlpha(colors.goodNews, 0.1), color: colors.onSurface },
        standardInfo: { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
      },
    },
  },
});

export default theme;
