import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, ButtonBase, Tooltip, Typography, Avatar } from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import {
  SpaceDashboardOutlined,
  AssignmentOutlined,
  WorkOutline,
  RateReviewOutlined,
  PeopleOutline,
  LibraryBooksOutlined,
  CloudUploadOutlined,
  AdminPanelSettingsOutlined,
  LogoutOutlined,
  ChevronLeft,
  MenuRounded,
  CloseRounded,
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth, ROLES } from '../../contexts/AuthContextSimple';
import { colors, radius, divider, focusOutline } from '../../theme/tokens';
import { EASE_OUT_EXPO, duration } from '../../theme/motion';
import { triggerHaptic } from '../../hooks/useWebHaptics';
import PressIconButton from '../motion/PressIconButton';

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 68;
const DRAWER_WIDTH = 256;
const MOBILE_BAR_HEIGHT = 56;

const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.JEFE_EDITOR]: 'Jefe de edición',
  [ROLES.JEFE_TRADUCTOR]: 'Jefe de traducción',
  [ROLES.UPLOADER]: 'Uploader',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.TRADUCTOR]: 'Traductor',
};

const WORKER_ROLES = [ROLES.ADMIN, ROLES.JEFE_EDITOR, ROLES.JEFE_TRADUCTOR, ROLES.EDITOR, ROLES.TRADUCTOR];

/** Permisos que deciden qué apartados ve cada persona. */
function useNavPermissions() {
  const { currentUser, userProfile, checkPermission } = useAuth();
  const [perms, setPerms] = useState({ uploads: false, assign: false, reviews: false });

  useEffect(() => {
    let cancelled = false;
    if (!currentUser || !userProfile) {
      setPerms({ uploads: false, assign: false, reviews: false });
      return undefined;
    }
    Promise.all([
      checkPermission('canManageUploads'),
      checkPermission('canAssignChapters'),
      checkPermission('canModerateReviews'),
    ])
      .then(([uploads, assign, reviews]) => {
        if (!cancelled) setPerms({ uploads, assign, reviews });
      })
      .catch(() => {
        if (!cancelled) setPerms({ uploads: false, assign: false, reviews: false });
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser, userProfile, checkPermission]);

  return perms;
}

/**
 * Apartados agrupados por lo que se hace en cada sitio. «Revisiones» va en el
 * primer bloque, junto al panel, porque es lo que tiene trabajo esperando.
 */
function useNavGroups() {
  const { userProfile, hasRole, isSuperAdmin } = useAuth();
  const perms = useNavPermissions();
  const isAdmin = hasRole(ROLES.ADMIN) || isSuperAdmin();

  return [
    {
      label: null,
      items: [
        { to: '/dashboard', icon: SpaceDashboardOutlined, label: 'Panel', show: true },
        { to: '/reviews', icon: RateReviewOutlined, label: 'Revisiones', show: perms.reviews, badge: 'reviews' },
      ],
    },
    {
      label: 'Trabajo',
      items: [
        { to: '/myworks', icon: WorkOutline, label: 'Mis trabajos', show: WORKER_ROLES.includes(userProfile?.role) },
        { to: '/assignments', icon: AssignmentOutlined, label: 'Asignaciones', show: perms.assign },
        { to: '/uploads', icon: CloudUploadOutlined, label: 'Subidas', show: perms.uploads },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { to: '/series-management', icon: LibraryBooksOutlined, label: 'Series', show: true },
        { to: '/users', icon: PeopleOutline, label: 'Usuarios', show: isAdmin },
        { to: '/admin', icon: AdminPanelSettingsOutlined, label: 'Administración', show: isAdmin },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.show) }))
    .filter((group) => group.items.length > 0);
}

const navItemSx = (collapsed) => ({
  position: 'relative',
  isolation: 'isolate',
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  minHeight: 40,
  px: 1.5,
  width: '100%',
  borderRadius: `${radius.lg}px`,
  fontSize: '0.875rem',
  fontWeight: 500,
  color: colors.onSurfaceVariant,
  textDecoration: 'none',
  transition: 'background-color 150ms ease-out, color 150ms ease-out, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  justifyContent: { lg: collapsed ? 'center' : 'flex-start' },
  '&:hover': { backgroundColor: colors.surfaceContainer, color: colors.onSurface },
  '&.active': { color: colors.onSurface },
  '&:active': { transform: 'scale(0.98)' },
  '&.active .nav-icon': { color: colors.primary },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
  '&:focus-visible': { ...focusOutline, outlineOffset: -2 },
});

const srOnlyWhenCollapsed = (collapsed) =>
  collapsed
    ? {
        flex: 1,
        '@media (min-width:1200px)': {
          position: 'absolute',
          // En sx, 1 significa 100 %: hay que poner px
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        },
      }
    : { flex: 1, minWidth: 0 };

function CountBadge({ count, collapsed, label }) {
  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
    <Box
      component={motion.span}
      key={count}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ duration: duration.base, ease: EASE_OUT_EXPO }}
      aria-label={label}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 20,
        minWidth: 20,
        px: 0.75,
        borderRadius: 999,
        backgroundColor: colors.attention,
        color: colors.surfaceLowest,
        fontSize: '0.6875rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        ...(collapsed && { '@media (min-width:1200px)': { position: 'absolute', top: 4, right: 4 } }),
      }}
    >
      {count > 99 ? '99+' : count}
    </Box>
      )}
    </AnimatePresence>
  );
}

