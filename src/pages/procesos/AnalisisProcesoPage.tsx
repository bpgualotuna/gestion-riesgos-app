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

export default function AnalisisProcesoPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [descripcion, setDescripcion] = useState('');
  const [savedFile, setSavedFile] = useState<{ name: string; url: string; date: string } | null>(null);

  // Estados iniciales para detectar cambios
  const [initialDescripcion, setInitialDescripcion] = useState('');
  const [initialSavedFile, setInitialSavedFile] = useState<{ name: string; url: string; date: string } | null>(null);

  useEffect(() => {
    if (procesoData) {
      const desc = procesoData.analisis || '';
      setDescripcion(desc);
      setInitialDescripcion(desc);
      
      if (procesoData.documentoUrl) {
        const file = {
          name: procesoData.documentoNombre || 'Documento adjunto',
          url: procesoData.documentoUrl,
          date: new Date().toISOString()
        };
        setSavedFile(file);
        setInitialSavedFile(file);
      } else {
        setSavedFile(null);
        setInitialSavedFile(null);
      }
    }
  }, [procesoData]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  // Detectar cambios en descripción
  const hasDescripcionChanges = useFormChanges(initialDescripcion, descripcion);
  
  // Detectar cambios en archivo (si hay archivo seleccionado o si el archivo guardado cambió)
  const hasFileChanges = selectedFile !== null || 
    JSON.stringify(initialSavedFile) !== JSON.stringify(savedFile);

  const hasAnyChanges = hasDescripcionChanges || hasFileChanges;

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasAnyChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en el análisis de proceso.',
    disabled: isReadOnly,
  });

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<'selected' | 'saved' | null>(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const acceptedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

  const setFileIfValid = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }
    if (!acceptedMimeTypes.includes(file.type)) {
      showError('Formato no permitido. Use PDF, PNG, JPG o DOCX.');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setFileIfValid(file);
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!savedFile && e.dataTransfer.types.includes('Files')) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (savedFile) {
      showError('Solo se permite un archivo a la vez. Elimine el archivo guardado para subir otro.');
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) setFileIfValid(file);
  };

  const handleRequestDelete = (type: 'selected' | 'saved') => {
    setFileToDelete(type);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteModalLoading(true);
    try {
      if (fileToDelete === 'selected') {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setDeleteConfirmationOpen(false);
        setFileToDelete(null);
        setDeleteModalLoading(false);
        return;
      }
      if (fileToDelete === 'saved' && savedFile && procesoSeleccionado?.id) {
        const deleteUrl = `${API_BASE_URL}/upload/archivo/by-url?url=${encodeURIComponent(savedFile.url)}`;
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(deleteUrl, {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok || res.status === 404) {
          await updateProceso({
            id: procesoSeleccionado.id,
            analisis: descripcion,
            documentoUrl: null,
            documentoNombre: null,
          }).unwrap();
          setSavedFile(null);
          setDeleteConfirmationOpen(false);
          setFileToDelete(null);
          showSuccess('Archivo eliminado');
        } else {
          const data = await res.json().catch(() => ({}));
          showError(data?.error || 'Error al eliminar el archivo');
        }
      }
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
      let documentoUrl: string | null = savedFile ? savedFile.url : null;
      let documentoNombre: string | null = savedFile ? savedFile.name : null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('archivo', selectedFile);
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const uploadRes = await fetch(`${API_BASE_URL}/upload/archivo`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          showError(err?.error || 'Error al subir el archivo');
          setSaving(false);
          return;
        }
        const uploadData = await uploadRes.json();
        documentoUrl = uploadData.url;
        documentoNombre = uploadData.nombre ?? selectedFile.name;
      }

      await updateProceso({
        id: procesoSeleccionado.id,
        analisis: descripcion,
        documentoUrl,
        documentoNombre,
      }).unwrap();

      if (documentoUrl && documentoNombre) {
        const newFile = { name: documentoNombre, url: documentoUrl, date: new Date().toISOString() };
        setSavedFile(newFile);
        setInitialSavedFile(newFile);
      } else {
        setSavedFile(null);
        setInitialSavedFile(null);
      }
      
      setSelectedFile(null);
      setInitialDescripcion(descripcion);
      markAsSaved();
      showSuccess('Análisis de proceso y documentación guardados exitosamente');
    } catch (error) {
      showError('Error al guardar el análisis');
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
    setSavedFile(initialSavedFile);
    setSelectedFile(null);
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

  const handleUploadClick = () => {
    if (savedFile || selectedFile) {
      alert('Solo se permite subir un único archivo. Por favor, elimine el archivo actual (guardado o seleccionado) antes de subir uno nuevo.');
      return;
    }
    fileInputRef.current?.click();
  };

  const instrucciones = [
    'Diagramas de proceso',
    'Descripción de actividades',
    'Flujos de trabajo',
    'Interacciones entre áreas',
    'Puntos de control',
    'Indicadores de desempeño',
  ];

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout
        title="Análisis de Proceso"
        description="Documentación del análisis del proceso mediante diagramas y descripciones"
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info">Por favor selecciona un proceso.</Alert>
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
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontSize: '0.875rem',
                      }}
                    />
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

                <Box>
                  <Paper
                    elevation={0}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                      p: 2.5,
                      backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255, 165, 0, 0.05)',
                      border: '2px dashed',
                      borderColor: dragOver ? 'primary.main' : '#FFA500',
                      borderRadius: 2,
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <SettingsIcon sx={{ color: '#FFA500', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Archivos Adjuntos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Arrastre un archivo aquí desde el escritorio o use el botón para seleccionar. PDF, PNG, JPG, DOCX. Máx. 5MB. Un archivo a la vez.
                        </Typography>

                        {/* Saved File Display */}
                        {savedFile && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon color="primary" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {savedFile.name}
                                </Typography>
                                <Chip label="Guardado" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Box>
                                <Button
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handlePreview(savedFile.url, savedFile.name)}
                                  sx={{ mr: 1 }}
                                >
                                  Ver
                                </Button>
                                {!isReadOnly && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRequestDelete('saved')}
                                    title="Eliminar archivo"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {/* Selected File Display */}
                        {selectedFile && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <UploadIcon color="warning" />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </Typography>
                                <Chip label="Por subir" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                              </Box>
                              <Box>
                                <Button
                                  size="small"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => handlePreview(URL.createObjectURL(selectedFile), selectedFile.name)}
                                  sx={{ mr: 1 }}
                                >
                                  Ver
                                </Button>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRequestDelete('selected')}
                                  title="Quitar archivo"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        )}

                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {!isReadOnly && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={handleUploadClick}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          borderColor: '#C8D900',
                          color: '#C8D900',
                          '&:hover': {
                            borderColor: '#B8C800',
                            backgroundColor: 'rgba(200, 217, 0, 0.08)',
                          },
                        }}
                      >
                        Adjuntar Archivos
                      </Button>
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
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '90vh',
            maxHeight: isMobile ? '100%' : '90vh',
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
