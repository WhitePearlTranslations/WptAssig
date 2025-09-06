import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip
} from '@mui/material';
import {
  AccountCircle,
  Assignment,
  People,
  Book,
  Dashboard,
  ExitToApp,
  ManageAccounts as ManageIcon,
  LibraryBooks,
  AdminPanelSettings as AdminIcon,
  CloudUpload as UploaderIcon,
  Settings as SettingsIcon,
  Work as WorkIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  HourglassTop as ReviewIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import { usePendingReviewsCount } from '../hooks/usePendingReviews';

const Navbar = () => {
  const { currentUser, userProfile, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Hook para contar revisiones pendientes (solo para jefes)
  const pendingReviewsCount = usePendingReviewsCount();
  const isChief = hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      //  message removed for production
    }
    handleClose();
    setMobileOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
    setMobileOpen(false);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.JEFE_EDITOR]: 'Jefe Editor',
      [ROLES.JEFE_TRADUCTOR]: 'Jefe Traductor',
      [ROLES.UPLOADER]: 'Uploader',
      [ROLES.EDITOR]: 'Editor',
      [ROLES.TRADUCTOR]: 'Traductor'
    };
    return roleNames[role] || role;
  };

  // Navigation items configuration
  const navigationItems = [
    {
      text: 'Dashboard',
      icon: Dashboard,
      path: '/dashboard',
      color: '#6366f1',
      show: true
    },
    {
      text: 'Asignaciones',
      icon: Assignment,
      path: '/assignments',
      color: '#ec4899',
      show: hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)
    },
    {
      text: 'Mis Trabajos',
      icon: WorkIcon,
      path: '/myworks',
      color: '#22c55e',
      show: userProfile?.role === ROLES.ADMIN || 
            userProfile?.role === ROLES.JEFE_EDITOR || 
            userProfile?.role === ROLES.JEFE_TRADUCTOR || 
            userProfile?.role === ROLES.EDITOR || 
            userProfile?.role === ROLES.TRADUCTOR
    },
    {
      text: 'Revisiones',
      icon: ReviewIcon,
      path: '/reviews',
      color: '#f59e0b',
      show: hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR),
      badge: isChief ? pendingReviewsCount : 0
    },
    {
      text: 'Usuarios',
      icon: People,
      path: '/users',
      color: '#ef4444',
      show: hasRole(ROLES.ADMIN)
    },
    {
      text: 'Series',
      icon: LibraryBooks,
      path: '/series-management',
      color: '#10b981',
      show: true
    },
    {
      text: 'Subidas',
      icon: UploaderIcon,
      path: '/uploads',
      color: '#8b5cf6',
      show: userProfile?.role === ROLES.UPLOADER || userProfile?.role === ROLES.ADMIN || userProfile?.role === 'administrador'
    }
  ];

  if (!currentUser) {
    return null;
  }

  // Mobile Drawer Content
  const drawer = (
      <Box
        sx={{
          width: 280,
          height: '100%',
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0
        }}
      >
      {/* Mobile Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 2
              }}
            >
              <img 
                src="/logo.webp" 
                alt="WhitePearl Translations Logo" 
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback to Book icon if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Book sx={{ color: 'white', fontSize: '1.2rem', display: 'none' }} />
            </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            WhitePearl
          </Typography>
          <IconButton
            onClick={handleMobileToggle}
            sx={{ ml: 'auto', color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={userProfile?.profileImage}
            sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            }}
          >
            {!userProfile?.profileImage && <AccountCircle />}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {userProfile?.name || currentUser?.email}
            </Typography>
            <Chip
              label={getRoleDisplayName(userProfile?.role)}
              size="small"
              sx={{
                background: hasRole(ROLES.ADMIN) 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                height: '20px',
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Mobile Navigation */}
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {navigationItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.path}
              data-tour={`${item.path.substring(1)}-nav`}
              sx={{
                borderRadius: '12px',
                mb: 1,
                cursor: 'pointer',
                background: isActive ? `${item.color}20` : 'transparent',
                border: isActive ? `1px solid ${item.color}40` : '1px solid transparent'
              }}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge && item.badge > 0 ? (
                  <Badge 
                    badgeContent={item.badge} 
                    color="warning" 
                    max={999}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        fontSize: '0.75rem',
                        height: '18px',
                        minWidth: '18px'
                      }
                    }}
                  >
                    <Icon sx={{ color: isActive ? item.color : '#94a3b8', fontSize: '1.2rem' }} />
                  </Badge>
                ) : (
                  <Icon sx={{ color: isActive ? item.color : '#94a3b8', fontSize: '1.2rem' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isActive ? item.color : '#f1f5f9',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem'
                  }
                }}
              />
            </ListItem>
          );
        })}
      </List>

      {/* Mobile Footer Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
        <ListItem
          data-tour="profile-menu"
          sx={{
            borderRadius: '12px',
            mb: 1,
            cursor: 'pointer'
          }}
          onClick={() => handleNavigation('/profile')}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <AccountCircle sx={{ color: '#94a3b8' }} />
          </ListItemIcon>
          <ListItemText primary="Perfil" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }} />
        </ListItem>
        
        {hasRole(ROLES.ADMIN) && (
          <ListItem
            data-tour="admin-nav"
            sx={{
              borderRadius: '12px',
              mb: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation('/admin')}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AdminIcon sx={{ color: '#ef4444' }} />
            </ListItemIcon>
            <ListItemText
              primary="Panel de Admin"
              sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', color: '#ef4444' } }}
            />
          </ListItem>
        )}
        
        <ListItem
          sx={{
            borderRadius: '12px',
            cursor: 'pointer'
          }}
          onClick={handleLogout}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <ExitToApp sx={{ color: '#ef4444' }} />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar Sesión"
            sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem', color: '#ef4444' } }}
          />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'rgba(15, 15, 25, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: 'none',
          borderRadius: 0,
          transition: 'none !important',
          transform: 'none !important',
          '&:hover': {
            transform: 'none !important',
            background: 'rgba(15, 15, 25, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
          },
        }}
      >
        <Toolbar sx={{ 
          py: { xs: 0.5, md: 1 },
          transition: 'none !important',
          transform: 'none !important',
          '&:hover': {
            transform: 'none !important'
          }
        }}>
          {/* Logo and Title */}
          <Box 
            data-tour="dashboard"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1,
              cursor: 'pointer'
            }}
            onClick={() => handleNavigation('/dashboard')}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: { xs: 1, md: 2 }
              }}
            >
              <img 
                src="/logo.webp" 
                alt="WhitePearl Translations Logo" 
                style={{
                  width: '28px',
                  height: '28px',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback to Book icon if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <Book sx={{ color: 'white', fontSize: { xs: '1.2rem', md: '1.5rem' }, display: 'none' }} />
            </Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              WhitePearl Translations
            </Typography>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '0.9rem',
                display: { xs: 'block', sm: 'none' }
              }}
            >
              WPT
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          <Box 
            sx={{ 
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center', 
              gap: 0.5
            }}
          >
            {navigationItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  color="inherit"
                  data-tour={`${item.path.substring(1)}-nav`}
                  startIcon={
                    item.badge && item.badge > 0 ? (
                      <Badge 
                        badgeContent={item.badge} 
                        color="warning" 
                        max={999}
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontSize: '0.7rem',
                            height: '16px',
                            minWidth: '16px',
                            top: '-2px',
                            right: '-2px'
                          }
                        }}
                      >
                        <Icon />
                      </Badge>
                    ) : (
                      <Icon />
                    )
                  }
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                    minWidth: 'auto',
                    background: isActive ? `${item.color}20` : 'transparent',
                    border: isActive ? `1px solid ${item.color}40` : '1px solid transparent',
                    color: isActive ? item.color : 'inherit',
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </Box>

          {/* Notification Badge for Mobile - Show before menu button */}
          {isChief && pendingReviewsCount > 0 && (
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, mr: 1 }}>
              <Tooltip title={`${pendingReviewsCount} revisión${pendingReviewsCount > 1 ? 'es' : ''} pendiente${pendingReviewsCount > 1 ? 's' : ''}`}>
              <IconButton
                onClick={() => handleNavigation('/reviews')}
                sx={{
                  borderRadius: '12px'
                }}
                >
                  <Badge 
                    badgeContent={pendingReviewsCount} 
                    color="warning" 
                    max={999}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.1)' },
                          '100%': { transform: 'scale(1)' },
                        }
                      }
                    }}
                  >
                    <ReviewIcon sx={{ color: '#f59e0b' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleMobileToggle}
              sx={{
                borderRadius: '12px'
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Desktop User Menu */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, ml: 1 }}>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
                data-tour="profile-menu"
                sx={{
                  borderRadius: '12px'
                }}
              >
              <Avatar 
                src={userProfile?.profileImage}
                sx={{ 
                  width: 36, 
                  height: 36, 
                  background: userProfile?.profileImage ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: '2px solid rgba(148, 163, 184, 0.2)'
                }}
              >
                {!userProfile?.profileImage && (
                  <AccountCircle sx={{ color: 'white' }} />
                )}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{
                '& .MuiPaper-root': {
                  background: 'rgba(15, 15, 25, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 0,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                  mt: 1,
                  minWidth: 200
                },
                '& .MuiMenuItem-root': {
                  borderRadius: '8px',
                  mx: 1,
                  my: 0.5,
                  '&.Mui-disabled': {
                    opacity: 1,
                    background: 'rgba(99, 102, 241, 0.05)',
                  },
                },
              }}
            >
              <MenuItem disabled>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {userProfile?.name || currentUser?.email}
                  </Typography>
                  <Chip
                    label={getRoleDisplayName(userProfile?.role)}
                    size="small"
                    sx={{
                      background: hasRole(ROLES.ADMIN) 
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : hasRole(ROLES.UPLOADER)
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: '24px',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleNavigation('/profile')}>
                <AccountCircle sx={{ mr: 2 }} />
                Perfil
              </MenuItem>
              {hasRole(ROLES.ADMIN) && (
                <MenuItem onClick={() => handleNavigation('/admin')}>
                  <AdminIcon sx={{ mr: 2, color: '#ef4444' }} />
                  Panel de Admin
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 2 }} />
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            border: 'none',
            background: 'rgba(15, 15, 25, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'none'
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
