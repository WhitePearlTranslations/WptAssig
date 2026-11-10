import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, CircularProgress } from '@mui/material';
import {
  CloudUploadOutlined as CloudUploadIcon,
  HistoryRounded as HistoryIcon,
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContextSimple';
import NewUploadsPanel from '../components/NewUploadsPanel';
import UploadReportsPanel from '../components/UploadReportsPanel';
import { PageHeader, Panel, EmptyState } from '../components/ui';
import { ROLE_LABELS } from '../utils/constants';
import { triggerHaptic } from '../hooks/useWebHaptics';

const UPLOAD_TABS = [
  { label: 'Por subir', icon: CloudUploadIcon },
  { label: 'Historial', icon: HistoryIcon },
];

// Componente principal de la página de subidas
const Uploads = () => {
  const { currentUser, userProfile, checkPermission } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [canManageUploads, setCanManageUploads] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effect para verificar permisos
  useEffect(() => {
    const checkUploadsPermission = async () => {
      if (currentUser && userProfile) {
        try {
          const hasPermission = await checkPermission('canManageUploads');
          setCanManageUploads(hasPermission);
        } catch (error) {
          console.error('Error verificando permiso canManageUploads:', error);
          setCanManageUploads(false);
        }
      } else {
        setCanManageUploads(false);
      }
      setIsLoading(false);
    };

    checkUploadsPermission();
  }, [currentUser, userProfile, checkPermission]);

  if (isLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={28} aria-label="Comprobando permisos" />
      </Box>
    );
  }

  if (!canManageUploads) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6 }}>
        <Panel>
          <EmptyState icon={LockOutlinedIcon} title="No tienes acceso a Subidas">
            Hace falta el permiso para gestionar subidas. Pídeselo a la administración.
            {userProfile?.role && ` Tu rol actual es ${ROLE_LABELS[userProfile.role] || userProfile.role}.`}
          </EmptyState>
        </Panel>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Subidas"
        subtitle="Capítulos con todas sus tareas terminadas, listos para maquetar y publicar."
      />

      <Tabs
        value={currentTab}
        onChange={(e, value) => {
          triggerHaptic('light');
          setCurrentTab(value);
        }}
        aria-label="Secciones de subidas"
        sx={{ mb: 2 }}
      >
        {UPLOAD_TABS.map(({ label, icon: Icon }, index) => (
          <Tab
            key={label}
            label={label}
            icon={<Icon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            id={`uploads-tab-${index}`}
            aria-controls={`uploads-tabpanel-${index}`}
          />
        ))}
      </Tabs>

      <Box role="tabpanel" id={`uploads-tabpanel-${currentTab}`} aria-labelledby={`uploads-tab-${currentTab}`}>
        {currentTab === 0 && <NewUploadsPanel />}
        {currentTab === 1 && <UploadReportsPanel />}
      </Box>
    </Box>
  );
};

export default Uploads;
