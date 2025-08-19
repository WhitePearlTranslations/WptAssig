# Sistema de Notificaciones Push - Implementación Completa

Este documento describe el sistema de notificaciones push implementado para la aplicación de asignaciones de manga.

## Archivos Creados

### 1. `src/services/notificationService.js`
Servicio principal que gestiona:
- Permisos de notificaciones del navegador
- Configuración de preferencias de usuario
- Envío de diferentes tipos de notificaciones
- Almacenamiento local de configuraciones

**Tipos de notificaciones soportadas:**
- Nuevas asignaciones
- Asignaciones próximas a vencer (24h, 12h, 3h)
- Asignaciones vencidas
- Revisiones pendientes (para jefes)
- Trabajos aprobados
- Trabajos rechazados

### 2. `src/components/NotificationPermissionBanner.js`
Componente React que muestra un banner en el dashboard para:
- Solicitar permisos de notificación
- Configurar qué tipos de notificaciones recibir
- Probar notificaciones
- Mostrar estado actual de los permisos

### 3. `src/hooks/useNotificationMonitor.js`
Hook React que monitorea automáticamente:
- Cambios en asignaciones para detectar nuevas
- Fechas límite próximas y vencidas
- Cambios de estado de trabajos
- Revisiones pendientes para jefes

**Características del monitoreo:**
- Evita spam con límites de tiempo entre notificaciones
- Filtra por rol de usuario para notificaciones relevantes
- Maneja diferentes intervalos según urgencia

## Integración en Dashboard

El sistema se integra en `src/pages/Dashboard.js` con:
- Banner de permisos que aparece automáticamente si no están concedidos
- Hook de monitoreo que trabaja en segundo plano
- Seguimiento de todas las asignaciones para detectar cambios

## Configuraciones de Usuario

El sistema permite configurar individualmente:
- `newAssignments`: Notificar nuevas asignaciones
- `dueSoon`: Notificar asignaciones próximas a vencer
- `overdue`: Notificar asignaciones vencidas
- `reviews`: Notificar revisiones pendientes (solo jefes)
- `approved`: Notificar trabajos aprobados
- `rejected`: Notificar trabajos rechazados

## Lógica de Roles

### Para Trabajadores (Traductor, Editor, etc.):
- Nuevas asignaciones propias
- Sus asignaciones próximas a vencer
- Sus asignaciones vencidas
- Estado de sus trabajos (aprobado/rechazado)

### Para Jefes (Admin, Jefe Editor, Jefe Traductor):
- Todo lo anterior
- Revisiones pendientes según su área de competencia
- Jefe Editor: puede revisar proofreading, clean/redrawer y typesetting
- Jefe Traductor: puede revisar traducciones
- Admin: puede revisar todo

## Tecnología Utilizada

- **Notification API** del navegador para mostrar notificaciones push
- **localStorage** para persistir configuraciones de usuario
- **React Hooks** para integración con el ciclo de vida de componentes
- **Material-UI** para la interfaz de usuario del banner
- **Referencias React** para evitar notificaciones duplicadas

## Uso

1. **Usuario nuevo**: El banner aparece automáticamente solicitando permisos
2. **Configuración**: El usuario puede personalizar qué notificaciones recibir
3. **Monitoreo automático**: El sistema funciona en segundo plano mientras navega
4. **Notificaciones inteligentes**: Solo se muestran notificaciones relevantes según el rol

## Notas Importantes

- Las notificaciones solo funcionan si el navegador tiene permisos concedidos
- El sistema respeta las preferencias del usuario
- Se evita el spam con límites de tiempo entre notificaciones similares
- Las configuraciones se mantienen entre sesiones del navegador
- El sistema es completamente opcional y no interfiere con el funcionamiento normal

## Próximos Pasos Posibles

1. Integrar con Service Workers para notificaciones offline
2. Añadir notificaciones por email como respaldo
3. Implementar notificaciones de menciones en comentarios
4. Agregar estadísticas de notificaciones enviadas
5. Soporte para notificaciones de horarios programados
