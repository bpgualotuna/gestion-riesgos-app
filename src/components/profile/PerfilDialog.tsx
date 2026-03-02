/**
 * Diálogo de perfil: ver toda la información y editar solo nombre, contraseña y foto.
 * Foto: recorte circular manual (arrastrar para elegir la zona) y actualización al guardar.
 */

 import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Slider,
} from '@mui/material';
import { Person as PersonIcon, Visibility, VisibilityOff, PhotoCamera, Crop, ZoomIn, ZoomOut } from '@mui/icons-material';
import type { User } from '../../contexts/AuthContext';
import { AUTH_TOKEN_KEY } from '../../utils/constants';
import { useNotification } from '../../hooks/useNotification';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const CROP_OUTPUT_PX = 400;
const CROP_PREVIEW_PX = 280;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Misma lógica para previsualizar y exportar: centro en %, zoom (1 = sin zoom). */
function drawCropCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerXPercent: number,
  centerYPercent: number,
  zoom: number,
  outputSize: number
) {
  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const cx = (centerXPercent / 100) * w;
  const cy = (centerYPercent / 100) * h;
  const r = Math.max(1, (Math.min(w, h) / 2) / Math.max(0.5, zoom));
  const scale = outputSize / (2 * r);
  const drawW = w * scale;
  const drawH = h * scale;
  const dx = outputSize / 2 - cx * scale;
  const dy = outputSize / 2 - cy * scale;
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, w, h, dx, dy, drawW, drawH);
}

function cropCircleBlob(imageSrc: string, centerXPercent: number, centerYPercent: number, zoom: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CROP_OUTPUT_PX;
      canvas.height = CROP_OUTPUT_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas no disponible'));
        return;
      }
      drawCropCircle(ctx, img, centerXPercent, centerYPercent, zoom, CROP_OUTPUT_PX);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob falló'))), 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = imageSrc;
  });
}

interface PerfilDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: (updatedUserFromApi?: Record<string, unknown>) => void;
}

