import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_OUT_EXPO } from '../../theme/motion';

/**
 * Cambia un icono por otro con un fundido y un pequeño giro de escala
 * (copiar → hecho, menú → cerrar...). Cada hijo necesita una `key` distinta.
 */
export function IconSwap({ children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {children}
      </AnimatePresence>
    </span>
  );
}

export function IconSwapItem({ children }) {
  return (
    <motion.span
      style={{ display: 'inline-flex' }}
      initial={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
      transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.span>
  );
}
