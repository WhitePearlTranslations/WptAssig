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
  Chip
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
  Work as WorkIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, userProfile, hasRole } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      //  message removed for production
    }
    handleClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
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

  if (!currentUser) {
    return null;
  }

  return (
    <AppBar 
      position="static" 
      className="animate-fade-in"
      sx={{ 
        background: 'rgba(15, 15, 25, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1,
          }}
          className="animate-slide-in-left"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '12px',
              p: 1,
              mr: 2,
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            <Book sx={{ color: 'white', fontSize: '1.5rem' }} />
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
              fontSize: '1.25rem',
            }}
          >
            WhitePearl Translations
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}
          className="animate-slide-in-right"
        >
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: '12px',
              px: 2,
              py: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(99, 102, 241, 0.1)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              },
              '&:hover': {
                transform: 'translateY(-1px)',
                color: '#6366f1',
              },
            }}
          >
            Dashboard
          </Button>

          {/* Botón de Asignaciones solo para Administradores y Jefes */}
          {(hasRole(ROLES.ADMIN) || hasRole(ROLES.JEFE_EDITOR) || hasRole(ROLES.JEFE_TRADUCTOR)) && (
            <Button
              color="inherit"
              startIcon={<Assignment />}
              onClick={() => navigate('/assignments')}
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(236, 72, 153, 0.1)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  color: '#ec4899',
                },
              }}
            >
              Asignaciones
            </Button>
          )}

          {/* Botón de Mis Trabajos para roles con acceso */}
          {(userProfile?.role === ROLES.ADMIN || 
            userProfile?.role === ROLES.JEFE_EDITOR || 
            userProfile?.role === ROLES.JEFE_TRADUCTOR || 
            userProfile?.role === ROLES.EDITOR || 
            userProfile?.role === ROLES.TRADUCTOR) && (
            <Button
              color="inherit"
              startIcon={<WorkIcon />}
              onClick={() => navigate('/myworks')}
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(34, 197, 94, 0.1)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  color: '#22c55e',
                },
              }}
            >
              Mis Trabajos
            </Button>
          )}

          <Button
            color="inherit"
            startIcon={<LibraryBooks />}
            onClick={() => navigate('/series-management')}
            sx={{
              borderRadius: '12px',
              px: 2,
              py: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(16, 185, 129, 0.1)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              },
              '&:hover': {
                transform: 'translateY(-1px)',
                color: '#10b981',
              },
            }}
          >
            Series
          </Button>

          {/* Botón de Subidas para Uploaders y Administradores */}
          {(userProfile?.role === ROLES.UPLOADER || userProfile?.role === ROLES.ADMIN || userProfile?.role === 'administrador') && (
            <Button
              color="inherit"
              startIcon={<UploaderIcon />}
              onClick={() => navigate('/uploads')}
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(139, 92, 246, 0.1)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  color: '#8b5cf6',
                },
              }}
            >
              Subidas
            </Button>
          )}


          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
            sx={{
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.05)',
                background: 'rgba(99, 102, 241, 0.1)',
              },
            }}
          >
            <Avatar 
              src={userProfile?.profileImage}
              sx={{ 
                width: 36, 
                height: 36, 
                background: userProfile?.profileImage ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: '2px solid rgba(148, 163, 184, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                },
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
            className="animate-scale-in"
            sx={{
              '& .MuiPaper-root': {
                background: 'rgba(15, 15, 25, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                mt: 1,
                minWidth: 200,
              },
              '& .MuiMenuItem-root': {
                borderRadius: '12px',
                mx: 1,
                my: 0.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'rgba(99, 102, 241, 0.1)',
                  transform: 'translateX(4px)',
                },
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
  );
};

export default Navbar;