export default function PerfilDialog({ open, onClose, user, onSaved }: PerfilDialogProps) {
  const { showSuccess } = useNotification();
  const [nombre, setNombre] = useState(user?.fullName ?? '');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(user?.fotoPerfil ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);

  // Paso "Actualizar foto": zona para arrastrar o subir
  const [showUploadStep, setShowUploadStep] = useState(false);
  // Paso de recorte manual: imagen, posición (0–100) y zoom (1 = sin zoom, hasta 3)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 50, y: 50 });
  const [cropZoom, setCropZoom] = useState(1);
  const cropDragRef = useRef<{ startX: number; startY: number; startPos: { x: number; y: number } } | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const [cropImageLoaded, setCropImageLoaded] = useState(false);
  const CROP_ZOOM_MIN = 0.5;
  const CROP_ZOOM_MAX = 3;
  const CROP_ZOOM_STEP = 0.25;
  const [uploadZoneDragOver, setUploadZoneDragOver] = useState(false);
  // Paso vista previa: tras "Aplicar recorte" se muestra el resultado para ver, volver a editar o usar
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewBlobFile, setPreviewBlobFile] = useState<File | null>(null);
  // Clave para forzar recarga de la imagen al abrir el diálogo (evitar ver foto antigua en caché)
  const [photoCacheKey, setPhotoCacheKey] = useState(0);

  const getClientCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e) return { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 };
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const processImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Formato no permitido. Use JPEG, PNG, GIF o WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`La imagen no debe superar ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCropImageSrc(dataUrl);
      setCropPosition({ x: 50, y: 50 });
      setCropZoom(1);
      setCropImageLoaded(false);
    };
    reader.onerror = () => setError('Error al leer el archivo.');
    reader.readAsDataURL(file);
  };

  const handleCropDragStart = useCallback((clientX: number, clientY: number) => {
    cropDragRef.current = { startX: clientX, startY: clientY, startPos: { ...cropPosition } };
  }, [cropPosition]);

  const handleCropDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const ref = cropDragRef.current;
    if (!ref) return;
    if (e.cancelable) e.preventDefault();
    const { x: cx, y: cy } = getClientCoords(e);
    const dx = (cx - ref.startX) / CROP_PREVIEW_PX * 100;
    const dy = (cy - ref.startY) / CROP_PREVIEW_PX * 100;
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
    handleCropDragStart(x, y);
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
        const url = URL.createObjectURL(blob);
        setPreviewBlobFile(f);
        setPreviewBlobUrl(url);
        setPhotoProcessing(false);
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
  };

  const chooseOtherImage = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setCropImageSrc(null);
    setShowUploadStep(true);
  };

  const useThisPhoto = () => {
    if (previewBlobFile && previewBlobUrl) {
      setPendingFile(previewBlobFile);
      setFotoPerfil(previewBlobUrl);
      setPhotoLoadError(false);
    }
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setCropImageSrc(null);
    setShowUploadStep(false);
  };

  const cancelCrop = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewBlobUrl(null);
    setPreviewBlobFile(null);
    setCropImageSrc(null);
    cropDragRef.current = null;
  };

  const openUploadStep = () => {
    setShowUploadStep(true);
    setError('');
  };

  const closeUploadStep = () => {
    setShowUploadStep(false);
  };

  const handleUploadStepDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleUploadStepDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneDragOver(true);
  };

  const handleUploadStepDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadZoneDragOver(false);
  };

  React.useEffect(() => {
    if (open && user) {
      setNombre(user.fullName ?? '');
      setFotoPerfil((prev) => {
        if (typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return user.fotoPerfil ?? null;
      });
      setPhotoCacheKey((k) => k + 1);
      setPasswordActual('');
      setPasswordNueva('');
      setPendingFile(null);
      setError('');
      setPhotoLoadError(false);
      setCropImageSrc(null);
      setCropImageLoaded(false);
      setShowUploadStep(false);
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPreviewBlobFile(null);
    }
  }, [open, user]);

  // Vista previa del recorte: mismo cálculo que al exportar (WYSIWYG)
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

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!user) return;
    setError('');
    setSaving(true);

    try {
      let fotoUrl = fotoPerfil;
      if (pendingFile) {
        const formData = new FormData();
        formData.append('archivo', pendingFile);
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const uploadRes = await fetch(`${API_BASE}/upload/perfil`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err?.error || 'Error al subir la imagen');
        }
        const uploadData = await uploadRes.json();
        fotoUrl = uploadData.url;
      }

      const body: { nombre?: string; passwordActual?: string; passwordNueva?: string; fotoPerfil?: string | null } = {};
      if (nombre.trim()) body.nombre = nombre.trim();
      if (passwordNueva) {
        if (!passwordActual.trim()) {
          setError('Debe ingresar la contraseña actual para cambiar la contraseña.');
          setSaving(false);
          return;
        }
        body.passwordActual = passwordActual;
        body.passwordNueva = passwordNueva;
      }
      if (fotoUrl !== undefined) body.fotoPerfil = fotoUrl;

      if (Object.keys(body).length === 0) {
        setSaving(false);
        return;
      }

      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiMsg = data?.error || '';
        const short = apiMsg.length > 60 || /prisma|invocation|undefined/i.test(apiMsg)
          ? 'No se pudo guardar. Intente de nuevo.'
          : apiMsg;
        throw new Error(short || 'No se pudo guardar.');
      }
      const changedPassword = !!passwordNueva;
      onSaved(data);
      if (changedPassword) {
        showSuccess('Contraseña cambiada con éxito.');
      } else {
        showSuccess('Perfil actualizado. La foto se actualizará al cerrar.');
      }
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      const msg = err?.message || '';
      setError(msg.length > 80 ? 'No se pudo guardar. Intente de nuevo.' : msg || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const getRolLabel = () => {
    if (user?.role === 'admin') return 'Administrador';
    if (user?.role === 'supervisor') return 'Supervisor de Riesgos';
    if (user?.role === 'dueño_procesos') return 'Dueño del Proceso';
    if (user?.role === 'gerente' || user?.role === 'gerente_general') return 'Gerente General';
    return user?.position || user?.role || 'Usuario';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const showingUploadStep = showUploadStep && !cropImageSrc && !previewBlobUrl;
  const showingPreviewStep = Boolean(previewBlobUrl);
  const showingCropStep = Boolean(cropImageSrc) && !previewBlobUrl;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 380 } }}
      >
      {showingUploadStep ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera /> Actualizar foto
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textAlign: 'center' }}>
              Arrastra una imagen aquí o haz clic para seleccionar. Luego podrás elegir la zona con el círculo.
            </Typography>
            <Box
              onDragOver={handleUploadStepDragOver}
              onDragLeave={handleUploadStepDragLeave}
              onDrop={handleUploadStepDrop}
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
            <Button type="button" onClick={closeUploadStep}>Cancelar</Button>
          </DialogActions>
        </>
      ) : showingPreviewStep ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>
            Vista previa
          </DialogTitle>
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
                src={previewBlobUrl ?? ''}
                alt="Vista previa"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 2 }}>
              <Button type="button" variant="outlined" onClick={backToCrop}>
                Volver a editar recorte
              </Button>
              <Button type="button" variant="outlined" onClick={chooseOtherImage}>
                Elegir otra imagen
              </Button>
              <Button type="button" variant="contained" onClick={useThisPhoto}>
                Usar esta foto
              </Button>
            </Box>
          </DialogContent>
        </>
      ) : showingCropStep ? (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Crop /> Recortar foto
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Arrastra para mover y usa el zoom. Lo que ves es lo que se guardará.
            </Typography>
            <img
              ref={cropImageRef}
              src={cropImageSrc ?? ''}
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
              <Typography variant="caption" color="text.secondary">
                Zoom: {Math.round(cropZoom * 100)}%
              </Typography>
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
      ) : (
        <>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>Mi perfil</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{ position: 'relative', borderRadius: '50%', p: 0.5 }}>
              <Avatar
                src={photoLoadError ? undefined : (fotoPerfil ? `${fotoPerfil}${fotoPerfil.includes('?') ? '&' : '?'}bust=${photoCacheKey}` : undefined)}
                onError={() => setPhotoLoadError(true)}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '1.75rem',
                }}
              >
                {(!fotoPerfil || photoLoadError) && (user?.fullName?.charAt(0) || '?')}
              </Avatar>
              {photoProcessing && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.4)' }}>
                  <CircularProgress size={28} sx={{ color: 'white' }} />
                </Box>
              )}
            </Box>
            <Button
              type="button"
              variant="outlined"
              size="small"
              startIcon={<PhotoCamera />}
              onClick={openUploadStep}
              sx={{ mt: 1.5 }}
            >
              Actualizar foto
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Pulsa el botón para subir una imagen y elegir la zona con el círculo.
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            margin="dense"
            size="small"
          />
          <TextField fullWidth label="Correo" value={user?.email ?? ''} margin="dense" size="small" disabled inputProps={{ autoComplete: 'off' }} />
          <TextField fullWidth label="Área / Departamento" value={user?.department ?? ''} margin="dense" size="small" disabled inputProps={{ autoComplete: 'off' }} />
          <TextField fullWidth label="Rol" value={getRolLabel()} margin="dense" size="small" disabled inputProps={{ autoComplete: 'off' }} />

          <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.5, fontWeight: 600 }}>
            Cambiar contraseña (opcional)
          </Typography>
          <TextField
            fullWidth
            type={showPasswordActual ? 'text' : 'password'}
            label="Contraseña actual"
            name="password-actual"
            autoComplete="current-password"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            margin="dense"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPasswordActual((s) => !s)} edge="end" size="small" type="button" tabIndex={-1}>
                    {showPasswordActual ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type={showPasswordNueva ? 'text' : 'password'}
            label="Nueva contraseña"
            name="password-nueva"
            autoComplete="new-password"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            margin="dense"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPasswordNueva((s) => !s)} edge="end" size="small" type="button" tabIndex={-1}>
                    {showPasswordNueva ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={22} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
        </>
      )}
    </Dialog>
    </>
  );
}
