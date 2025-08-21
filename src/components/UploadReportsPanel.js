import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Link as LinkIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  AutoStories as ChapterIcon,
} from '@mui/icons-material';
import { realtimeService } from '../services/realtimeService';
import { useAuth, ROLES } from '../contexts/AuthContextSimple';

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
      filtered = filtered.filter(report =>
        report.chapters.some(chapter =>
          chapter.mangaTitle.toLowerCase().includes(filters.searchTerm.toLowerCase())
        ) || 
        report.uploaderName.toLowerCase().includes(filters.searchTerm.toLowerCase())
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
    const totalChapters = filteredReports.reduce((sum, report) => sum + report.totalChapters, 0);
    
    // Contar capítulos únicos por serie (evitar duplicados entre reportes)
    const uniqueChapters = new Set();
    filteredReports.forEach(report => {
      report.chapters.forEach(chapter => {
        const chapterKey = `${chapter.mangaTitle}-${chapter.chapter}`;
        uniqueChapters.add(chapterKey);
      });
    });
    
    const uniqueUploaders = new Set(filteredReports.map(r => r.uploaderId)).size;

    return { totalReports, totalChapters, uniqueChapters: uniqueChapters.size, uniqueUploaders };
  };

  const stats = getQuickStats();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
          📊 Reportes de Uploads
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Historial completo de todos los uploads realizados en el sistema.
        </Typography>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReportIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600}>
                {stats.totalReports}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reportes Totales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <UploadIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600}>
                {stats.totalChapters}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capítulos Subidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ChapterIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600}>
                {stats.uniqueChapters}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capítulos Únicos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={600}>
                {stats.uniqueUploaders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uploaders Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ mr: 1 }} />
            Filtros
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Uploader</InputLabel>
                <Select
                  value={filters.uploaderFilter}
                  label="Uploader"
                  onChange={(e) => setFilters(prev => ({ ...prev, uploaderFilter: e.target.value }))}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {userProfile?.uid && <MenuItem value="me">Mis Reportes</MenuItem>}
                  {getUniqueUploaders().map(([id, name]) => (
                    <MenuItem key={id} value={id}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                placeholder="Buscar por serie o uploader..."
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Fecha desde"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Fecha hasta"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de reportes */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Historial de Reportes ({filteredReports.length})
          </Typography>
          
          {loading ? (
            <LinearProgress />
          ) : filteredReports.length === 0 ? (
            <Alert severity="info">
              {reports.length === 0 
                ? 'No hay reportes disponibles.' 
                : 'No se encontraron reportes que coincidan con los filtros aplicados.'
              }
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Uploader</TableCell>
                    <TableCell align="center">Capítulos</TableCell>
                    <TableCell>Series Principales</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.map((report) => {
                    const uniqueSeries = [...new Set(report.chapters.map(ch => ch.mangaTitle))];
                    const displaySeries = uniqueSeries.slice(0, 2);
                    const remainingSeries = uniqueSeries.length - 2;
                    
                    return (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DateIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
                            {new Date(report.uploadDate).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.8rem' }}>
                              {report.uploaderName.charAt(0).toUpperCase()}
                            </Avatar>
                            {report.uploaderName}
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <Chip 
                            label={report.totalChapters} 
                            color="primary" 
                            size="small"
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box>
                            {displaySeries.map((series, index) => (
                              <Typography key={index} variant="body2" noWrap>
                                {series}
                              </Typography>
                            ))}
                            {remainingSeries > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                +{remainingSeries} más
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => viewReportDetails(report)}
                            title="Ver detalles"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => exportReportToCSV(report)}
                            title="Exportar CSV"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles del reporte */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalle del Reporte
            </Typography>
            <IconButton onClick={() => setReportDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedReport && (
            <Box>
              {/* Información general */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Uploader:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedReport.uploaderName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Upload:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(selectedReport.uploadDate).toLocaleString('es-ES')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Capítulos:
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight={600}>
                    {selectedReport.totalChapters}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Lista de capítulos */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Capítulos Subidos
              </Typography>
              
              <List>
                {selectedReport.chapters.map((chapter, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={600}>
                          {chapter.mangaTitle} - Capítulo {chapter.chapter}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Link de Drive disponible
                        </Typography>
                      }
                    />
                    <IconButton
                      onClick={() => window.open(chapter.driveLink, '_blank')}
                      title="Abrir en Drive"
                    >
                      <LinkIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => selectedReport && exportReportToCSV(selectedReport)}
          >
            Exportar CSV
          </Button>
          <Button onClick={() => setReportDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UploadReportsPanel;
