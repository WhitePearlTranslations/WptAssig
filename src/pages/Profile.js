import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Edit,
  PhotoCameraOutlined as PhotoCamera,
  WallpaperOutlined as Wallpaper,
  BadgeOutlined as BadgeIcon,
  AssignmentOutlined as AssignmentIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { ref, update } from 'firebase/database';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { realtimeDb } from '../services/firebase';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';
import ImageUploader from '../components/ImageUploader';
import SystemFooter from '../components/SystemFooter';
import imagekitService from '../services/imagekitService';
import { Panel, EmptyState, MeterBar, StatusBadge, TaskTypeTag } from '../components/ui';
import { ROLE_LABELS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useWebHaptics';
import notify from '../utils/notify';
import { colors, radius, rowDivider, withAlpha } from '../theme/tokens';

// Estados que cuentan como trabajo terminado (igual que en Mis trabajos).
const DONE_STATUSES = ['completado', 'aprobado', 'uploaded'];

const Profile = () => {
  const { currentUser, userProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    profileImage: '',
    bannerImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userStats, setUserStats] = useState({
    assignmentsCompleted: 0,
    assignmentsActive: 0,
    assignmentsTotal: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [imagekitStatus, setImagekitStatus] = useState({ configured: false });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || '',
        profileImage: userProfile.profileImage || '',
        bannerImage: userProfile.bannerImage || ''
      }));
    }

    // Verificar estado de ImageKit
    setImagekitStatus(imagekitService.getConfigStatus());
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile?.uid) return;

    let unsubscribeAssignments = null;
    let unsubscribeMangas = null;

    // Initialize async subscriptions
    const initSubscriptions = async () => {
      try {
        // Get user assignments from Realtime Database
        unsubscribeAssignments = await realtimeService.subscribeToAssignments((assignments) => {
          // Filter only assignments for current user
          const userAssignments = assignments.filter(assignment => assignment.assignedTo === userProfile.uid);

          // Calculate statistics
          const completed = userAssignments.filter(assignment => DONE_STATUSES.includes(assignment.status)).length;
          const total = userAssignments.length;

          setUserStats({
            assignmentsCompleted: completed,
            assignmentsActive: total - completed,
            assignmentsTotal: total
          });

          // Get recent assignments (last 5, sorted by update date)
          const recent = userAssignments
            .sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt);
              const dateB = new Date(b.updatedAt || b.createdAt);
              return dateB - dateA;
            })
            .slice(0, 5);

          setRecentAssignments(recent);
        }, userProfile.uid);

        // Get manga information to show correct titles
        unsubscribeMangas = await realtimeService.subscribeToMangas(setMangas);
      } catch (error) {
        // Error setting up subscriptions - silently handle
      }
    };

    initSubscriptions();

    return () => {
      if (typeof unsubscribeAssignments === 'function') unsubscribeAssignments();
      if (typeof unsubscribeMangas === 'function') unsubscribeMangas();
    };
  }, [userProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = {};

      // Actualizar nombre si cambió
      if (formData.name !== userProfile.name) {
        updates.name = formData.name;
      }

      // Actualizar imagen de perfil si cambió
      if (formData.profileImage !== userProfile.profileImage) {
        updates.profileImage = formData.profileImage;
      }

      // Actualizar banner si cambió
      if (formData.bannerImage !== userProfile.bannerImage) {
        updates.bannerImage = formData.bannerImage;
      }

      // Actualizar contraseña si se proporcionó
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          notify.error('Las contraseñas nuevas no coinciden');
          return;
        }

        if (formData.newPassword.length < 6) {
          notify.error('La contraseña tiene que tener al menos 6 caracteres');
          return;
        }

        // Re-autenticar antes de cambiar contraseña
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          formData.currentPassword
        );

        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, formData.newPassword);

        notify.success('Contraseña cambiada');
      }

      // Actualizar perfil en Realtime Database
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();

        const userRef = ref(realtimeDb, `users/${currentUser.uid}`);
        await update(userRef, updates);

        notify.success('Perfil guardado');
      }

      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setEditing(false);
    } catch (error) {
      //  message removed for production
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        notify.error('La contraseña actual no es correcta');
      } else {
        notify.error('No se pudo guardar el perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userProfile?.name || '',
      profileImage: userProfile?.profileImage || '',
      bannerImage: userProfile?.bannerImage || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setEditing(false);
  };

  // Funciones para manejo de imágenes
  const handleProfileImageUpdate = (imageUrl) => {
    setFormData(prev => ({ ...prev, profileImage: imageUrl }));
    notify.info('Foto lista. Guarda para aplicarla.');
  };

  const handleBannerImageUpdate = (imageUrl) => {
    setFormData(prev => ({ ...prev, bannerImage: imageUrl }));
    notify.info('Banner listo. Guarda para aplicarlo.');
  };

  const getMangaTitle = (mangaId) => {
    const manga = mangas.find(m => m.id === mangaId);
    return manga ? manga.title : 'Serie desconocida';
  };

  if (!userProfile) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={28} aria-label="Cargando el perfil" />
      </Box>
    );
  }

  const banner = formData.bannerImage || userProfile.bannerImage;
  const avatar = formData.profileImage || userProfile.profileImage;
  const completion = userStats.assignmentsTotal > 0
    ? Math.round((userStats.assignmentsCompleted / userStats.assignmentsTotal) * 100)
    : 0;
  const passwordStarted = Boolean(formData.currentPassword || formData.newPassword || formData.confirmPassword);
  const passwordMismatch = Boolean(formData.confirmPassword) && formData.newPassword !== formData.confirmPassword;

  const startEditing = () => {
    triggerHaptic('light');
    setEditing(true);
  };

  const stat = (label, value) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.75, '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` } }}>
      <Typography component="dt" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>{label}</Typography>
      <Typography component="dd" sx={{ m: 0, fontSize: '0.9375rem', fontWeight: 600, color: colors.onSurface, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
    </Box>
  );

  return (
    <Box>
      {/* Cabecera: banner, foto, nombre y acciones */}
      <Panel sx={{ p: 0, mb: 2, overflow: 'hidden' }} contentSx={{ p: 0 }}>
        <Box
          aria-hidden="true"
          sx={{
            height: { xs: 96, sm: 150 },
            backgroundColor: colors.surfaceHigh,
            backgroundImage: banner ? `url(${banner})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Solo la foto sube sobre el banner; el nombre queda siempre debajo, sobre fondo liso */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', columnGap: 2, rowGap: 1.5, flexWrap: 'wrap', px: { xs: 2, sm: 3 }, pb: 2.5 }}>
          <Avatar
            src={avatar || undefined}
            alt=""
            sx={{
              mt: { xs: -5, sm: -6 },
              width: { xs: 80, sm: 104 },
              height: { xs: 80, sm: 104 },
              border: `4px solid ${colors.surfaceLow}`,
              backgroundColor: colors.surfaceHighest,
              color: colors.onSurfaceVariant,
            }}
          >
            {!avatar && <Person sx={{ fontSize: 44 }} />}
          </Avatar>
          <Box sx={{ flex: '1 1 200px', minWidth: 0, pt: 1.5 }}>
            <Typography component="h1" sx={{ fontSize: { xs: '1.375rem', sm: '1.625rem' }, fontWeight: 700, color: colors.onSurface, lineHeight: 1.2 }}>
              {userProfile.name || 'Sin nombre'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  height: 22,
                  px: 0.875,
                  borderRadius: `${radius.md}px`,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: userProfile.role === ROLES.ADMIN ? colors.primary : colors.onSurfaceVariant,
                  backgroundColor: userProfile.role === ROLES.ADMIN ? withAlpha(colors.primary, 0.1) : colors.surfaceHigh,
                }}
              >
                <BadgeIcon aria-hidden="true" sx={{ fontSize: 14 }} />
                {ROLE_LABELS[userProfile.role] || userProfile.role}
              </Box>
              <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                {currentUser?.email}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, pt: { xs: 0, sm: 1.5 } }}>
            {!editing ? (
              <Button variant="outlined" startIcon={<Edit />} onClick={startEditing}>
                Editar perfil
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} disabled={saving} sx={{ color: colors.onSurfaceVariant }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    triggerHaptic('medium');
                    handleSave();
                  }}
                  disabled={saving || passwordMismatch}
                  startIcon={saving ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : null}
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Panel>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Tabs
            value={activeTab}
            onChange={(e, value) => {
              triggerHaptic('light');
              setActiveTab(value);
            }}
            aria-label="Secciones del perfil"
            sx={{ mb: 2 }}
          >
            <Tab label="Datos" id="profile-tab-0" aria-controls="profile-tabpanel-0" />
            <Tab label="Imágenes" id="profile-tab-1" aria-controls="profile-tabpanel-1" />
          </Tabs>

          {/* Datos personales */}
          {activeTab === 0 && (
            <Panel role="tabpanel" id="profile-tabpanel-0" aria-labelledby="profile-tab-0">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editing}
                  helperText={editing ? 'Así te verá el resto del equipo' : undefined}
                />
                <TextField
                  fullWidth
                  label="Email"
                  value={currentUser?.email || ''}
                  disabled
                  helperText="El email no se puede cambiar"
                />

                {editing ? (
                  <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, pt: 2, mt: 1, borderTop: `1px solid ${rowDivider}` }}>
                    <Typography component="legend" variant="subtitle2" sx={{ color: colors.onSurface, p: 0, mb: 0.25 }}>
                      Cambiar la contraseña
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 1.5 }}>
                      Déjalo vacío si no quieres cambiarla.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Contraseña actual"
                        type="password"
                        autoComplete="current-password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        required={passwordStarted}
                      />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Nueva contraseña"
                          type="password"
                          autoComplete="new-password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          helperText="Al menos 6 caracteres"
                        />
                        <TextField
                          fullWidth
                          label="Repite la nueva"
                          type="password"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          error={passwordMismatch}
                          helperText={passwordMismatch ? 'No coincide con la nueva' : ' '}
                        />
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant }}>
                    Para cambiar tu nombre o la contraseña, pulsa Editar perfil.
                  </Typography>
                )}
              </Box>
            </Panel>
          )}

          {/* Imágenes: foto y banner */}
          {activeTab === 1 && (
            <Box role="tabpanel" id="profile-tabpanel-1" aria-labelledby="profile-tab-1">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  mb: 2,
                  p: 2,
                  borderRadius: `${radius.xl}px`,
                  backgroundColor: !imagekitStatus.configured ? withAlpha(colors.attention, 0.08) : colors.surfaceLow,
                }}
              >
                <InfoIcon aria-hidden="true" sx={{ fontSize: 20, color: !imagekitStatus.configured ? colors.attention : colors.outline }} />
                <Typography sx={{ flex: '1 1 240px', fontSize: '0.8125rem', color: colors.onSurface }}>
                  {!imagekitStatus.configured
                    ? 'La subida de imágenes no está configurada (faltan las credenciales de ImageKit). Mientras tanto, puedes pegar la URL de una imagen.'
                    : editing
                      ? 'Sube tu foto y tu banner. Se guarda un historial con las últimas versiones. Pulsa Guardar al terminar.'
                      : 'Sube tu foto y tu banner. Se guarda un historial con las últimas versiones.'}
                </Typography>
                {!editing && (
                  <Button variant="outlined" size="small" startIcon={<Edit />} onClick={startEditing}>
                    Editar perfil
                  </Button>
                )}
              </Box>

              <Grid container spacing={2}>
                {[
                  {
                    key: 'profileImage',
                    type: 'profile',
                    title: 'Foto de perfil',
                    icon: PhotoCamera,
                    current: formData.profileImage || userProfile.profileImage,
                    onUpdate: handleProfileImageUpdate,
                    urlLabel: 'URL de la foto',
                    urlHelp: 'Una imagen cuadrada se ve mejor',
                  },
                  {
                    key: 'bannerImage',
                    type: 'banner',
                    title: 'Banner',
                    icon: Wallpaper,
                    current: formData.bannerImage || userProfile.bannerImage,
                    onUpdate: handleBannerImageUpdate,
                    urlLabel: 'URL del banner',
                    urlHelp: 'Recomendado: 1200 × 300 px',
                  },
                ].map(({ key, type, title, icon: Icon, current, onUpdate, urlLabel, urlHelp }) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Panel
                      title={
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <Icon aria-hidden="true" sx={{ fontSize: 18, color: colors.outline }} />
                          {title}
                        </Box>
                      }
                    >
                      {imagekitStatus.configured ? (
                        <ImageUploader
                          userId={userProfile?.uid}
                          imageType={type}
                          currentImage={current}
                          onImageUpdate={onUpdate}
                          disabled={!editing}
                          showHistory={true}
                          maxWidth={400}
                          maxHeight={150}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          label={urlLabel}
                          value={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          disabled={!editing}
                          placeholder="https://…"
                          helperText={urlHelp}
                        />
                      )}
                    </Panel>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>

        {/* Tu trabajo */}
        <Grid item xs={12} md={4}>
          <Panel title="Tu trabajo" sx={{ mb: 2 }}>
            <Box component="dl" sx={{ m: 0 }}>
              {stat('Asignaciones', userStats.assignmentsTotal)}
              {stat('Activas', userStats.assignmentsActive)}
              {stat('Terminadas', userStats.assignmentsCompleted)}
            </Box>
            {userStats.assignmentsTotal > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant }}>Terminado</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>{completion} %</Typography>
                </Box>
                <MeterBar value={userStats.assignmentsCompleted} max={userStats.assignmentsTotal} color={colors.goodNews} />
              </Box>
            )}
          </Panel>

          <Panel title="Recientes">
            {recentAssignments.length === 0 ? (
              <EmptyState icon={AssignmentIcon} title="Sin asignaciones todavía">
                Cuando te asignen un capítulo, aparecerá aquí.
              </EmptyState>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {recentAssignments.map((assignment) => {
                  // 'typesetting' es el nombre antiguo de 'type'
                  const tasks = (assignment.tasks?.length ? assignment.tasks : [assignment.type]).map((t) => (t === 'typesetting' ? 'type' : t));
                  return (
                    <Box
                      component="li"
                      key={assignment.id}
                      sx={{ py: 1, '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` } }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.onSurface, minWidth: 0 }}>
                          {assignment.mangaTitle || getMangaTitle(assignment.mangaId)}
                        </Typography>
                        <Box component="span" sx={{ flexShrink: 0, fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                          Cap. {assignment.chapter}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
                        <Box sx={{ fontSize: '0.75rem' }}>
                          {tasks.length > 1 ? (
                            <Box component="span" sx={{ color: colors.onSurfaceVariant }}>{tasks.length} tareas</Box>
                          ) : (
                            <TaskTypeTag type={tasks[0]} />
                          )}
                        </Box>
                        <StatusBadge status={assignment.status} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Panel>
        </Grid>
      </Grid>

      {/* Footer del sistema */}
      <Box sx={{ mt: 3 }}>
        <SystemFooter size="medium" />
      </Box>
    </Box>
  );
};

export default Profile;
