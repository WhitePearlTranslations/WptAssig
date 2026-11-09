import React, { forwardRef } from 'react';
import { IconButton } from '@mui/material';
import { motion } from 'motion/react';
import { iconPress } from '../../theme/motion';
import { triggerHaptic } from '../../hooks/useWebHaptics';

/**
 * IconButton de MUI con la respuesta táctil de Amicro: crece al pasar,
 * se hunde al apretar y vibra (si el dispositivo lo admite).
 */
const PressIconButton = forwardRef(function PressIconButton({ onClick, haptic = 'light', ...props }, ref) {
  const handleClick = (event) => {
    if (haptic) triggerHaptic(haptic);
    onClick?.(event);
  };
  return <IconButton ref={ref} component={motion.button} {...iconPress} onClick={handleClick} {...props} />;
});

export default PressIconButton;
