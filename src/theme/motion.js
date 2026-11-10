/**
 * Microinteracciones (sistema Amicro, adaptado a WPT).
 *
 * - Curva exponencial `EASE_OUT_EXPO` para entradas y cambios de estado.
 * - Respuesta táctil al pulsar: escala 1.08 al pasar, 0.92 al apretar (iconos).
 * - Todo se apaga con `prefers-reduced-motion` gracias a <MotionConfig reducedMotion="user">
 *   en App.js.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.35,
};

/** Transición estándar para cambios de estado. */
export const transition = { duration: duration.base, ease: EASE_OUT_EXPO };

/** Botones de icono: crecen un poco al pasar y se hunden al apretar. */
export const iconPress = {
  whileHover: { scale: 1.08 },
  whileTap: { scale: 0.92 },
  transition: { duration: duration.fast, ease: EASE_OUT_EXPO },
};

/** Elementos de lista o botones anchos: solo se hunden un poco al apretar. */
export const rowPress = {
  whileTap: { scale: 0.98 },
  transition: { duration: duration.fast, ease: EASE_OUT_EXPO },
};

/** Entrada de página al cambiar de ruta: corta y sin coreografía. */
export const pageEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.base, ease: EASE_OUT_EXPO },
};
