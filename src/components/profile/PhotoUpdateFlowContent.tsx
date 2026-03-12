/**
 * Flujo de actualización de foto: subir → recortar → vista previa.
 * Devuelve el contenido para Dialog (DialogTitle + DialogContent + DialogActions).
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Slider,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera, Crop, ZoomIn, ZoomOut } from '@mui/icons-material';
import {
  drawCropCircle,
  cropCircleBlob,
  validateImageFile,
  CROP_PREVIEW_PX,
  MAX_FILE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
} from '../../utils/photoCropUtils';

const CROP_ZOOM_MIN = 0.5;
const CROP_ZOOM_MAX = 3;
const CROP_ZOOM_STEP = 0.25;

function getClientCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e) return { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 };
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
}

interface PhotoUpdateFlowContentProps {
  onCancel: () => void;
  onSelect: (file: File) => void;
}

export default function PhotoUpdateFlowContent({ onCancel, onSelect }: PhotoUpdateFlowContentProps) {
  const [step, setStep] = useState<'upload' | 'crop' | 'preview'>('upload');
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropImageLoaded, setCropImageLoaded] = useState(false);
  const [uploadZoneDragOver, setUploadZoneDragOver] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewBlobFile, setPreviewBlobFile] = useState<File | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropDragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  const processImageFile = (file: File) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropPosition({ x: 50, y: 50 });
      setCropZoom(1);
      setCropImageLoaded(false);
      setStep('crop');
    };
    reader.onerror = () => setError('Error al leer el archivo.');
    reader.readAsDataURL(file);
  };

  const handleCropDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const ref = cropDragRef.current;
    if (!ref) return;
    if (e.cancelable) e.preventDefault();
    const { x: cx, y: cy } = getClientCoords(e);
    const dx = ((cx - ref.startX) / CROP_PREVIEW_PX) * 100;
    const dy = ((cy - ref.startY) / CROP_PREVIEW_PX) * 100;
    setCropPosition({
      x: Math.max(0, Math.min(100, ref.startPos.x - dx)),
      y: Math.max(0, Math.min(100, ref.startPos.y - dy)),
    });
  }, []);

  const handleCropDragEnd = useCallback(() => {
    cropDragRef.current = null;
    window.removeEventListener('mousemove', handleCropDragMove);
    window.removeEventListener('mouseup', handleCropDragEnd);
    window.removeEventListener('touchmove', handleCropDragMove);
    window.removeEventListener('touchend', handleCropDragEnd);
  }, [handleCropDragMove]);

  const handleCropPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = 'touches' in e ? getClientCoords(e.nativeEvent) : { x: e.clientX, y: e.clientY };
    cropDragRef.current = { startX: x, startY: y, startPos: { ...cropPosition } };
    window.addEventListener('mousemove', handleCropDragMove);
    window.addEventListener('mouseup', handleCropDragEnd);
    window.addEventListener('touchmove', handleCropDragMove, { passive: false });
    window.addEventListener('touchend', handleCropDragEnd);
  };

  const applyCrop = () => {
    if (!cropImageSrc) return;
    setPhotoProcessing(true);
    cropCircleBlob(cropImageSrc, cropPosition.x, cropPosition.y, cropZoom)
      .then((blob) => {
        const f = new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
        setPreviewBlobFile(f);
        setPreviewBlobUrl(URL.createObjectURL(blob));
        setPhotoProcessing(false);
        setStep('preview');
      })
      .catch((err: Error) => {
        setError(err?.message || 'No se pudo aplicar el recorte.');
        setPhotoProcessing(false);
      });
  };

  const backToCrop = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setStep('crop');
  };

  const chooseOtherImage = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setCropImageSrc(null);
    setStep('upload');
  };

  const useThisPhoto = () => {
    if (previewBlobFile) {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      onSelect(previewBlobFile);
    }
    onCancel();
  };

  const cancelCrop = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setCropImageSrc(null);
    cropDragRef.current = null;
    onCancel();
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  React.useEffect(() => {
    if (!cropImageSrc || !cropImageLoaded || !previewCanvasRef.current || !cropImageRef.current) return;
    const img = cropImageRef.current;
    if (!img.complete) return;
    const ctx = previewCanvasRef.current.getContext('2d');
    if (!ctx) return;
    previewCanvasRef.current.width = CROP_PREVIEW_PX;
    previewCanvasRef.current.height = CROP_PREVIEW_PX;
    drawCropCircle(ctx, img, cropPosition.x, cropPosition.y, cropZoom, CROP_PREVIEW_PX);
  }, [cropImageSrc, cropImageLoaded, cropPosition.x, cropPosition.y, cropZoom]);

  if (step === 'upload') {
    return (
      <>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoCamera /> Actualizar foto
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2 }}>
          {error && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textAlign: 'center' }}>
            Arrastra una imagen aquí o haz clic para seleccionar. Luego podrás elegir la zona con el círculo.
          </Typography>
          <Box
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setUploadZoneDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setUploadZoneDragOver(false); }}
            onDrop={handleUploadDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: uploadZoneDragOver ? 'primary.main' : 'divider',
              bgcolor: uploadZoneDragOver ? 'action.hover' : 'action.selected',
              borderRadius: 2,
              py: 4,
              px: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Arrastra la imagen o haz clic para subir
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              JPEG, PNG, GIF o WebP. Máx. {MAX_FILE_SIZE_MB} MB
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleSelectImage}
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button type="button" onClick={onCancel}>Cancelar</Button>
        </DialogActions>
      </>
    );
  }

  if (step === 'preview' && previewBlobUrl) {
    return (
      <>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>Vista previa</DialogTitle>
        <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textAlign: 'center' }}>
            Así se verá tu foto de perfil. Si no te gusta, vuelve a editar o elige otra imagen.
          </Typography>
          <Box
            sx={{
              width: CROP_PREVIEW_PX,
              height: CROP_PREVIEW_PX,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid',
              borderColor: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={previewBlobUrl}
              alt="Vista previa"
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
            <Button type="button" variant="outlined" onClick={backToCrop}>Volver a editar recorte</Button>
            <Button type="button" variant="outlined" onClick={chooseOtherImage}>Elegir otra imagen</Button>
            <Button type="button" variant="contained" onClick={useThisPhoto}>Usar esta foto</Button>
          </Box>
        </DialogContent>
      </>
    );
  }

  if (step === 'crop' && cropImageSrc) {
    return (
      <>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Crop /> Recortar foto
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Arrastra para mover y usa el zoom. Lo que ves es lo que se guardará.
          </Typography>
          <img
            ref={cropImageRef}
            src={cropImageSrc}
            alt=""
            style={{ display: 'none' }}
            onLoad={() => setCropImageLoaded(true)}
          />
          <Box
            onMouseDown={handleCropPointerDown}
            onTouchStart={handleCropPointerDown}
            sx={{
              width: CROP_PREVIEW_PX,
              height: CROP_PREVIEW_PX,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: 'grab',
              border: '3px solid',
              borderColor: 'primary.main',
              flexShrink: 0,
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={CROP_PREVIEW_PX}
              height={CROP_PREVIEW_PX}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          </Box>
          <Box sx={{ width: '100%', maxWidth: CROP_PREVIEW_PX, mt: 2, px: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ZoomOut sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Slider
                size="small"
                value={cropZoom}
                min={CROP_ZOOM_MIN}
                max={CROP_ZOOM_MAX}
                step={CROP_ZOOM_STEP}
                onChange={(_, value) => setCropZoom(Array.isArray(value) ? value[0] : value)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                sx={{ flex: 1 }}
              />
              <ZoomIn sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">Zoom: {Math.round(cropZoom * 100)}%</Typography>
          </Box>
          {photoProcessing && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.8)', zIndex: 1 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button type="button" onClick={cancelCrop} disabled={photoProcessing}>Cancelar</Button>
          <Button type="button" variant="contained" onClick={applyCrop} disabled={photoProcessing}>
            {photoProcessing ? <CircularProgress size={22} /> : 'Aplicar recorte'}
          </Button>
        </DialogActions>
      </>
    );
  }

  return null;
}
