import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Block, InfoOutlined } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { auth } from '../services/firebase';
import LoginBackdrop from '../components/LoginBackdrop';
import { triggerHaptic } from '../hooks/useWebHaptics';
import { EASE_OUT_EXPO } from '../theme/motion';
import { colors, radius } from '../theme/tokens';

// Avisos que llegan por la URL (?status=…) al expulsar o redirigir a alguien.
const STATUS_NOTICES = {
  suspended: {
    severity: 'warning',
    icon: Block,
    message: 'Tu acceso está suspendido. Habla con la administración para saber más.',
  },
  inactive: {
    severity: 'info',
    icon: InfoOutlined,
    message: 'Tu cuenta está inactiva. Pide a la administración que la reactive.',
  },
  unauthorized: {
    severity: 'error',
    icon: Block,
    message: 'No tienes permiso para entrar en esa sección.',
  },
  session_expired: {
    severity: 'info',
    icon: InfoOutlined,
    message: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusKey, setStatusKey] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Aviso según el parámetro de estado de la URL
  useEffect(() => {
    const status = searchParams.get('status');
    setStatusKey(status && STATUS_NOTICES[status.toLowerCase()] ? status.toLowerCase() : null);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Verificar el estado del usuario en la base de datos
      const { canUserAccess } = await import('../services/userStatusService');
      const accessResult = await canUserAccess(user.uid);

      if (!accessResult.canAccess) {
        // El usuario tiene acceso restringido
        await auth.signOut(); // Desconectar inmediatamente

        if (accessResult.reason && accessResult.reason.includes('suspendida')) {
          navigate('/login?status=suspended');
          return;
        } else if (accessResult.reason && accessResult.reason.includes('inactiva')) {
          navigate('/login?status=inactive');
          return;
        } else {
          setError('Tu cuenta no tiene acceso al sistema. Habla con la administración.');
          triggerHaptic('error');
          return;
        }
      }

      // 3. Si todo está bien, redirigir al dashboard
      triggerHaptic('success');
      navigate('/dashboard');
    } catch (error) {
      triggerHaptic('error');
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setError('El email o la contraseña no son correctos.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Ese email no tiene un formato válido.');
      } else if (error.code === 'auth/user-disabled') {
        setError('Esta cuenta está deshabilitada. Habla con la administración.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.');
      } else {
        setError('No se pudo iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const notice = statusKey ? STATUS_NOTICES[statusKey] : null;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        backgroundColor: colors.surface,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LoginBackdrop />
      <Paper
        component={motion.section}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        aria-labelledby="login-title"
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          borderRadius: `${radius.xl}px`,
          // La tarjeta flota sobre el fondo animado y sigue siendo opaca para leerse bien.
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Cabecera */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo-text.webp"
            alt="WhitePearl Translations"
            sx={{ height: { xs: 56, sm: 68 }, width: 'auto', maxWidth: '100%', display: 'block', mx: 'auto', mb: 2 }}
          />
          <Typography id="login-title" component="h1" sx={{ fontSize: '1.25rem', fontWeight: 700, color: colors.onSurface }}>
            Sistema de asignaciones
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.onSurfaceVariant, mt: 0.5 }}>
            Inicia sesión con tu cuenta del equipo
          </Typography>
        </Box>

        {notice && (
          <Alert severity={notice.severity} icon={<notice.icon sx={{ fontSize: 20 }} />} sx={{ mb: 2 }}>
            {notice.message}
          </Alert>
        )}

        {/* Formulario */}
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              inputProps={{ inputMode: 'email', style: { fontSize: 16 } }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              inputProps={{ style: { fontSize: 16 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      aria-label={showPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" role="alert" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : null}
            sx={{ mt: 3, minHeight: 48 }}
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </Box>

        <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, textAlign: 'center', mt: 3 }}>
          ¿No tienes cuenta? Pídesela a la administración del equipo.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
