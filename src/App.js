import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'motion/react';

import { AuthProvider, useAuth, ROLES } from './contexts/AuthContextSimple';
import './scripts/setupAdmin'; // Cargar script de configuración
import './utils/migrateAssignmentTypes'; // Cargar utilidad de migración
import theme from './theme/theme';
import { colors, radius } from './theme/tokens';
import AppLayout from './components/layout/AppLayout';
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
          bgcolor: 'background.default'
        }}
      >
        <Typography variant="body1" color="text.secondary">
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
        {/* Aviso para administradores: en el flujo, no flotando sobre la barra lateral */}
        <Box
          role="status"
          sx={{
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 0.75,
            px: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Modo mantenimiento activo: solo los administradores pueden entrar
          </Typography>
        </Box>
        {children}
      </Box>
    );
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <MotionConfig reducedMotion="user">
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta de login sin layout */}
            <Route path="/login" element={<Login />} />

            {/* Ruta de asignación compartida (sin autenticación) */}
            <Route path="/shared/:shareableId" element={<SharedAssignment />} />

            {/* Rutas protegidas: el layout (barra lateral) se monta una vez y
                persiste entre páginas; cada página se pinta en <Outlet />. */}
            <Route
              element={
                <ProtectedRoute>
                  <MaintenanceWrapper>
                    <AppLayout>
                      <Outlet />
                    </AppLayout>
                  </MaintenanceWrapper>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/series-management" element={<SeriesManagement />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route
                path="/myworks"
                element={
                  <RoleProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR, ROLES.EDITOR, ROLES.TRADUCTOR]}>
                    <MyWorks />
                  </RoleProtectedRoute>
                }
              />
              <Route path="/uploads" element={<Uploads />} />
              <Route
                path="/reviews"
                element={
                  <RoleProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR]}>
                    <ReviewPanel />
                  </RoleProtectedRoute>
                }
              />
            </Route>

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
              background: colors.surfaceHighest,
              color: colors.onSurface,
              borderRadius: radius.md,
              fontSize: '0.875rem',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            },
            success: {
              iconTheme: {
                primary: colors.goodNews,
                secondary: colors.surfaceLowest,
              },
            },
            error: {
              iconTheme: {
                primary: colors.error,
                secondary: colors.surfaceLowest,
              },
            },
          }}
        />
      </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default App;
