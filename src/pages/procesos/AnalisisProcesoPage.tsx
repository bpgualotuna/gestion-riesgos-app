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
} from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useGetProcesoByIdQuery, useUpdateProcesoMutation } from '../../api/services/riesgosApi';

export default function AnalisisProcesoPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useGetProcesoByIdQuery(procesoSeleccionado?.id || '', {
    skip: !procesoSeleccionado?.id
  });
  const [updateProceso] = useUpdateProcesoMutation();

  const [descripcion, setDescripcion] = useState('');
  const [savedFile, setSavedFile] = useState<{ name: string; url: string; date: string } | null>(null);

  useEffect(() => {
    if (procesoData) {
      setDescripcion(procesoData.analisis || '');
      if (procesoData.documentoUrl) {
        setSavedFile({
          name: procesoData.documentoNombre || 'Documento adjunto',
          url: procesoData.documentoUrl,
          date: new Date().toISOString()
        });
      }
    }
  }, [procesoData]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<'selected' | 'saved' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRequestDelete = (type: 'selected' | 'saved') => {
    setFileToDelete(type);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete === 'selected') {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (fileToDelete === 'saved') {
      setSavedFile(null);
    }
    setDeleteConfirmationOpen(false);
    setFileToDelete(null);
  };

  const handleSave = async () => {
    if (!procesoSeleccionado?.id) {
      showError('Debe seleccionar un proceso');
      return;
    }

    try {
      // Mocking file upload for now, just saving current state
      await updateProceso({
        id: procesoSeleccionado.id,
        analisis: descripcion,
        documentoUrl: selectedFile ? URL.createObjectURL(selectedFile) : (savedFile ? savedFile.url : null),
        documentoNombre: selectedFile ? selectedFile.name : (savedFile ? savedFile.name : null)
      }).unwrap();

      setSelectedFile(null);
      showSuccess('Análisis de proceso y documentación guardados exitosamente');
    } catch (error) {
      showError('Error al guardar el análisis');
    }
  };

  const handlePreview = (url: string, name: string) => {
    const isPdf = name.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(name);

    if (isPdf) {
      setPreviewType('pdf');
      setPreviewUrl(url);
      setPreviewOpen(true);
    } else if (isImage) {
      setPreviewType('image');
      setPreviewUrl(url);
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

  return (
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
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                background: '#1976d2',
                color: '#fff',
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
              }}
            >
              Guardar Análisis
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
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(255, 165, 0, 0.05)',
                      border: '1px dashed',
                      borderColor: '#FFA500',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <SettingsIcon sx={{ color: '#FFA500', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Archivos Adjuntos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Puede adjuntar diagramas y archivos adicionales (PDF, PNG, JPG, DOCX). Solo se permite un archivo a la vez.
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
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
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
                        Guardar Análisis
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Preview Modal */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Vista Previa del Archivo
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%', bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              {previewType === 'pdf' && (
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setDeleteConfirmationOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </Box>
      </Dialog>
    </AppPageLayout>
  );
}
