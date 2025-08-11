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
  Divider
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
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
      console.error('Error al cerrar sesión:', error);
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
            Asignaciones
          </Button>

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
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {userProfile?.name || currentUser?.email}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {getRoleDisplayName(userProfile?.role)}
                </Typography>
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
