/**
 * Tokens de diseño de WPT (ver DESIGN.md).
 *
 * Misma paleta que el panel de RanobeClub. Los componentes importan de aquí
 * o usan la paleta del tema de MUI; no se escriben hex a mano.
 */

export const colors = {
  surface: '#070e1d',
  surfaceLowest: '#000000',
  surfaceLow: '#0b1323',
  surfaceContainer: '#11192b',
  surfaceHigh: '#161f33',
  surfaceHighest: '#1b263b',

  onSurface: '#dfe5fa',
  onSurfaceVariant: '#a4abbf',
  outline: '#6e7588',
  outlineVariant: '#414859',

  primary: '#cfbdfb',
  primaryDim: '#c1afec',
  primaryOnContainer: '#28194c',

  error: '#ff6e84',
  goodNews: '#6ee7b7',
  attention: '#fcd34d',
};

/** Tonos de los cuatro tipos de tarea. Son categorías, no estados. */
export const taskColors = {
  traduccion: '#93c5fd',
  proofreading: '#c4b5fd',
  cleanRedrawer: '#5eead4',
  type: '#fdba74',
};

export const radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const fontFamily = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

/** `#rrggbb` + opacidad (0–1) → `rgba(...)`. */
export function withAlpha(hex, opacity) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Divisor estándar: Hilo al 15 % (al 10 % entre filas de tabla). */
export const divider = withAlpha(colors.outlineVariant, 0.15);
export const rowDivider = withAlpha(colors.outlineVariant, 0.1);

/** Contorno de foco: lavanda de 2 px. */
export const focusOutline = {
  outline: `2px solid ${colors.primary}`,
  outlineOffset: 2,
};
