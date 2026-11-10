import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { pageEnter } from '../../theme/motion';
import { useAuth } from '../../contexts/AuthContextSimple';
import { usePendingReviewsCount } from '../../hooks/usePendingReviews';
import { AppSidebar, MobileBar } from './AppSidebar';

const COLLAPSED_KEY = 'wpt.sidebar.collapsed';

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

/** Barra lateral a la izquierda y contenido a la derecha (máx. 1440 px). */
export default function AppLayout({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const pendingReviews = usePendingReviewsCount();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Sin localStorage (modo privado): el estado vive solo en esta pestaña.
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  if (!currentUser) return children;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={closeMobile}
        pendingReviews={pendingReviews}
      />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <MobileBar onOpenMenu={openMobile} pendingReviews={pendingReviews} />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 2, md: 3 },
          }}
        >
          {/* Entrada corta al cambiar de página (Amicro). Solo opacidad y un desplazamiento de 6 px. */}
          <motion.div key={location.pathname} {...pageEnter}>
            {children}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
