/**
 * Diálogo de perfil: ver toda la información y editar solo nombre, contraseña y foto.
 * Contraseña solo se puede cambiar con la contraseña actual.
 * Foto: recorte circular (canvas propio, sin librerías externas), luego se sube a Azure.
 */

import React, { useState, useRef, useEffect } from 'react';
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
import { Person as PersonIcon, Visibility, VisibilityOff, PhotoCamera, Crop } from '@mui/icons-material';
import type { User } from '../../contexts/AuthContext';
import { AUTH_TOKEN_KEY } from '../../utils/constants';
import { useNotification } from '../../hooks/useNotification';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const MAX_FILE_SIZE_MB = 2; // backend permite 2MB para perfil
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const CROP_SIZE_PX = 400; // tamaño final del recorte circular (diámetro)
const CROP_PREVIEW_SIZE = 280; // tamaño del círculo de vista previa
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Dibuja la imagen recortada en círculo en un canvas y devuelve Blob. */
function getCircularCropBlob(
  imageSrc: string,
  position: { x: number; y: number },
  scale: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const r = CROP_PREVIEW_SIZE / 2;
      const centerImgX = (r - position.x) / scale;
      const centerImgY = (r - position.y) / scale;
      const cropRadius = r / scale;
      const sx = centerImgX - cropRadius;
      const sy = centerImgY - cropRadius;
      const size = 2 * cropRadius;
      const canvas = document.createElement('canvas');
      canvas.width = CROP_SIZE_PX;
      canvas.height = CROP_SIZE_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas no disponible'));
        return;
      }
      ctx.beginPath();
      ctx.arc(CROP_SIZE_PX / 2, CROP_SIZE_PX / 2, CROP_SIZE_PX / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, sx, sy, size, size, 0, 0, CROP_SIZE_PX, CROP_SIZE_PX);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob falló'))), 'image/jpeg', 0.92);
    };
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = imageSrc;
  });
}

interface PerfilDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaved: () => void;
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

  // Recorte circular (canvas propio, sin librerías)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1.2);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [cropApplying, setCropApplying] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const [cropDragging, setCropDragging] = useState(false);

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
    setImageNaturalSize(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropScale(1.2);
      setCropPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (open && user) {
      setNombre(user.fullName ?? '');
      setFotoPerfil((prev) => {
        if (typeof prev === 'string' && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return user.fotoPerfil ?? null;
      });
      setPasswordActual('');
      setPasswordNueva('');
      setPendingFile(null);
      setError('');
      setCropImageSrc(null);
    }
  }, [open, user]);

  const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleAvatarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarDragOver(true);
  };

  const handleAvatarDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarDragOver(false);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;
    setImageNaturalSize({ w, h });
    const s = 1.2;
    setCropPosition({
      x: CROP_PREVIEW_SIZE / 2 - (w * s) / 2,
      y: CROP_PREVIEW_SIZE / 2 - (h * s) / 2,
    });
  };

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!imageNaturalSize) return;
    e.preventDefault();
    setCropDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: cropPosition.x, posY: cropPosition.y };
  };

  const handleCropMouseUp = () => {
    dragStartRef.current = null;
    setCropDragging(false);
  };

  useEffect(() => {
    if (!cropImageSrc) return;
    const onMouseUp = () => {
      dragStartRef.current = null;
      setCropDragging(false);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setCropPosition((p) => ({ x: dragStartRef.current!.posX + dx, y: dragStartRef.current!.posY + dy }));
      dragStartRef.current = { ...dragStartRef.current, x: e.clientX, y: e.clientY, posX: dragStartRef.current.posX + dx, posY: dragStartRef.current.posY + dy };
    };
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [cropImageSrc]);

  const handleAplicarCrop = async () => {
    if (!cropImageSrc || !imageNaturalSize) {
      setError('Espere a que cargue la imagen e intente de nuevo.');
      return;
    }
    setCropApplying(true);
    setError('');
    try {
      const blob = await getCircularCropBlob(cropImageSrc, cropPosition, cropScale);
      const file = new File([blob], 'perfil.jpg', { type: 'image/jpeg' });
      setPendingFile(file);
      setFotoPerfil(URL.createObjectURL(blob));
      setCropImageSrc(null);
      setImageNaturalSize(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudo recortar la imagen. Intente de nuevo.');
    } finally {
      setCropApplying(false);
    }
  };

  const handleCancelarCrop = () => {
    setCropImageSrc(null);
    setImageNaturalSize(null);
    setCropDragging(false);
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
      onSaved();
      onClose();
      if (changedPassword) {
        showSuccess('Contraseña cambiada con éxito.');
      } else {
        showSuccess('Perfil actualizado correctamente.');
      }
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

  return (
    <>
      {/* Diálogo de recorte circular (canvas propio) */}
      <Dialog
        open={!!cropImageSrc}
        onClose={handleCancelarCrop}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            width: 'min(95vw, 420px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Crop color="primary" /> Recortar foto de perfil
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, pb: 1 }}>
          {cropImageSrc && (
            <Box
              sx={{
                width: CROP_PREVIEW_SIZE,
                height: CROP_PREVIEW_SIZE,
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
                cursor: cropDragging ? 'grabbing' : 'grab',
                bgcolor: '#333',
              }}
              onMouseDown={handleCropMouseDown}
              onMouseLeave={handleCropMouseUp}
              onMouseUp={handleCropMouseUp}
            >
              <img
                src={cropImageSrc}
                alt="Recortar"
                draggable={false}
                onLoad={handleCropImageLoad}
                style={{
                  position: 'absolute',
                  left: cropPosition.x,
                  top: cropPosition.y,
                  width: imageNaturalSize ? imageNaturalSize.w * cropScale : undefined,
                  height: imageNaturalSize ? imageNaturalSize.h * cropScale : undefined,
                  pointerEvents: 'none',
                }}
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }} gutterBottom>
            Arrastre para mover · Zoom
          </Typography>
          <Slider
            value={cropScale}
            min={1}
            max={2.5}
            step={0.05}
            onChange={(_, value) => setCropScale(value as number)}
            sx={{ width: '90%', mb: 0.5 }}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={handleCancelarCrop}>Cancelar</Button>
          <Button variant="contained" onClick={handleAplicarCrop} disabled={cropApplying || !imageNaturalSize}>
            {cropApplying ? <CircularProgress size={22} /> : 'Aplicar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 380 } }}
      >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>Mi perfil</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 1, pb: 2, px: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box
              onDragOver={handleAvatarDragOver}
              onDragLeave={handleAvatarDragLeave}
              onDrop={handleAvatarDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: 'relative',
                borderRadius: '50%',
                p: 0.5,
                border: '2px dashed',
                borderColor: avatarDragOver ? 'primary.main' : 'transparent',
                bgcolor: avatarDragOver ? 'action.hover' : 'transparent',
                transition: 'border-color 0.2s, background-color 0.2s',
                cursor: 'pointer',
              }}
            >
              <Avatar
                src={fotoPerfil || undefined}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                }}
              >
                {!fotoPerfil && (user?.fullName?.charAt(0) || '?')}
              </Avatar>
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Clic o arrastre una imagen aquí. Máx. {MAX_FILE_SIZE_MB} MB. Se recortará en círculo ({CROP_SIZE_PX}×{CROP_SIZE_PX}).
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
    </Dialog>
    </>
  );
}
