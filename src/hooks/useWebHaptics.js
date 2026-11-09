import { useCallback } from 'react';

/**
 * Vibración breve en móviles que la admiten (Android). En escritorio e iOS
 * no hace nada. Se desactiva con `prefers-reduced-motion`.
 */
const PATTERNS = {
  light: 8,
  medium: 14,
  success: [10, 40, 16],
  error: [24, 40, 24],
};

export function triggerHaptic(kind = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(PATTERNS[kind] ?? PATTERNS.light);
  } catch {
    // Algunos navegadores lanzan si no hubo gesto del usuario: se ignora.
  }
}

export function useWebHaptics() {
  return { triggerHaptic: useCallback((kind) => triggerHaptic(kind), []) };
}
