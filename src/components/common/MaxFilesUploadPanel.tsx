import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

type Slot = 0 | 1;

export type MaxFilesUploadPanelProps = {
  /** Etiqueta encima del panel; vacío para ocultar (p. ej. si el título va fuera). */
  label: string;
  buttonLabel: string;
  accept: string;
  maxFiles: number;
  selectedFiles: Array<File | null>;
  existingUrls: Array<string>;
  /** Nombres para archivos ya guardados (misma longitud que slots; opcional). */
  existingNames?: string[];
  validateFile?: (file: File) => string | null;
  onError?: (message: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveAt: (index: number) => void;
  disabled?: boolean;
  /** Icono izquierdo (mismo patrón que Análisis de Proceso). Por defecto Upload. */
  leadingIcon?: ReactNode;
  /** Vista previa personalizada (p. ej. modal en Análisis de Proceso). Si no se pasa, abre en nueva pestaña. */
  onPreviewUrl?: (url: string) => void;
  onPreviewFile?: (file: File) => void;
};

export default function MaxFilesUploadPanel({
  label,
  buttonLabel,
  accept,
  maxFiles,
  selectedFiles,
  existingUrls,
  existingNames,
  validateFile,
  onError,
  onAddFiles,
  onRemoveAt,
  disabled,
  leadingIcon,
  onPreviewUrl,
  onPreviewFile,
}: MaxFilesUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const slots = useMemo(() => {
    const n = Math.max(0, Math.min(2, maxFiles));
    return Array.from({ length: n }, (_, i) => i as Slot);
  }, [maxFiles]);

  const countOccupied = () => {
    let c = 0;
    for (let i = 0; i < maxFiles; i++) {
      if (selectedFiles[i] || String(existingUrls[i] || '').trim()) c++;
    }
    return c;
  };

  const addFilesFromList = (files: File[]) => {
    if (!files.length) return;
    for (const f of files) {
      const err = validateFile?.(f);
      if (err) {
        onError?.(err);
        return;
      }
    }
    const remaining = Math.max(0, maxFiles - countOccupied());
    if (files.length > remaining) {
      onError?.(`Solo puede subir máximo ${maxFiles} archivos.`);
    }
    const toAdd = files.slice(0, remaining);
    if (toAdd.length) onAddFiles(toAdd);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFilesFromList(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer.types.includes('Files')) setDragOver(true);
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
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files || []);
    addFilesFromList(files);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <Box>
      {label.trim() ? (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          {label}
        </Typography>
      ) : null}

      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={disabled ? undefined : openPicker}
        sx={{
          p: 2.5,
          cursor: disabled ? 'default' : 'pointer',
          backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'rgba(255, 165, 0, 0.05)',
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : '#FFA500',
          borderRadius: 2,
          transition: 'background-color 0.2s, border-color 0.2s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {leadingIcon ?? <UploadIcon sx={{ color: '#FFA500', mt: 0.5 }} />}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              Arrastra y suelta archivos aquí o haz clic en el área punteada. PDF, PNG, JPG, DOCX. Máx. 5MB. Máximo{' '}
              {maxFiles} archivo{maxFiles > 1 ? 's' : ''}.
            </Typography>

            {slots.map((idx) => {
              const file = selectedFiles[idx] || null;
              const url = existingUrls[idx] || '';
              if (!file && !String(url).trim()) return null;

              if (file) {
                return (
                  <Box
                    key={`pending-${idx}`}
                    sx={{ mt: 1, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ffcc80' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UploadIcon color="warning" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </Typography>
                        <Chip label="Por subir" size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Box>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onPreviewFile) {
                            onPreviewFile(file);
                            return;
                          }
                          const u = URL.createObjectURL(file);
                          window.open(u, '_blank', 'noopener,noreferrer');
                          window.setTimeout(() => URL.revokeObjectURL(u), 60_000);
                        }}
                      >
                        Ver
                      </Button>
                      {!disabled && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveAt(idx);
                          }}
                          title="Quitar"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              }

              return (
                <Box
                  key={`saved-${idx}`}
                  sx={{ mt: 1, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {String(existingNames?.[idx] ?? '').trim() || 'Archivo guardado'}
                      </Typography>
                      <Chip label="Guardado" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Box>
                    {onPreviewUrl ? (
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewUrl(url);
                        }}
                      >
                        Ver
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        component={Link}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver
                      </Button>
                    )}
                    {!disabled && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAt(idx);
                        }}
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              );
            })}

            {!disabled && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  openPicker();
                }}
                sx={{ mt: 1 }}
              >
                {buttonLabel}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <input
        type="file"
        ref={inputRef}
        multiple={maxFiles > 1}
        style={{ display: 'none' }}
        onChange={handleSelect}
        accept={accept}
        disabled={disabled}
      />
    </Box>
  );
}
