/**
 * Análisis de Proceso Page - Modern Design
 * Documentación del análisis del proceso según análisis Excel
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  AccountTree as AccountTreeIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../../utils/constants';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';

export default function AnalisisProcesoPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [descripcion, setDescripcion] = useState('');
  const [savedCaracterizacion, setSavedCaracterizacion] = useState<{ name: string; url: string; date: string } | null>(null);
  const [savedFlujoGrama, setSavedFlujoGrama] = useState<{ name: string; url: string; date: string } | null>(null);

  const [initialDescripcion, setInitialDescripcion] = useState('');
  const [initialSavedCaracterizacion, setInitialSavedCaracterizacion] = useState<{ name: string; url: string; date: string } | null>(null);
  const [initialSavedFlujoGrama, setInitialSavedFlujoGrama] = useState<{ name: string; url: string; date: string } | null>(null);

  useEffect(() => {
    if (procesoData) {
      const desc = procesoData.analisis || '';
      setDescripcion(desc);
      setInitialDescripcion(desc);
      // Caracterización: usar nuevo campo o, si no existe, archivo antiguo (documentoUrl) para no perderlo
      if (procesoData.documentoCaracterizacionUrl) {
        const f = { name: procesoData.documentoCaracterizacionNombre || 'Caracterización', url: procesoData.documentoCaracterizacionUrl, date: new Date().toISOString() };
        setSavedCaracterizacion(f);
        setInitialSavedCaracterizacion(f);
      } else if (procesoData.documentoUrl) {
        const f = { name: procesoData.documentoNombre || 'Documento (caracterización)', url: procesoData.documentoUrl, date: new Date().toISOString() };
        setSavedCaracterizacion(f);
        setInitialSavedCaracterizacion(f);
      } else {
        setSavedCaracterizacion(null);
        setInitialSavedCaracterizacion(null);
      }
      if (procesoData.documentoFlujoGramaUrl) {
        const f = { name: procesoData.documentoFlujoGramaNombre || 'Flujo grama', url: procesoData.documentoFlujoGramaUrl, date: new Date().toISOString() };
        setSavedFlujoGrama(f);
        setInitialSavedFlujoGrama(f);
      } else {
        setSavedFlujoGrama(null);
        setInitialSavedFlujoGrama(null);
      }
    }
  }, [procesoData]);

  const [selectedCaracterizacion, setSelectedCaracterizacion] = useState<File | null>(null);
  const [selectedFlujoGrama, setSelectedFlujoGrama] = useState<File | null>(null);
  const [uploadTarget, setUploadTarget] = useState<'caracterizacion' | 'flujoGrama' | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  // Detectar cambios en descripción
  const hasDescripcionChanges = useFormChanges(initialDescripcion, descripcion);
  
  const hasFileChanges =
    selectedCaracterizacion !== null ||
    selectedFlujoGrama !== null ||
    JSON.stringify(initialSavedCaracterizacion) !== JSON.stringify(savedCaracterizacion) ||
    JSON.stringify(initialSavedFlujoGrama) !== JSON.stringify(savedFlujoGrama);

  const hasAnyChanges = hasDescripcionChanges || hasFileChanges;

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasAnyChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en el análisis de proceso.',
    disabled: isReadOnly,
  });

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<'caracterizacion' | 'flujoGrama' | null>(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState<'caracterizacion' | 'flujoGrama' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const acceptedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

  const setFileIfValid = (file: File, target: 'caracterizacion' | 'flujoGrama') => {
    if (file.size > MAX_FILE_SIZE) {
      showError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }
    if (!acceptedMimeTypes.includes(file.type)) {
      showError('Formato no permitido. Use PDF, PNG, JPG o DOCX.');
      return;
    }
    if (target === 'caracterizacion') setSelectedCaracterizacion(file);
    else setSelectedFlujoGrama(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && uploadTarget) {
      setFileIfValid(file, uploadTarget);
      setUploadTarget(null);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent, target: 'caracterizacion' | 'flujoGrama') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setDragOver(target);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, target: 'caracterizacion' | 'flujoGrama') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) setFileIfValid(file, target);
  };

  const handleRequestDelete = (type: 'caracterizacion' | 'flujoGrama') => {
    setFileToDelete(type);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !procesoSeleccionado?.id) {
      setDeleteConfirmationOpen(false);
      setFileToDelete(null);
      setDeleteModalLoading(false);
      return;
    }
    setDeleteModalLoading(true);
    try {
      const isCaracterizacion = fileToDelete === 'caracterizacion';
      const saved = isCaracterizacion ? savedCaracterizacion : savedFlujoGrama;
      const selected = isCaracterizacion ? selectedCaracterizacion : selectedFlujoGrama;
      if (selected) {
        if (isCaracterizacion) setSelectedCaracterizacion(null);
        else setSelectedFlujoGrama(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else if (saved) {
        const deleteUrl = `${API_BASE_URL}/upload/archivo/by-url?url=${encodeURIComponent(saved.url)}`;
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(deleteUrl, {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok || res.status === 404) {
          const payload: any = { id: String(procesoSeleccionado.id), analisis: descripcion };
          if (isCaracterizacion) {
            payload.documentoCaracterizacionUrl = null;
            payload.documentoCaracterizacionNombre = null;
            setSavedCaracterizacion(null);
            setInitialSavedCaracterizacion(null);
          } else {
            payload.documentoFlujoGramaUrl = null;
            payload.documentoFlujoGramaNombre = null;
            setSavedFlujoGrama(null);
            setInitialSavedFlujoGrama(null);
          }
          await updateProceso(payload).unwrap();
          showSuccess('Archivo eliminado');
        } else {
          const data = await res.json().catch(() => ({}));
          showError(data?.error || 'Error al eliminar el archivo');
        }
      }
      setDeleteConfirmationOpen(false);
      setFileToDelete(null);
    } catch (e) {
      showError('Error al eliminar el archivo');
    } finally {
      setDeleteModalLoading(false);
    }
  };

  const handleSave = async () => {
    if (!procesoSeleccionado?.id) {
      showError('Debe seleccionar un proceso');
      return;
    }
    setSaving(true);
    try {
      let docCarUrl: string | null = savedCaracterizacion?.url ?? null;
      let docCarNombre: string | null = savedCaracterizacion?.name ?? null;
      let docFlujoUrl: string | null = savedFlujoGrama?.url ?? null;
      let docFlujoNombre: string | null = savedFlujoGrama?.name ?? null;

      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      const uploadOne = async (file: File): Promise<{ url: string; nombre: string }> => {
        const formData = new FormData();
        formData.append('archivo', file);
        const res = await fetch(`${API_BASE_URL}/upload/archivo`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || 'Error al subir el archivo');
        }
        const data = await res.json();
        return { url: data.url, nombre: data.nombre ?? file.name };
      };

      if (selectedCaracterizacion) {
        const u = await uploadOne(selectedCaracterizacion);
        docCarUrl = u.url;
        docCarNombre = u.nombre;
      }
      if (selectedFlujoGrama) {
        const u = await uploadOne(selectedFlujoGrama);
        docFlujoUrl = u.url;
        docFlujoNombre = u.nombre;
      }

      const payload: Record<string, unknown> = {
        id: String(procesoSeleccionado.id),
        analisis: descripcion,
        documentoCaracterizacionUrl: docCarUrl,
        documentoCaracterizacionNombre: docCarNombre,
        documentoFlujoGramaUrl: docFlujoUrl,
        documentoFlujoGramaNombre: docFlujoNombre,
      };
      // Si el proceso tenía archivo en el campo antiguo (documentoUrl) y ahora está en Caracterización, limpiar campos viejos
      if (procesoData?.documentoUrl && !procesoData?.documentoCaracterizacionUrl) {
        payload.documentoUrl = null;
        payload.documentoNombre = null;
      }
      await updateProceso(payload as any).unwrap();

      if (docCarUrl && docCarNombre) {
        const f = { name: docCarNombre, url: docCarUrl, date: new Date().toISOString() };
        setSavedCaracterizacion(f);
        setInitialSavedCaracterizacion(f);
      }
      if (docFlujoUrl && docFlujoNombre) {
        const f = { name: docFlujoNombre, url: docFlujoUrl, date: new Date().toISOString() };
        setSavedFlujoGrama(f);
        setInitialSavedFlujoGrama(f);
      }
      setSelectedCaracterizacion(null);
      setSelectedFlujoGrama(null);
      setInitialDescripcion(descripcion);
      markAsSaved();
      showSuccess('Análisis de proceso y documentación guardados exitosamente');
    } catch (error: any) {
      showError(error?.message || 'Error al guardar el análisis');
    } finally {
      setSaving(false);
    }
  };

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!saving) {
      forceNavigate();
    }
  };

  const handleDiscardChanges = () => {
    setDescripcion(initialDescripcion);
    setSavedCaracterizacion(initialSavedCaracterizacion);
    setSavedFlujoGrama(initialSavedFlujoGrama);
    setSelectedCaracterizacion(null);
    setSelectedFlujoGrama(null);
    forceNavigate();
  };

  const handlePreview = (url: string, name: string) => {
    const isPdf = name.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(name);
    const u = (url || '').trim();
    if (!u.startsWith('http')) {
      showError('URL del archivo no válida');
      return;
    }
    const urlSinCache = `${u}#_t=${Date.now()}`;

    if (isPdf) {
      setPreviewType('pdf');
      setPreviewUrl(urlSinCache);
      setPreviewOpen(true);
    } else if (isImage) {
      setPreviewType('image');
      setPreviewUrl(urlSinCache);
      setPreviewOpen(true);
    }
  };

  const handleUploadClick = (target: 'caracterizacion' | 'flujoGrama') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const instrucciones = [
    {
      titulo: 'Diagramas de proceso',
      descripcion: 'Son gráficos que muestran paso a paso cómo se realiza un proceso, indicando las actividades, el orden en que se hacen y las decisiones que se toman.'
    },
    {
      titulo: 'Descripción de actividades',
      descripcion: 'Es la explicación detallada de las tareas que se realizan en un proceso, indicando qué se hace, cómo se hace y quién es responsable.'
    },
    {
      titulo: 'Flujos de trabajo',
      descripcion: 'Es la secuencia de tareas que se siguen para completar un proceso, mostrando cómo avanza el trabajo desde el inicio hasta el final.'
    },
    {
      titulo: 'Interacciones entre áreas',
      descripcion: 'Son las formas en que diferentes áreas de la empresa se comunican y colaboran para cumplir con un proceso o actividad.'
    },
    {
      titulo: 'Puntos de control',
      descripcion: 'Son momentos dentro de un proceso donde se revisa o verifica que las actividades se estén realizando correctamente y cumpliendo con lo establecido.'
    },
    {
      titulo: 'Indicadores de desempeño',
      descripcion: 'Son medidas que permiten evaluar qué tan bien se está realizando un proceso o actividad, ayudando a identificar mejoras o problemas.'
    },
  ];

  if (isLoadingProceso) {
    return (
      <AppPageLayout
        title="Análisis de Proceso"
        description="Documentación del análisis del proceso mediante diagramas y descripciones"
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout
        title="Análisis de Proceso"
        description="Documentación del análisis del proceso mediante diagramas y descripciones"
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined">No hay un proceso seleccionado. Por favor seleccione un proceso de la lista en la parte superior para cargar su análisis.</Alert>
        </Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={saving}
        message="Tiene cambios sin guardar en el análisis de proceso."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Análisis de Proceso"
      description="Documentación del análisis del proceso mediante diagramas y descripciones"
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                background: '#1976d2',
                color: '#fff',
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar Análisis'}
            </Button>
          )}
        </Box>
      }
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Está en modo visualización. Solo puede ver la información.
          </Alert>
        )
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Instructions Card */}
        <Box>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: (theme) => theme.palette.background.paper,
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccountTreeIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Instrucciones
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" paragraph color="text.secondary">
                En esta sección debe documentar el análisis detallado del proceso, incluyendo:
              </Typography>
              <List dense>
                {instrucciones.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          background: '#1976d2',
                          color: '#fff',
                          fontWeight: 600,
                          width: 24,
                          height: 24,
                          fontSize: '0.75rem',
                        }}
                      />
                    </ListItemIcon>
                    <Tooltip title={item.descripcion} arrow placement="right">
                      <ListItemText
                        primary={item.titulo}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontSize: '0.875rem',
                          sx: { cursor: 'help' },
                        }}
                      />
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Main Editor Card */}
        <Box>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                background: (theme) => theme.palette.background.paper,
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DescriptionIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Documentación del Proceso
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Descripción del Proceso"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={isReadOnly}
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder="Describa el proceso de Talento Humano, sus actividades principales, flujos de trabajo, interacciones con otras áreas, puntos de control, etc."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* 1. Flujograma (primer apartado: lo ya subido se muestra aquí) */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Flujograma</Typography>
                  <Paper
                    elevation={0}
                    onDragOver={(e) => handleDragOver(e, 'flujoGrama')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'flujoGrama')}
                    sx={{
                      p: 2.5,
                      backgroundColor: dragOver === 'flujoGrama' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255, 165, 0, 0.05)',
                      border: '2px dashed',
                      borderColor: dragOver === 'flujoGrama' ? 'primary.main' : '#FFA500',
                      borderRadius: 2,
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <TimelineIcon sx={{ color: '#FFA500', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          PDF, PNG, JPG, DOCX. Máx. 5MB.
                        </Typography>
                        {savedFlujoGrama && (
                          <Box sx={{ mt: 1, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon color="primary" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>{savedFlujoGrama.name}</Typography>
                                <Chip label="Guardado" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreview(savedFlujoGrama.url, savedFlujoGrama.name)}>Ver</Button>
                              {!isReadOnly && (
                                <IconButton size="small" color="error" onClick={() => handleRequestDelete('flujoGrama')} title="Eliminar"><DeleteIcon fontSize="small" /></IconButton>
                              )}
                            </Box>
                          </Box>
                        )}
                        {selectedFlujoGrama && (
                          <Box sx={{ mt: 1, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <UploadIcon color="warning" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>{selectedFlujoGrama.name} ({(selectedFlujoGrama.size / 1024).toFixed(1)} KB)</Typography>
                                <Chip label="Por subir" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreview(URL.createObjectURL(selectedFlujoGrama), selectedFlujoGrama.name)}>Ver</Button>
                              <IconButton size="small" color="error" onClick={() => handleRequestDelete('flujoGrama')} title="Quitar"><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        )}
                        {!isReadOnly && (
                          <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleUploadClick('flujoGrama')} sx={{ mt: 1 }}>Subir flujograma</Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {/* 2. Caracterización (segundo apartado, debajo) */}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Caracterización</Typography>
                  <Paper
                    elevation={0}
                    onDragOver={(e) => handleDragOver(e, 'caracterizacion')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'caracterizacion')}
                    sx={{
                      p: 2.5,
                      backgroundColor: dragOver === 'caracterizacion' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255, 165, 0, 0.05)',
                      border: '2px dashed',
                      borderColor: dragOver === 'caracterizacion' ? 'primary.main' : '#FFA500',
                      borderRadius: 2,
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <SettingsIcon sx={{ color: '#FFA500', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          PDF, PNG, JPG, DOCX. Máx. 5MB.
                        </Typography>
                        {savedCaracterizacion && (
                          <Box sx={{ mt: 1, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon color="primary" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>{savedCaracterizacion.name}</Typography>
                                <Chip label="Guardado" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreview(savedCaracterizacion.url, savedCaracterizacion.name)}>Ver</Button>
                              {!isReadOnly && (
                                <IconButton size="small" color="error" onClick={() => handleRequestDelete('caracterizacion')} title="Eliminar"><DeleteIcon fontSize="small" /></IconButton>
                              )}
                            </Box>
                          </Box>
                        )}
                        {selectedCaracterizacion && (
                          <Box sx={{ mt: 1, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <UploadIcon color="warning" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={600}>{selectedCaracterizacion.name} ({(selectedCaracterizacion.size / 1024).toFixed(1)} KB)</Typography>
                                <Chip label="Por subir" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreview(URL.createObjectURL(selectedCaracterizacion), selectedCaracterizacion.name)}>Ver</Button>
                              <IconButton size="small" color="error" onClick={() => handleRequestDelete('caracterizacion')} title="Quitar"><DeleteIcon fontSize="small" /></IconButton>
                            </Box>
                          </Box>
                        )}
                        {!isReadOnly && (
                          <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleUploadClick('caracterizacion')} sx={{ mt: 1 }}>Subir caracterización</Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />

                {!isReadOnly && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          background: '#1976d2',
                          '&:hover': {
                            background: '#1565c0',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {saving ? 'Guardando…' : 'Guardar Análisis'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Preview Modal - En móvil los PDF se abren en nueva pestaña para evitar errores de iframe */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '90vh',
            maxHeight: isMobile ? '100%' : '90vh',
            maxWidth: isMobile ? '100%' : 900,
            borderRadius: isMobile ? 0 : 2,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Vista Previa del Archivo
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          {previewUrl && (
            <>
              {previewType === 'image' && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    padding: '20px'
                  }}
                />
              )}
              {previewType === 'pdf' && isMobile && (
                <Box sx={{ p: 3, textAlign: 'center', maxWidth: 360 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    En el celular el PDF no se puede mostrar aquí. Ábrelo en una nueva pestaña para verlo correctamente.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                    sx={{ textTransform: 'none' }}
                  >
                    Abrir documento en nueva pestaña
                  </Button>
                </Box>
              )}
              {previewType === 'pdf' && !isMobile && (
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="100%"
                  title="PDF Preview"
                  style={{ border: 'none' }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      </AppPageLayout>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => !deleteModalLoading && setDeleteConfirmationOpen(false)}
        disableEscapeKeyDown={deleteModalLoading}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          {deleteModalLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 3 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Eliminando…</Typography>
            </Box>
          ) : (
            <Typography>
              ¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.
            </Typography>
          )}
        </DialogContent>
        {!deleteModalLoading && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setDeleteConfirmationOpen(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </Box>
        )}
      </Dialog>
    </>
  );
}
