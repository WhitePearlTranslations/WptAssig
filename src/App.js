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
import MaintenanceMode from './components/MaintenanceMode';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6a9eff',
      light: '#8fb8ff',
      dark: '#4a7edf',
    },
    secondary: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#7c5cbf',
    },
    background: {
      default: '#0f1014',
      paper: '#17181d',
    },
    text: {
      primary: '#e2e4e9',
      secondary: '#7d8190',
    },
    divider: 'rgba(255, 255, 255, 0.07)',
    action: {
      hover: 'rgba(106, 158, 255, 0.08)',
    },
    success: {
      main: '#34a853',
    },
    warning: {
      main: '#f5a623',
    },
    error: {
      main: '#e84855',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.15,
      color: '#e2e4e9',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.25,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
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
          background: '#0f1014',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '10px 20px',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'none',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        contained: {
          backgroundColor: '#6a9eff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#5a8eef',
            boxShadow: '0 2px 8px rgba(106, 158, 255, 0.25)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.25)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#17181d',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          backgroundImage: 'none',
          transition: 'border-color 0.2s ease',
          '&:hover': {
            transform: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#17181d',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          backgroundImage: 'none',
          transition: 'border-color 0.2s ease',
          '&:hover': {
            transform: 'none',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 16, 20, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
          backgroundImage: 'none',
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            transform: 'none',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        bar: {
          borderRadius: 4,
          backgroundColor: '#6a9eff',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          backgroundColor: '#1e1f25',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
        },
        head: {
          fontWeight: 600,
          color: '#7d8190',
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
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
  
  
  // Mostrar loading mientras verifica el modo mantenimiento
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f1014'
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
    return <MaintenanceMode />;
  }
  
  // Si el usuario es super admin, mostrar una barra de advertencia
  if (isMaintenanceMode && isSuperAdmin()) {
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
              background: '#1e1f25',
              color: '#e2e4e9',
              border: '1px solid rgba(255, 255, 255, 0.08)',
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