export function AppSidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile, pendingReviews = 0 }) {
  const { currentUser, userProfile } = useAuth();
  const groups = useNavGroups();
  const location = useLocation();
  const navigate = useNavigate();
  const closeRef = useRef(null);

  // En móvil el menú es un cajón modal: foco dentro al abrir y Escape para cerrar.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleLogout = async () => {
    triggerHaptic('medium');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      onCloseMobile();
      navigate('/login');
    }
  };

  const displayName = userProfile?.name || currentUser?.email || '';

  return (
    <>
      {mobileOpen && (
        <Box
          onClick={onCloseMobile}
          aria-hidden="true"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1199,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: { lg: 'none' },
          }}
        />
      )}

      <Box
        component="aside"
        aria-label="Navegación principal"
        sx={{
          position: { xs: 'fixed', lg: 'sticky' },
          top: 0,
          left: 0,
          zIndex: { xs: 1200, lg: 1 },
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          width: { xs: DRAWER_WIDTH, lg: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH },
          backgroundColor: colors.surfaceLowest,
          borderRight: `1px solid ${divider}`,
          transform: { xs: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', lg: 'none' },
          visibility: { xs: mobileOpen ? 'visible' : 'hidden', lg: 'visible' },
          // Solo se anima el cajón móvil (transform). Contraer en escritorio es
          // instantáneo: animar el ancho recalcula el layout de toda la página.
          // Al abrir, `visibility` cambia en el acto para poder mover el foco al
          // botón de cerrar; al cerrar espera a que termine el deslizamiento.
          transition: mobileOpen
            ? 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 250ms',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        {/* Cabecera */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: MOBILE_BAR_HEIGHT,
            px: 1.5,
            justifyContent: { lg: collapsed ? 'center' : 'flex-start' },
          }}
        >
          <Box
            sx={{
              display: { xs: 'flex', lg: collapsed ? 'none' : 'flex' },
              alignItems: 'center',
              gap: 1.25,
              flex: 1,
              minWidth: 0,
              pl: 0.5,
            }}
          >
            <Box
              component="img"
              src="/logo.webp"
              alt=""
              sx={{ width: 28, height: 28, borderRadius: `${radius.DEFAULT}px`, objectFit: 'cover', flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.onSurface, lineHeight: 1.3 }}>
                WhitePearl
              </Typography>
              <Typography noWrap sx={{ fontSize: '0.6875rem', fontWeight: 500, color: colors.onSurfaceVariant, lineHeight: 1.3 }}>
                Asignaciones
              </Typography>
            </Box>
          </Box>
          <PressIconButton
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            aria-expanded={!collapsed}
            sx={{ display: { xs: 'none', lg: 'inline-flex' }, width: 32, height: 32, borderRadius: `${radius.md}px` }}
          >
            <motion.span
              style={{ display: 'inline-flex' }}
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: duration.slow, ease: EASE_OUT_EXPO }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </motion.span>
          </PressIconButton>
          <PressIconButton
            ref={closeRef}
            onClick={onCloseMobile}
            aria-label="Cerrar menú"
            sx={{ display: { xs: 'inline-flex', lg: 'none' }, width: 40, height: 40 }}
          >
            <CloseRounded sx={{ fontSize: 20 }} />
          </PressIconButton>
        </Box>

        {/* Apartados */}
        <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {groups.map((group, gi) => (
            <Box key={group.label ?? gi}>
              {group.label && (
                <>
                  <Typography
                    sx={{
                      display: { xs: 'block', lg: collapsed ? 'none' : 'block' },
                      mb: 0.5,
                      px: 1.5,
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: colors.outline,
                    }}
                  >
                    {group.label}
                  </Typography>
                  {collapsed && (
                    <Box
                      aria-hidden="true"
                      sx={{ display: { xs: 'none', lg: 'block' }, mx: 1.5, mb: 1, borderTop: `1px solid ${divider}` }}
                    />
                  )}
                </>
              )}
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {group.items.map(({ to, icon: Icon, label, badge }) => {
                  const active = isActive(to);
                  const count = badge === 'reviews' ? pendingReviews : 0;
                  return (
                    <li key={to}>
                      <Tooltip title={collapsed ? label : ''} placement="right" disableInteractive>
                        <Box
                          component={NavLink}
                          to={to}
                          onClick={() => {
                            if (!active) triggerHaptic('light');
                            onCloseMobile();
                          }}
                          className={active ? 'active' : undefined}
                          aria-current={active ? 'page' : undefined}
                          sx={navItemSx(collapsed)}
                        >
                          {/* El fondo del activo se desliza de un apartado a otro. */}
                          {active && (
                            <Box
                              component={motion.span}
                              layoutId="wpt-nav-activo"
                              aria-hidden="true"
                              transition={{ duration: duration.slow, ease: EASE_OUT_EXPO }}
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: -1,
                                borderRadius: `${radius.lg}px`,
                                backgroundColor: colors.surfaceHigh,
                              }}
                            />
                          )}
                          <Icon className="nav-icon" aria-hidden="true" sx={{ fontSize: 20, flexShrink: 0 }} />
                          <Box component="span" sx={srOnlyWhenCollapsed(collapsed)}>
                            {label}
                          </Box>
                          <CountBadge
                            count={count}
                            collapsed={collapsed}
                            label={`${count} ${count === 1 ? 'revisión pendiente' : 'revisiones pendientes'}`}
                          />
                        </Box>
                      </Tooltip>
                    </li>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Persona y salida */}
        <Box sx={{ borderTop: `1px solid ${divider}`, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          <Tooltip title={collapsed ? 'Perfil' : ''} placement="right" disableInteractive>
            <Box
              component={NavLink}
              to="/profile"
              onClick={onCloseMobile}
              className={isActive('/profile') ? 'active' : undefined}
              sx={{ ...navItemSx(collapsed), minHeight: 48, '&.active': { backgroundColor: colors.surfaceHigh } }}
            >
              <Avatar
                src={userProfile?.profileImage}
                alt=""
                sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700 }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={srOnlyWhenCollapsed(collapsed)}>
                <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.onSurface, lineHeight: 1.3 }}>
                  {displayName}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.6875rem', color: colors.onSurfaceVariant, lineHeight: 1.3 }}>
                  {ROLE_NAMES[userProfile?.role] || 'Perfil'}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
          <Tooltip title={collapsed ? 'Cerrar sesión' : ''} placement="right" disableInteractive>
            <ButtonBase onClick={handleLogout} sx={navItemSx(collapsed)}>
              <LogoutOutlined className="nav-icon" aria-hidden="true" sx={{ fontSize: 20, flexShrink: 0 }} />
              <Box component="span" sx={{ ...srOnlyWhenCollapsed(collapsed), textAlign: 'left' }}>
                Cerrar sesión
              </Box>
            </ButtonBase>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
}

/** Barra superior en móvil: da sitio al botón del menú sin tapar la cabecera de la página. */
export function MobileBar({ onOpenMenu, pendingReviews = 0 }) {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'none' },
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        alignItems: 'center',
        gap: 1,
        height: MOBILE_BAR_HEIGHT,
        px: 1,
        borderBottom: `1px solid ${divider}`,
        backgroundColor: 'rgba(7, 14, 29, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <PressIconButton onClick={onOpenMenu} aria-label="Abrir menú" sx={{ width: 44, height: 44 }}>
        <MenuRounded sx={{ fontSize: 22 }} />
      </PressIconButton>
      <Box component="img" src="/logo.webp" alt="" sx={{ width: 24, height: 24, borderRadius: `${radius.sm}px` }} />
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface, flex: 1 }}>WhitePearl</Typography>
      {pendingReviews > 0 && (
        <Box
          component={NavLink}
          to="/reviews"
          aria-label={`${pendingReviews} revisiones pendientes`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            height: 32,
            px: 1.25,
            mr: 0.5,
            borderRadius: 999,
            backgroundColor: colors.surfaceHigh,
            color: colors.onSurface,
            fontSize: '0.75rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontVariantNumeric: 'tabular-nums',
            '&:focus-visible': focusOutline,
          }}
        >
          <RateReviewOutlined sx={{ fontSize: 16, color: colors.attention }} aria-hidden="true" />
          {pendingReviews > 99 ? '99+' : pendingReviews}
        </Box>
      )}
    </Box>
  );
}
