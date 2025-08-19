import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Collapse,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';

const NotificationPermissionBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    checkNotificationStatus();
    loadSettings();
  }, []);

  const checkNotificationStatus = () => {
    if (!notificationService.isSupported) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Mostrar banner solo si no tiene permisos y no ha sido descartado recientemente
    const shouldShow = currentPermission === 'default' && 
                      notificationService.shouldShowPermissionPrompt() &&
                      !getDismissedState();
    
    setShowBanner(shouldShow);
  };

  const loadSettings = () => {
    const userSettings = notificationService.getUserNotificationSettings();
    setSettings(userSettings);
  };

  const getDismissedState = () => {
    const dismissed = localStorage.getItem('notificationBannerDismissed');
    if (!dismissed) return false;
    
    const dismissedTime = new Date(dismissed);
    const now = new Date();
    const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
    
    // Mostrar de nuevo después de 7 días
    return hoursSinceDismissed < (7 * 24);
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        setShowBanner(false);
        // Mostrar notificación de prueba
        await notificationService.showNotification(
          '🎉 ¡Notificaciones Habilitadas!',
          {
            body: 'Ahora recibirás notificaciones sobre tus asignaciones.',
            requireInteraction: false
          }
        );
      }
      
      notificationService.recordPermissionPrompt();
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem('notificationBannerDismissed', new Date().toISOString());
  };

  const handleSettingChange = (setting, enabled) => {
    const newSettings = { ...settings, [setting]: enabled };
    setSettings(newSettings);
    notificationService.saveUserNotificationSettings(newSettings);
  };

  const testNotification = async () => {
    if (notificationService.hasPermission()) {
      await notificationService.showNotification(
        '🧪 Notificación de Prueba',
        {
          body: 'Esta es una notificación de prueba para verificar que funciona correctamente.',
          requireInteraction: false
        }
      );
    }
  };

  if (!notificationService.isSupported) {
    return null;
  }

  // Banner para solicitar permisos
  if (showBanner && permission === 'default' && !dismissed) {
    return (
      <Card 
        sx={{ 
          mb: 3, 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '16px'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <NotificationsIcon sx={{ color: 'white', fontSize: '24px' }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                🔔 Habilita las Notificaciones
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Mantente informado sobre tus asignaciones y nunca te pierdas una fecha límite. 
                Recibirás notificaciones sobre:
              </Typography>

              <Box sx={{ mb: 2, ml: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  📋 Nuevas asignaciones asignadas a ti
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  ⏰ Asignaciones que están por vencer
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  👔 Revisiones pendientes (para jefes)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  ✅ Estado de tus trabajos (aprobados/rechazados)
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={handleRequestPermission}
                  loading={loading}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b5cf6, #7c3aed)',
                    }
                  }}
                >
                  {loading ? 'Solicitando...' : 'Habilitar Notificaciones'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleDismiss}
                  sx={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}
                >
                  Ahora No
                </Button>
              </Box>
            </Box>

            <IconButton onClick={handleDismiss} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Panel de configuración para usuarios con permisos ya concedidos
  if (permission === 'granted') {
    return (
      <Card 
        sx={{ 
          mb: 3, 
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <NotificationsIcon sx={{ color: '#10b981', fontSize: '20px' }} />
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                  ✅ Notificaciones Habilitadas
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recibirás alertas sobre tus asignaciones
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<SettingsIcon />}
                onClick={() => setShowSettings(!showSettings)}
                endIcon={showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ textTransform: 'none' }}
              >
                Configurar
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                onClick={testNotification}
                sx={{ textTransform: 'none' }}
              >
                Probar
              </Button>
            </Box>
          </Box>

          <Collapse in={showSettings}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Configuración de Notificaciones
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.newAssignments || false}
                    onChange={(e) => handleSettingChange('newAssignments', e.target.checked)}
                    color="primary"
                  />
                }
                label="Nuevas asignaciones"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dueSoon || false}
                    onChange={(e) => handleSettingChange('dueSoon', e.target.checked)}
                    color="primary"
                  />
                }
                label="Asignaciones por vencer"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.overdue || false}
                    onChange={(e) => handleSettingChange('overdue', e.target.checked)}
                    color="primary"
                  />
                }
                label="Asignaciones vencidas"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.reviews || false}
                    onChange={(e) => handleSettingChange('reviews', e.target.checked)}
                    color="primary"
                  />
                }
                label="Revisiones pendientes (jefes)"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.approved || false}
                    onChange={(e) => handleSettingChange('approved', e.target.checked)}
                    color="primary"
                  />
                }
                label="Trabajos aprobados"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.rejected || false}
                    onChange={(e) => handleSettingChange('rejected', e.target.checked)}
                    color="primary"
                  />
                }
                label="Trabajos rechazados"
              />
            </FormGroup>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  // Banner para usuarios que denegaron permisos
  if (permission === 'denied') {
    return (
      <Alert 
        severity="warning" 
        sx={{ mb: 3, borderRadius: '16px' }}
        action={
          <IconButton onClick={() => setShowBanner(false)} size="small">
            <CloseIcon />
          </IconButton>
        }
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Notificaciones Bloqueadas
          </Typography>
          <Typography variant="caption">
            Para recibir notificaciones, debes habilitarlas en la configuración de tu navegador.
            Ve a Configuración → Privacidad y Seguridad → Notificaciones.
          </Typography>
        </Box>
      </Alert>
    );
  }

  return null;
};

export default NotificationPermissionBanner;
