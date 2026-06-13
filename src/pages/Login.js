import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade
} from '@mui/material';
import { 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  Login as LoginIcon,
  Block,
  Warning
} from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../services/firebase';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusSeverity, setStatusSeverity] = useState('info');
  const [statusIcon, setStatusIcon] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Hook para detectar parámetros de estado en la URL
  useEffect(() => {
    const status = searchParams.get('status');
    
    if (status) {
      switch (status.toLowerCase()) {
        case 'suspended':
          setStatusMessage('Tu acceso ha sido suspendido temporalmente. Contacta al administrador para más información.');
          setStatusSeverity('warning');
          setStatusIcon(<Block sx={{ fontSize: 20 }} />);
          break;
        case 'inactive':
          setStatusMessage('Tu cuenta está inactiva. Contacta al administrador para reactivar tu acceso.');
          setStatusSeverity('info');
          setStatusIcon(<Warning sx={{ fontSize: 20 }} />);
          break;
        case 'unauthorized':
          setStatusMessage('No tienes autorización para acceder a esta sección.');
          setStatusSeverity('error');
          setStatusIcon(<Block sx={{ fontSize: 20 }} />);
          break;
        case 'session_expired':
          setStatusMessage('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          setStatusSeverity('info');
          setStatusIcon(<Warning sx={{ fontSize: 20 }} />);
          break;
        default:
          setStatusMessage('');
          setStatusSeverity('info');
          setStatusIcon(null);
      }
    }
  }, [searchParams]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

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
          setError('Tu cuenta no tiene acceso al sistema. Contacta al administrador.');
          return;
        }
      }

      // 3. Si todo está bien, redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      } else if (error.code === 'auth/invalid-email') {
        setError('El formato del email no es válido.');
      } else if (error.code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada. Contacta al administrador.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Bokeh background ── */}
      <div className="bokeh-viewport">
        <div className="bokeh-orb bokeh-orb--1" />
        <div className="bokeh-orb bokeh-orb--2" />
        <div className="bokeh-orb bokeh-orb--3" />
        <div className="bokeh-orb bokeh-orb--4" />
        <div className="bokeh-orb bokeh-orb--5" />
        <div className="bokeh-orb bokeh-orb--6" />
        <div className="bokeh-orb bokeh-orb--7" />
        <div className="bokeh-orb bokeh-orb--8" />
      </div>

      {/* ── Login card ── */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="xs">
          <Fade in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                padding: { xs: 3, sm: 4 },
                borderRadius: 3,
                backgroundColor: 'rgba(20, 21, 27, 0.72)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                '&:hover': { transform: 'none' },
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Box sx={{ mb: 2, p: 2 }}>
                  <Box
                    component="img"
                    src="/logo-text.webp"
                    alt="WhitePearl Logo"
                    sx={{
                      height: { xs: 60, sm: 80 },
                      width: 'auto',
                      maxWidth: '100%',
                      display: 'block',
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ color: '#e2e4e9', textAlign: 'center', fontWeight: 600, mb: 0.5 }}
                >
                  Sistema de Asignaciones
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#7d8190', textAlign: 'center' }}
                >
                  Inicia sesión para acceder al panel de control
                </Typography>
              </Box>

              {/* Form */}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  variant="outlined"
                  autoComplete="email"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#7d8190' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      fontSize: { xs: '16px', sm: '0.9375rem' },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6a9eff',
                      },
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required
                  variant="outlined"
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: '#7d8190' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          sx={{
                            color: '#7d8190',
                            '&:hover': { color: '#e2e4e9' },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6a9eff',
                      },
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 2,
                    },
                  }}
                />

                {statusMessage && (
                  <Alert
                    severity={statusSeverity}
                    icon={statusIcon}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    {statusMessage}
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <LoginIcon />}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    backgroundColor: '#6a9eff',
                    color: 'white',
                    textTransform: 'none',
                    boxShadow: 'none',
                    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#5a8eef',
                      boxShadow: '0 4px 16px rgba(106, 158, 255, 0.3)',
                    },
                    '&:active': { transform: 'scale(0.98)' },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(106, 158, 255, 0.3)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Iniciando sesión...</span>
                    </Box>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </Box>

              {/* Footer */}
              <Typography
                variant="body2"
                sx={{ color: '#7d8190', textAlign: 'center', mt: 2 }}
              >
                ¿No tienes cuenta?{' '}
                <Box
                  component="span"
                  sx={{
                    color: '#6a9eff',
                    fontWeight: 500,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Contacta al administrador
                </Box>
                {' '}para obtener acceso.
              </Typography>
            </Paper>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

export default Login;
