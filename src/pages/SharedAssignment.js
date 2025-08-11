import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Book,
  Assignment,
  Translate,
  Edit,
  Save,
  Refresh,
  CheckCircle,
  Schedule,
  Share,
  Link as LinkIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { realtimeService } from '../services/realtimeService';
import toast from 'react-hot-toast';

const SharedAssignment = () => {
  const { shareableId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [comments, setComments] = useState('');

  useEffect(() => {
    if (!shareableId) {
      setError('ID de asignación inválido');
      setLoading(false);
      return;
    }

    // Suscribirse a cambios en tiempo real
    const unsubscribe = realtimeService.subscribeToSharedAssignment(
      shareableId,
      (assignmentData) => {
        if (assignmentData) {
          setAssignment(assignmentData);
          setNewProgress(assignmentData.progress || 0);
          setComments(assignmentData.comments || '');
          setError('');
        } else {
          setError('Asignación no encontrada');
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [shareableId]);

  const handleUpdateProgress = async () => {
    if (newProgress < 0 || newProgress > 100) {
      toast.error('El progreso debe estar entre 0 y 100');
      return;
    }

    setUpdating(true);
    try {
      await realtimeService.updateSharedAssignmentProgress(
        shareableId,
        newProgress,
        comments
      );
      toast.success('Progreso actualizado exitosamente');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Error al actualizar el progreso');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyLink = () => {
    const link = realtimeService.generateShareableLink(shareableId);
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado al portapapeles');
    }).catch(() => {
      toast.error('Error al copiar el link');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completado':
        return 'success';
      case 'en_progreso':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado':
        return <CheckCircle color="success" />;
      case 'en_progreso':
        return <Schedule color="warning" />;
      default:
        return <Assignment color="action" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completado':
        return 'Completado';
      case 'en_progreso':
        return 'En Progreso';
      default:
        return 'Pendiente';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Cargando asignación...</Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="h6" gutterBottom>
              Asignación no encontrada
            </Typography>
            <Typography color="textSecondary">
              El link puede estar expirado o ser inválido.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Book sx={{ fontSize: 32, color: '#1976d2' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                WhitePearl Translations
              </Typography>
            </Box>
            <Tooltip title="Copiar link">
              <IconButton onClick={handleCopyLink} color="primary">
                <LinkIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="subtitle1" color="textSecondary">
            Asignación Compartida
          </Typography>
        </Paper>

        {/* Información de la Asignación */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {assignment.mangaTitle}
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Capítulo {assignment.chapter}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  icon={assignment.type === 'traduccion' ? <Translate /> : <Edit />}
                  label={assignment.type === 'traduccion' ? 'Traducción' : 'Edición'}
                  color={assignment.type === 'traduccion' ? 'primary' : 'secondary'}
                />
                <Chip
                  icon={getStatusIcon(assignment.status)}
                  label={getStatusText(assignment.status)}
                  color={getStatusColor(assignment.status)}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Asignado a: {assignment.assignedToName || 'No asignado'}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="textSecondary">
                Prioridad
              </Typography>
              <Chip
                label={assignment.priority === 'alta' ? 'Alta' :
                       assignment.priority === 'media' ? 'Media' : 'Normal'}
                color={assignment.priority === 'alta' ? 'error' :
                       assignment.priority === 'media' ? 'warning' : 'default'}
                size="small"
              />
            </Box>
          </Box>

          {assignment.dueDate && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Fecha límite: {new Date(assignment.dueDate).toLocaleDateString()}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Progreso Actual */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Progreso Actual
              </Typography>
              <Typography variant="h6" color="primary">
                {assignment.progress || 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={assignment.progress || 0}
              color={getProgressColor(assignment.progress || 0)}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          {assignment.comments && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Comentarios actuales:
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 2,
                fontStyle: 'italic'
              }}>
                "{assignment.comments}"
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Actualizar Progreso */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Actualizar Progreso
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Nuevo progreso (%)"
              type="number"
              value={newProgress}
              onChange={(e) => setNewProgress(Number(e.target.value))}
              InputProps={{
                inputProps: { min: 0, max: 100 }
              }}
              helperText="Ingresa un valor entre 0 y 100"
              fullWidth
            />

            <TextField
              label="Comentarios (opcional)"
              multiline
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Agrega comentarios sobre el progreso o cualquier información relevante..."
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setNewProgress(assignment.progress || 0);
                  setComments(assignment.comments || '');
                }}
                startIcon={<Refresh />}
              >
                Restablecer
              </Button>
              <Button
                variant="contained"
                onClick={handleUpdateProgress}
                disabled={updating || newProgress === (assignment.progress || 0)}
                startIcon={updating ? <CircularProgress size={20} /> : <Save />}
                sx={{
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                  }
                }}
              >
                {updating ? 'Actualizando...' : 'Actualizar Progreso'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Sistema de Asignaciones • WhitePearl Translations
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SharedAssignment;
