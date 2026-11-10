import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  TextField,
  MenuItem,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  VisibilityOutlined as ViewIcon,
  FileDownloadOutlined as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  SearchRounded as SearchIcon,
  HistoryRounded as HistoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContextSimple';
import { Panel, EmptyState } from './ui';
import PressIconButton from './motion/PressIconButton';
import { colors, radius, rowDivider } from '../theme/tokens';

const formatDateTime = (value) =>
  new Date(value).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const mutedButtonSx = { color: colors.onSurfaceVariant };

const UploadReportsPanel = () => {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    uploaderFilter: 'all',
    dateFrom: null,
    dateTo: null,
    searchTerm: ''
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  // Cargar reportes de la base de datos
  const loadReports = async () => {
    try {
      setLoading(true);

      // Usar el nuevo método que respeta las reglas de seguridad
      const reportsData = await realtimeService.getUploadReports(
        userProfile?.role,
        userProfile?.uid
      );

      if (reportsData) {
        const reportsList = Object.values(reportsData).sort((a, b) =>
          new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        setReports(reportsList);
      } else {
        setReports([]);
      }
    } catch (error) {
      //  message removed for production
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...reports];

    // Filtro por uploader
    if (filters.uploaderFilter !== 'all') {
      if (filters.uploaderFilter === 'me') {
        filtered = filtered.filter(report => report.uploaderId === userProfile?.uid);
      } else {
        filtered = filtered.filter(report => report.uploaderId === filters.uploaderFilter);
      }
    }

    // Filtro por fecha
    if (filters.dateFrom) {
      filtered = filtered.filter(report =>
        new Date(report.uploadDate) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(report =>
        new Date(report.uploadDate) <= new Date(filters.dateTo)
      );
    }

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        (report.chapters || []).some(chapter =>
          (chapter.mangaTitle || '').toLowerCase().includes(term)
        ) ||
        (report.uploaderName || '').toLowerCase().includes(term)
      );
    }

    setFilteredReports(filtered);
  };

  // Ver detalles del reporte
  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  // Exportar reporte a CSV
  const exportReportToCSV = (report) => {
    const csvContent = [
      ['Reporte de Upload - ' + report.uploaderName],
      ['Fecha:', new Date(report.uploadDate).toLocaleString()],
      ['Total Capítulos:', report.totalChapters],
      [''],
      ['Serie', 'Capítulo', 'Link Drive'],
      ...report.chapters.map(chapter => [
        chapter.mangaTitle,
        chapter.chapter,
        chapter.driveLink
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `upload_report_${report.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtener uploaders únicos para el filtro
  const getUniqueUploaders = () => {
    const uploaders = new Map();
    reports.forEach(report => {
      if (!uploaders.has(report.uploaderId)) {
        uploaders.set(report.uploaderId, report.uploaderName);
      }
    });
    return Array.from(uploaders.entries());
  };

  // Estadísticas rápidas
  const getQuickStats = () => {
    const totalReports = filteredReports.length;
    const totalChapters = filteredReports.reduce((sum, report) => sum + (report.totalChapters || 0), 0);

    // Contar capítulos únicos por serie (evitar duplicados entre reportes)
    const uniqueChapters = new Set();
    filteredReports.forEach(report => {
      (report.chapters || []).forEach(chapter => {
        uniqueChapters.add(`${chapter.mangaTitle}-${chapter.chapter}`);
      });
    });

    const uniqueUploaders = new Set(filteredReports.map(r => r.uploaderId)).size;

    return { totalReports, totalChapters, uniqueChapters: uniqueChapters.size, uniqueUploaders };
  };

  const stats = getQuickStats();
  const hasFilters = filters.uploaderFilter !== 'all' || filters.dateFrom || filters.dateTo || filters.searchTerm;
  const GRID = '170px minmax(0, 1.2fr) 90px minmax(0, 2fr) 84px';

  const summary = [
    `${stats.totalReports} ${stats.totalReports === 1 ? 'subida' : 'subidas'}`,
    `${stats.totalChapters} capítulos${stats.uniqueChapters !== stats.totalChapters ? ` (${stats.uniqueChapters} distintos)` : ''}`,
    `${stats.uniqueUploaders} ${stats.uniqueUploaders === 1 ? 'persona' : 'personas'}`,
  ].join(' · ');

  return (
    <Box>
      <Panel
        title="Historial"
        count={filteredReports.length}
        action={
          <Tooltip title="Volver a cargar">
            <span>
              <PressIconButton onClick={loadReports} disabled={loading} aria-label="Volver a cargar el historial">
                <RefreshIcon sx={{ fontSize: 20 }} />
              </PressIconButton>
            </span>
          </Tooltip>
        }
      >
        <Typography sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, mb: 1.5 }}>
          {loading ? 'Cargando…' : summary}
        </Typography>

        {/* Filtros */}
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            mb: 1.5,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'minmax(0, 1.6fr) minmax(0, 1fr) 170px 170px auto' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            placeholder="Buscar serie o persona"
            inputProps={{ 'aria-label': 'Buscar en el historial' }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: colors.outline, mr: 1, fontSize: 20 }} /> }}
          />
          <TextField
            select
            size="small"
            value={filters.uploaderFilter}
            onChange={(e) => setFilters(prev => ({ ...prev, uploaderFilter: e.target.value }))}
            inputProps={{ 'aria-label': 'Quién subió' }}
          >
            <MenuItem value="all">Todas las personas</MenuItem>
            {userProfile?.uid && <MenuItem value="me">Solo las mías</MenuItem>}
            {getUniqueUploaders().map(([id, name]) => (
              <MenuItem key={id} value={id}>{name}</MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          {hasFilters ? (
            <Button
              size="small"
              onClick={() => setFilters({ uploaderFilter: 'all', dateFrom: null, dateTo: null, searchTerm: '' })}
              sx={{ ...mutedButtonSx, justifySelf: 'start' }}
            >
              Limpiar
            </Button>
          ) : (
            <Box sx={{ display: { xs: 'none', lg: 'block' }, width: 72 }} />
          )}
        </Box>

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={28} aria-label="Cargando el historial" />
          </Box>
        ) : filteredReports.length === 0 ? (
          <EmptyState icon={HistoryIcon} title={reports.length === 0 ? 'Todavía no hay subidas' : 'Ninguna subida con estos filtros'}>
            {reports.length === 0
              ? 'Cada vez que termines una subida desde "Por subir", quedará registrada aquí.'
              : 'Prueba con otras fechas o persona, o limpia los filtros.'}
          </EmptyState>
        ) : (
          <Box role="table" aria-label="Historial de subidas" sx={{ mx: -1 }}>
            <Box
              role="row"
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns: GRID,
                gap: 2,
                px: 1,
                pb: 1,
                borderBottom: `1px solid ${rowDivider}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: colors.onSurfaceVariant,
              }}
            >
              <span role="columnheader">Fecha</span>
              <span role="columnheader">Subió</span>
              <span role="columnheader">Capítulos</span>
              <span role="columnheader">Series</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Acciones</span>
            </Box>
            {filteredReports.map((report) => {
              const uniqueSeries = [...new Set((report.chapters || []).map(ch => ch.mangaTitle))];
              const displaySeries = uniqueSeries.slice(0, 2).join(', ');
              const remainingSeries = uniqueSeries.length - 2;
              const uploaderName = report.uploaderName || 'Sin nombre';

              return (
                <Box
                  key={report.id}
                  role="row"
                  sx={{
                    display: { xs: 'flex', md: 'grid' },
                    flexWrap: 'wrap',
                    gridTemplateColumns: GRID,
                    alignItems: 'center',
                    gap: { xs: 1, md: 2 },
                    px: 1,
                    py: 1.25,
                    borderRadius: `${radius.md}px`,
                    transition: 'background-color 150ms ease-out',
                    '&:hover': { backgroundColor: colors.surfaceContainer },
                    '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                  }}
                >
                  <Box role="cell" sx={{ flex: { xs: '1 1 100%', md: 'initial' } }}>
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}>
                      {formatDateTime(report.uploadDate)}
                    </Typography>
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Avatar alt="" sx={{ width: 26, height: 26, fontSize: '0.6875rem', fontWeight: 700 }}>
                      {uploaderName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography noWrap sx={{ fontSize: '0.8125rem', color: colors.onSurface }}>
                      {uploaderName}
                    </Typography>
                  </Box>
                  <Box role="cell">
                    <Typography component="span" sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.onSurface, fontVariantNumeric: 'tabular-nums' }}>
                      {report.totalChapters}
                    </Typography>
                    <Box component="span" sx={{ display: { md: 'none' }, fontSize: '0.8125rem', color: colors.onSurfaceVariant }}> capítulos</Box>
                  </Box>
                  <Box role="cell" sx={{ minWidth: 0, flex: { xs: '1 1 100%', md: 'initial' } }}>
                    <Typography noWrap sx={{ fontSize: '0.8125rem', color: colors.onSurface }}>
                      {displaySeries}
                      {remainingSeries > 0 && (
                        <Box component="span" sx={{ color: colors.onSurfaceVariant }}> y {remainingSeries} más</Box>
                      )}
                    </Typography>
                  </Box>
                  <Box role="cell" sx={{ display: 'flex', gap: 0.25, justifyContent: 'flex-end', ml: { xs: 'auto', md: 0 } }}>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => viewReportDetails(report)} aria-label="Ver detalle de la subida">
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Exportar CSV">
                      <IconButton size="small" onClick={() => exportReportToCSV(report)} aria-label="Exportar la subida a CSV">
                        <DownloadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* Detalle de una subida */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          Detalle de la subida
          <IconButton onClick={() => setReportDialogOpen(false)} aria-label="Cerrar" edge="end">
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedReport && (
            <Box>
              <Box component="dl" sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75, m: 0, mb: 2, fontSize: '0.875rem' }}>
                <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Subió</Box>
                <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{selectedReport.uploaderName}</Box>
                <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Fecha</Box>
                <Box component="dd" sx={{ m: 0, color: colors.onSurface }}>{new Date(selectedReport.uploadDate).toLocaleString('es-ES')}</Box>
                <Box component="dt" sx={{ color: colors.onSurfaceVariant }}>Capítulos</Box>
                <Box component="dd" sx={{ m: 0, color: colors.onSurface, fontVariantNumeric: 'tabular-nums' }}>{selectedReport.totalChapters}</Box>
              </Box>

              <Typography component="h3" variant="subtitle2" sx={{ color: colors.onSurface, mb: 0.5 }}>
                Capítulos subidos
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {(selectedReport.chapters || []).map((chapter, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      py: 1,
                      '&:not(:last-of-type)': { borderBottom: `1px solid ${rowDivider}` },
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', color: colors.onSurface, minWidth: 0 }} noWrap>
                      {chapter.mangaTitle}
                      <Box component="span" sx={{ color: colors.onSurfaceVariant, fontVariantNumeric: 'tabular-nums' }}> · Cap. {chapter.chapter}</Box>
                    </Typography>
                    {chapter.driveLink ? (
                      <Button
                        size="small"
                        component="a"
                        href={chapter.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                        sx={{ ...mutedButtonSx, minHeight: 32, flexShrink: 0 }}
                      >
                        Drive
                      </Button>
                    ) : (
                      <Typography component="span" sx={{ fontSize: '0.8125rem', color: colors.outline, flexShrink: 0 }}>
                        Sin Drive
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button startIcon={<DownloadIcon />} onClick={() => selectedReport && exportReportToCSV(selectedReport)} sx={mutedButtonSx}>
            Exportar CSV
          </Button>
          <Button variant="contained" onClick={() => setReportDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadReportsPanel;
