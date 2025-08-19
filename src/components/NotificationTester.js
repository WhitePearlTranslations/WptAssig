import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Science as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { notificationService } from '../services/notificationService';
import { backgroundSyncService } from '../services/backgroundSyncService';

const NotificationTester = () => {
  const [swStatus, setSwStatus] = useState({});
  const [notificationStatus, setNotificationStatus] = useState({});
  const [backgroundSyncStatus, setBackgroundSyncStatus] = useState({});
  const [settings, setSettings] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    setSwStatus(notificationService.getServiceWorkerStatus());
    setNotificationStatus({
      hasPermission: notificationService.hasPermission(),
      isSupported: notificationService.isSupported,
      isOfflineSupported: notificationService.isOfflineNotificationSupported()
    });
    setBackgroundSyncStatus(backgroundSyncService.getStatus());
    setSettings(notificationService.getUserNotificationSettings());
  };

  const requestPermission = async () => {
    try {
      const granted = await notificationService.requestPermission();
      if (granted) {
        addTestResult('✅ Permisos de notificación concedidos', 'success');
      } else {
        addTestResult('❌ Permisos de notificación denegados', 'error');
      }
      updateStatus();
    } catch (error) {
      addTestResult(`❌ Error solicitando permisos: ${error.message}`, 'error');
    }
  };

  const testBasicNotification = async () => {
    try {
      const notification = await notificationService.showNotification(
        '🧪 Prueba de Notificación',
        {
          body: 'Esta es una notificación de prueba básica',
          tag: 'test-basic',
          requireInteraction: false
        }
      );
      
      if (notification) {
        addTestResult('✅ Notificación básica enviada correctamente', 'success');
      } else {
        addTestResult('❌ Error enviando notificación básica', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Error en notificación básica: ${error.message}`, 'error');
    }
  };

  const testAssignmentNotification = async () => {
    try {
      const mockAssignment = {
        id: 'test-123',
        mangaTitle: 'Manga de Prueba',
        chapter: '42',
        type: 'traduccion'
      };
      
      const notification = await notificationService.notifyNewAssignment(mockAssignment);
      
      if (notification) {
        addTestResult('✅ Notificación de nueva asignación enviada', 'success');
      } else {
        addTestResult('❌ Error enviando notificación de asignación', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Error en notificación de asignación: ${error.message}`, 'error');
    }
  };

  const testPersistentNotification = async () => {
    try {
      if (!swStatus.isActive) {
        addTestResult('❌ Service Worker no está activo para notificaciones persistentes', 'error');
        return;
      }

      const notification = await notificationService.showNotification(
        '📌 Notificación Persistente',
        {
          body: 'Esta notificación funcionará incluso si cierras la página',
          tag: 'test-persistent',
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'Ver' },
            { action: 'dismiss', title: 'Descartar' }
          ]
        }
      );
      
      if (notification) {
        addTestResult('✅ Notificación persistente (Service Worker) enviada', 'success');
      } else {
        addTestResult('❌ Error enviando notificación persistente', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Error en notificación persistente: ${error.message}`, 'error');
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    addTestResult('🚀 Iniciando pruebas de notificación...', 'info');
    
    // Test 1: Verificar soporte
    addTestResult(`📱 Soporte de notificaciones: ${notificationStatus.isSupported ? '✅' : '❌'}`, 
      notificationStatus.isSupported ? 'success' : 'error');
    
    // Test 2: Verificar Service Worker
    addTestResult(`⚙️ Service Worker: ${swStatus.isActive ? '✅ Activo' : '❌ Inactivo'}`, 
      swStatus.isActive ? 'success' : 'error');
    
    // Test 3: Verificar permisos
    if (!notificationStatus.hasPermission) {
      addTestResult('⚠️ Sin permisos de notificación. Solicitando...', 'warning');
      await requestPermission();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
    } else {
      addTestResult('✅ Permisos de notificación ya concedidos', 'success');
    }
    
    // Test 4: Notificación básica
    await new Promise(resolve => setTimeout(resolve, 500));
    await testBasicNotification();
    
    // Test 5: Notificación de asignación
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAssignmentNotification();
    
    // Test 6: Notificación persistente
    await new Promise(resolve => setTimeout(resolve, 500));
    await testPersistentNotification();
    
    // Test 7: Background Sync
    await new Promise(resolve => setTimeout(resolve, 500));
    addTestResult(`🔄 Background Sync: ${backgroundSyncStatus.isSupported ? '✅ Soportado' : '❌ No soportado'}`, 
      backgroundSyncStatus.isSupported ? 'success' : 'warning');
    
    addTestResult('🏁 Pruebas completadas', 'info');
    setIsRunningTests(false);
  };

  const addTestResult = (message, type = 'info') => {
    const result = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    notificationService.saveUserNotificationSettings(newSettings);
    addTestResult(`⚙️ Configuración '${key}' ${newSettings[key] ? 'activada' : 'desactivada'}`, 'info');
  };

  const getStatusChip = (isActive, activeText, inactiveText) => (
    <Chip
      label={isActive ? activeText : inactiveText}
      color={isActive ? 'success' : 'error'}
      size="small"
      icon={isActive ? <CheckIcon /> : <ErrorIcon />}
    />
  );

  const getTestResultColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TestIcon />
        Probador de Notificaciones
      </Typography>
      
      <Grid container spacing={3}>
        {/* Estado del Sistema */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon />
                Estado del Sistema
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Service Worker
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getStatusChip(swStatus.isSupported, 'Soportado', 'No Soportado')}
                  {getStatusChip(swStatus.isRegistered, 'Registrado', 'No Registrado')}
                  {getStatusChip(swStatus.isActive, 'Activo', 'Inactivo')}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Notificaciones
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getStatusChip(notificationStatus.isSupported, 'Soportadas', 'No Soportadas')}
                  {getStatusChip(notificationStatus.hasPermission, 'Permitidas', 'Sin Permisos')}
                  {getStatusChip(notificationStatus.isOfflineSupported, 'Offline OK', 'Solo Online')}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Background Sync
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {getStatusChip(backgroundSyncStatus.isSupported, 'Soportado', 'No Soportado')}
                  {getStatusChip(backgroundSyncStatus.isActive, 'Activo', 'Inactivo')}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuraciones */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Configuraciones
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={<Switch checked={settings.newAssignments} onChange={() => toggleSetting('newAssignments')} />}
                  label="Nuevas asignaciones"
                />
                <FormControlLabel
                  control={<Switch checked={settings.dueSoon} onChange={() => toggleSetting('dueSoon')} />}
                  label="Próximas a vencer"
                />
                <FormControlLabel
                  control={<Switch checked={settings.overdue} onChange={() => toggleSetting('overdue')} />}
                  label="Vencidas"
                />
                <FormControlLabel
                  control={<Switch checked={settings.reviews} onChange={() => toggleSetting('reviews')} />}
                  label="Revisiones pendientes"
                />
                <FormControlLabel
                  control={<Switch checked={settings.approved} onChange={() => toggleSetting('approved')} />}
                  label="Trabajos aprobados"
                />
                <FormControlLabel
                  control={<Switch checked={settings.rejected} onChange={() => toggleSetting('rejected')} />}
                  label="Trabajos rechazados"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Controles de Prueba */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon />
                Pruebas de Notificación
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  startIcon={<TestIcon />}
                >
                  {isRunningTests ? 'Ejecutando Pruebas...' : 'Ejecutar Todas las Pruebas'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={requestPermission}
                  disabled={notificationStatus.hasPermission}
                >
                  Solicitar Permisos
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={testBasicNotification}
                  disabled={!notificationStatus.hasPermission}
                >
                  Prueba Básica
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={testPersistentNotification}
                  disabled={!swStatus.isActive}
                >
                  Prueba Persistente
                </Button>
              </Box>

              {isRunningTests && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ejecutando pruebas...
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ mb: 2 }} />
              
              {/* Resultados de las Pruebas */}
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {testResults.map((result) => (
                  <Alert 
                    key={result.id} 
                    severity={getTestResultColor(result.type)} 
                    sx={{ mb: 1 }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {result.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.timestamp}
                      </Typography>
                    </Box>
                  </Alert>
                ))}
                
                {testResults.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Haz clic en "Ejecutar Todas las Pruebas" para comenzar
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationTester;
