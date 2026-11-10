import toast from 'react-hot-toast';
import { triggerHaptic } from '../hooks/useWebHaptics';

/**
 * Aviso + vibración en un solo paso (Amicro: toda acción con resultado avisa
 * y vibra). Usar en lugar de llamar a `toast` directamente.
 */
export const notify = {
  success(message, options) {
    triggerHaptic('success');
    return toast.success(message, options);
  },
  error(message, options) {
    triggerHaptic('error');
    return toast.error(message, options);
  },
  info(message, options) {
    triggerHaptic('light');
    return toast(message, options);
  },
};

export default notify;
