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
  Fade,
  Zoom,
  Grow
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
import StarsBackground from '../components/StarsBackground';

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
    <StarsBackground 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0820 0%, #1a0d3d 50%, #0f0820 100%)'
      }}
      speed={40}
      starColor="#ffffff"
      factor={0.03}
    >
      <Box
        sx={{
          minHeight: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 1, sm: 2 },
          background: 'transparent'
        }}
      >
      <Container maxWidth="sm">
        <Zoom in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              padding: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: 3, sm: 5 },
              background: 'rgba(15, 8, 32, 0.2)',
              backdropFilter: { xs: 'blur(15px)', sm: 'blur(25px)' },
              border: '1px solid rgba(138, 43, 226, 0.2)',
              boxShadow: {
                xs: '0 8px 32px rgba(75, 0, 130, 0.3)',
                sm: '0 12px 48px rgba(75, 0, 130, 0.4)'
              },
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease-in-out',
              maxWidth: { xs: '100%', sm: 'none' },
              // Remove hover effects on mobile
              '@media (hover: hover)': {
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 16px 64px rgba(75, 0, 130, 0.6)',
                  border: '1px solid rgba(138, 43, 226, 0.4)'
                },
                '&:hover::before': {
                  left: '100%'
                }
              },
              // Touch device optimizations
              '@media (hover: none)': {
                '&:hover': {
                  transform: 'none',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.15), transparent)',
                transition: 'left 0.8s',
                // Hide shimmer effect on mobile
                '@media (max-width: 768px)': {
                  display: 'none'
                }
              }
            }}
          >
            {/* Header animado */}
            <Fade in timeout={1200}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4
                }}
              >
                <Grow in timeout={1000}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mb: 2,
                      p: 3,
                      borderRadius: '24px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.12)',
                        transform: 'scale(1.02)',
                        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src="/logo-text.webp"
                      alt="WhitePearl Logo"
                      sx={{
                        height: { xs: 60, sm: 80, md: 100 },
                        width: 'auto',
                        maxWidth: '100%',
                        filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.5))'
                        }
                      }}
                    />
                  </Box>
                </Grow>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    textAlign: 'center',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Sistema de Asignaciones de Manga
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    textAlign: 'center',
                    fontWeight: 300
                  }}
                >
                  Inicia sesión para acceder al panel de control
                </Typography>
              </Box>
            </Fade>

            {/* Formulario */}
            <Fade in timeout={1400}>
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
                  InputLabelProps={{
                    sx: { 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: { xs: '1rem', sm: '1rem' }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      color: 'white',
                      minHeight: { xs: '48px', sm: 'auto' },
                      fontSize: { xs: '16px', sm: '1rem' }, // Prevents iOS zoom
                      '& .MuiOutlinedInput-input': {
                        fontSize: { xs: '16px', sm: '1rem' },
                        padding: { xs: '16px 14px', sm: '16.5px 14px' }
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: '2px'
                      },
                      '& input': {
                        color: 'white'
                      },
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: { xs: 1, sm: 2 },
                      backdropFilter: { xs: 'blur(5px)', sm: 'blur(10px)' },
                      transition: 'all 0.3s ease'
                    }
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
                  InputLabelProps={{
                    sx: { color: 'rgba(255, 255, 255, 0.8)' }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          edge="end"
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            '&:hover': {
                              color: 'rgba(255, 255, 255, 0.8)',
                              background: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: '2px'
                      },
                      '& input': {
                        color: 'white'
                      },
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                />

                {/* Mensaje de estado contextual */}
                {statusMessage && (
                  <Fade in timeout={800}>
                    <Alert 
                      severity={statusSeverity}
                      icon={statusIcon}
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        border: statusSeverity === 'warning' 
                          ? '1px solid rgba(255, 193, 7, 0.3)' 
                          : statusSeverity === 'error' 
                            ? '1px solid rgba(244, 67, 54, 0.3)'
                            : '1px solid rgba(33, 150, 243, 0.3)',
                        background: statusSeverity === 'warning' 
                          ? 'rgba(255, 193, 7, 0.1)' 
                          : statusSeverity === 'error' 
                            ? 'rgba(244, 67, 54, 0.1)'
                            : 'rgba(33, 150, 243, 0.1)',
                        color: statusSeverity === 'warning' 
                          ? '#ffb74d' 
                          : statusSeverity === 'error' 
                            ? '#ff6b6b'
                            : '#64b5f6',
                        '& .MuiAlert-icon': {
                          color: statusSeverity === 'warning' 
                            ? '#ffb74d' 
                            : statusSeverity === 'error' 
                              ? '#ff6b6b'
                              : '#64b5f6'
                        }
                      }}
                    >
                      {statusMessage}
                    </Alert>
                  </Fade>
                )}

                {error && (
                  <Fade in>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                        background: 'rgba(244, 67, 54, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(244, 67, 54, 0.3)',
                        color: '#ff6b6b',
                        '& .MuiAlert-icon': {
                          color: '#ff6b6b'
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  </Fade>
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
                    py: 1.8,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    textTransform: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
                    },
                    '&:active': {
                      transform: 'translateY(0px)'
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }
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
            </Fade>

            {/* Footer */}
            <Fade in timeout={1600}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  textAlign: 'center',
                  mt: 2,
                  fontWeight: 300
                }}
              >
                ¿No tienes cuenta?{' '}
                <Box 
                  component="span" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#fff'
                    }
                  }}
                >
                  Contacta al administrador
                </Box>
                {' '}para obtener acceso.
              </Typography>
            </Fade>
          </Paper>
        </Zoom>
      </Container>
      </Box>
    </StarsBackground>
  );
};

export default Login;
