import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth, ROLES } from './contexts/AuthContextSimple';
import './scripts/setupAdmin'; // Cargar script de configuración
import './utils/migrateAssignmentTypes'; // Cargar utilidad de migración
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Users from './pages/Users';
import Profile from './pages/Profile';
import SharedAssignment from './pages/SharedAssignment';
import SeriesAssignmentManager from './components/SeriesAssignmentManager';
import SeriesManagement from './components/SeriesManagement';
import AdminPanel from './components/AdminPanel';
import MyWorks from './components/MyWorks';
import Uploads from './pages/Uploads';
import ReviewPanel from './components/ReviewPanel';
import TourFloatingButton from './components/TourFloatingButton';
import PageTourButton from './components/PageTourButton';
import MaintenanceMode from './components/MaintenanceMode';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Modern indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#ec4899', // Modern pink
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#0a0a0f', // Deep dark background
      paper: 'rgba(15, 15, 25, 0.8)', // Semi-transparent paper with blur
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.1)',
    action: {
      hover: 'rgba(99, 102, 241, 0.05)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
      background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      lineHeight: { xs: 1.2, md: 1.1 },
    },
    h2: {
      fontWeight: 600,
      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
      lineHeight: { xs: 1.3, md: 1.2 },
    },
    h3: {
      fontWeight: 600,
      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
      lineHeight: { xs: 1.3, md: 1.2 },
    },
    h4: {
      fontWeight: 600,
      fontSize: { xs: '1.25rem', sm: '1.375rem', md: '1.5rem' },
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: { xs: '1.125rem', sm: '1.1875rem', md: '1.25rem' },
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: { xs: '1rem', sm: '1.0625rem', md: '1.125rem' },
      lineHeight: 1.4,
    },
    body1: {
      fontSize: { xs: '0.875rem', sm: '1rem' },
      lineHeight: 1.5,
    },
    body2: {
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      lineHeight: 1.5,
    },
    button: {
      fontSize: { xs: '0.875rem', sm: '1rem' },
      fontWeight: 500,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 50%, #0f0f23 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: -1,
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.02\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            pointerEvents: 'none',
            zIndex: -1,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 16,
          fontWeight: 500,
          padding: '12px 24px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5b5bf1 0%, #7c3aed 100%)',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(15, 15, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(15, 15, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
          },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 35px 60px -12px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 15, 25, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: 'none',
          transition: 'none',
          '&:hover': {
            transform: 'none',
            background: 'rgba(15, 15, 25, 0.9)',
            backdropFilter: 'blur(20px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
        },
        bar: {
          borderRadius: 8,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        },
      },
    },
  },
});

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente para proteger rutas que requieren roles específicos
const RoleProtectedRoute = ({ children, requiredRoles }) => {
  const { userProfile, isSuperAdmin } = useAuth();
  
  // Si es superadministrador, tiene acceso a todo
  if (isSuperAdmin()) {
    return children;
  }
  
  // Verificar si el usuario tiene uno de los roles requeridos
  if (!userProfile || !userProfile.role) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (!requiredRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Componente que verifica el modo mantenimiento
const MaintenanceWrapper = ({ children }) => {
  const { isMaintenanceMode, loading, error } = useMaintenanceMode();
  const { isSuperAdmin } = useAuth();
  
  // Debug logs
  console.log('🔧 MaintenanceWrapper Debug:', {
    isMaintenanceMode,
    loading,
    error,
    isSuperAdmin: isSuperAdmin()
  });
  
  // Mostrar loading mientras verifica el modo mantenimiento
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1e1b4b 50%, #0f0f23 100%)'
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Cargando sistema...
        </Typography>
      </Box>
    );
  }
  
  // Si el modo mantenimiento está activo y el usuario no es super admin
  if (isMaintenanceMode && !isSuperAdmin()) {
    console.log('🚧 ACTIVANDO PANTALLA DE MANTENIMIENTO - Usuario no es admin');
    return <MaintenanceMode />;
  }
  
  // Si el usuario es super admin, mostrar una barra de advertencia
  if (isMaintenanceMode && isSuperAdmin()) {
    console.log('🚨 MODO MANTENIMIENTO ACTIVO - Mostrando barra de advertencia para admin');
    return (
      <Box>
        {/* Barra de advertencia para administradores */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            zIndex: 9999,
            py: 1,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            🚧 MODO MANTENIMIENTO ACTIVO - Solo administradores pueden acceder
          </Typography>
        </Box>
        <Box sx={{ mt: '40px' }}>
          {children}
        </Box>
      </Box>
    );
  }
  
  return children;
};

// Layout principal con navbar
const AppLayout = ({ children }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      overflow: 'hidden' 
    }}>
      <Navbar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          bgcolor: 'background.default',
          overflow: 'auto',
          position: 'relative',
          // Add responsive padding and top margin for fixed header
          px: { xs: 1, sm: 2, md: 3 },
          py: { xs: 2, md: 3 },
          pt: { xs: '80px', md: '88px' } // Space for fixed header
        }}
      >
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
      <TourFloatingButton />
      <PageTourButton />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta de login sin layout */}
            <Route path="/login" element={<Login />} />
            
            {/* Ruta de asignación compartida (sin autenticación) */}
            <Route path="/shared/:shareableId" element={<SharedAssignment />} />
            
            {/* Rutas protegidas con layout y verificación de mantenimiento */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/assignments"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Assignments />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/series-management"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <SeriesManagement />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Users />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <AdminPanel />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/myworks"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR, ROLES.EDITOR, ROLES.TRADUCTOR]}>
                    <MaintenanceWrapper>
                      <AppLayout>
                        <MyWorks />
                      </AppLayout>
                    </MaintenanceWrapper>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/uploads"
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Uploads />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/reviews"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR]}>
                    <MaintenanceWrapper>
                      <AppLayout>
                        <ReviewPanel />
                      </AppLayout>
                    </MaintenanceWrapper>
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
