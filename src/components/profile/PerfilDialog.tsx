/**
 * Diálogo de perfil: ver toda la información y editar solo nombre, contraseña y foto.
 * Foto: recorte circular manual (arrastrar para elegir la zona) y actualización al guardar.
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
} from '@mui/material';
import { Person as PersonIcon, Visibility, VisibilityOff, PhotoCamera } from '@mui/icons-material';
import type { User } from '../../contexts/AuthContext';
import { AUTH_TOKEN_KEY } from '../../utils/constants';
import { useNotification } from '../../hooks/useNotification';
import PhotoUpdateFlowContent from './PhotoUpdateFlowContent';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [photoFlowOpen, setPhotoFlowOpen] = useState(false);
  const [photoCacheKey, setPhotoCacheKey] = useState(0);

  useEffect(() => {
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
      setPhotoFlowOpen(false);
    }
  }, [open, user]);

  const handlePhotoSelected = (file: File) => {
    setPendingFile(file);
    setFotoPerfil(URL.createObjectURL(file));
    setPhotoLoadError(false);
    setPhotoFlowOpen(false);
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
          throw new Error((err as { error?: string })?.error || 'Error al subir la imagen');
        }
        const uploadData = await uploadRes.json();
        fotoUrl = (uploadData as { url?: string }).url;
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
        const apiMsg = (data as { error?: string }).error || '';
        const short =
          apiMsg.length > 60 || /prisma|invocation|undefined/i.test(apiMsg)
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.length > 80 ? 'No se pudo guardar. Intente de nuevo.' : msg || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const getRolLabel = () => {
    if (user?.role === 'admin') return 'Administrador';
    if (user?.role === 'supervisor') return 'Supervisor de Riesgos';
    if (user?.role === 'dueño_procesos') return 'Dueño del Proceso';
    if (user?.role === 'gerente' || user?.role === 'gerente_general' || user?.role === 'manager') return 'Gerente General';
    return user?.position || (user?.role as string) || 'Usuario';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const avatarSrc =
    photoLoadError
      ? undefined
      : fotoPerfil
        ? fotoPerfil.startsWith('blob:')
          ? fotoPerfil
          : `${fotoPerfil}${fotoPerfil.includes('?') ? '&' : '?'}bust=${photoCacheKey}`
        : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxWidth: 380 } }}
    >
      {photoFlowOpen ? (
        <PhotoUpdateFlowContent
          onCancel={() => setPhotoFlowOpen(false)}
          onSelect={handlePhotoSelected}
        />
      ) : (
        <>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', py: 1.5 }}>
            Mi perfil
          </DialogTitle>
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
                    src={avatarSrc}
                    onError={() => setPhotoLoadError(true)}
                    sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '1.75rem' }}
                  >
                    {(!fotoPerfil || photoLoadError) && (user?.fullName?.charAt(0) || '?')}
                  </Avatar>
                </Box>
                <Button
                  type="button"
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCamera />}
                  onClick={() => setPhotoFlowOpen(true)}
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
              <TextField
                fullWidth
                label="Correo"
                value={user?.email ?? ''}
                margin="dense"
                size="small"
                disabled
                inputProps={{ autoComplete: 'off' }}
              />
              <TextField
                fullWidth
                label="Área / Departamento"
                value={user?.department ?? ''}
                margin="dense"
                size="small"
                disabled
                inputProps={{ autoComplete: 'off' }}
              />
              <TextField
                fullWidth
                label="Rol"
                value={getRolLabel()}
                margin="dense"
                size="small"
                disabled
                inputProps={{ autoComplete: 'off' }}
              />

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
  );
}
