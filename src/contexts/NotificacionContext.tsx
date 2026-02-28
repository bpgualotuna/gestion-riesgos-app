/**
 * Notificación Context
 * Manages notifications and tasks for the review and approval workflow.
 * Éxito: barra de tiempo + cierre automático o Aceptar. Error: solo Aceptar.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Notificacion, Tarea } from '../types';
import { useAuth } from "./AuthContext";
import { useTheme } from '@mui/material/styles';

import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const SUCCESS_AUTO_CLOSE_MS = 4500;

interface NotificacionContextType {
  notificaciones: Notificacion[];
  tareas: Tarea[];
  notificacionesNoLeidas: number;
  tareasPendientes: number;
  marcarNotificacionLeida: (id: string) => void;
  marcarTareaCompletada: (id: string) => void;
  crearNotificacion: (notificacion: Omit<Notificacion, 'id' | 'createdAt' | 'leida'>) => void;
  crearTareaDesdeNotificacion: (notificacionId: string) => void;
  obtenerNotificaciones: () => Notificacion[];
  obtenerTareas: () => Tarea[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export const NotificacionContext = createContext<NotificacionContextType | undefined>(undefined);

// Mock storage (en producción esto vendría de una API)
const STORAGE_KEY_NOTIFICACIONES = 'notificaciones_app';
const STORAGE_KEY_TAREAS = 'tareas_app';

export function NotificacionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const theme = useTheme();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);

  // Snackbar State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successProgress, setSuccessProgress] = useState(0);

  const showSuccess = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSuccessProgress(0);
    setSnackbarOpen(true);
  }, []);

  const showError = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSnackbarOpen(false);
    setSuccessProgress(0);
  }, []);

  // Éxito: barra de tiempo y cierre automático si no se pulsa Aceptar
  useEffect(() => {
    if (!snackbarOpen || snackbarSeverity !== 'success') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setSuccessProgress(Math.min(100, (elapsed / SUCCESS_AUTO_CLOSE_MS) * 100));
    }, 80);
    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      setSnackbarOpen(false);
      setSuccessProgress(0);
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => {
      clearInterval(interval);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [snackbarOpen, snackbarSeverity]);

  // Cargar notificaciones y tareas del localStorage
  useEffect(() => {
    if (user) {
      const storedNotificaciones = localStorage.getItem(STORAGE_KEY_NOTIFICACIONES);
      const storedTareas = localStorage.getItem(STORAGE_KEY_TAREAS);

      if (storedNotificaciones) {
        const allNotificaciones: Notificacion[] = JSON.parse(storedNotificaciones);
        setNotificaciones(allNotificaciones.filter(n => n.usuarioId === user.id));
      }

      if (storedTareas) {
        const allTareas: Tarea[] = JSON.parse(storedTareas);
        setTareas(allTareas.filter(t => t.usuarioId === user.id));
      }
    }
  }, [user]);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    if (user) {
      const storedNotificaciones = localStorage.getItem(STORAGE_KEY_NOTIFICACIONES);
      const allNotificaciones: Notificacion[] = storedNotificaciones
        ? JSON.parse(storedNotificaciones)
        : [];

      // Actualizar solo las notificaciones del usuario actual
      const otrasNotificaciones = allNotificaciones.filter(n => n.usuarioId !== user.id);
      const nuevasNotificaciones = [...otrasNotificaciones, ...notificaciones];
      localStorage.setItem(STORAGE_KEY_NOTIFICACIONES, JSON.stringify(nuevasNotificaciones));
    }
  }, [notificaciones, user]);

  useEffect(() => {
    if (user) {
      const storedTareas = localStorage.getItem(STORAGE_KEY_TAREAS);
      const allTareas: Tarea[] = storedTareas ? JSON.parse(storedTareas) : [];

      const otrasTareas = allTareas.filter(t => t.usuarioId !== user.id);
      const nuevasTareas = [...otrasTareas, ...tareas];
      localStorage.setItem(STORAGE_KEY_TAREAS, JSON.stringify(nuevasTareas));
    }
  }, [tareas, user]);

  const marcarNotificacionLeida = useCallback((id: string) => {
    setNotificaciones(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, leida: true, fechaLeida: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const marcarTareaCompletada = useCallback((id: string) => {
    setTareas(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completada: true, estado: 'completada', fechaCompletada: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const crearNotificacion = useCallback((notificacionData: Omit<Notificacion, 'id' | 'createdAt' | 'leida'>) => {
    const nuevaNotificacion: Notificacion = {
      ...notificacionData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      leida: false,
      createdAt: new Date().toISOString(),
    };

    setNotificaciones(prev => {
      const nuevas = [...prev, nuevaNotificacion];
      // Crear tarea automáticamente después de agregar la notificación
      setTimeout(() => {
        const tareaExistente = tareas.find(t => t.notificacionId === nuevaNotificacion.id);
        if (!tareaExistente) {
          const nuevaTarea: Tarea = {
            id: `tarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            notificacionId: nuevaNotificacion.id,
            usuarioId: nuevaNotificacion.usuarioId,
            procesoId: nuevaNotificacion.procesoId,
            titulo: nuevaNotificacion.titulo,
            descripcion: nuevaNotificacion.mensaje,
            estado: 'pendiente',
            prioridad: nuevaNotificacion.tipo.includes('rechazado') || nuevaNotificacion.tipo.includes('observaciones') ? 'alta' : 'media',
            completada: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setTareas(prevTareas => [...prevTareas, nuevaTarea]);
        }
      }, 100);
      return nuevas;
    });
  }, [tareas]);

  const crearTareaDesdeNotificacion = useCallback((notificacionId: string) => {
    const notificacion = notificaciones.find(n => n.id === notificacionId);
    if (!notificacion || notificacion.leida) return;

    // Verificar si ya existe una tarea para esta notificación
    const tareaExistente = tareas.find(t => t.notificacionId === notificacionId);
    if (tareaExistente) return;

    const nuevaTarea: Tarea = {
      id: `tarea-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notificacionId,
      usuarioId: notificacion.usuarioId,
      procesoId: notificacion.procesoId,
      titulo: notificacion.titulo,
      descripcion: notificacion.mensaje,
      estado: 'pendiente',
      prioridad: notificacion.tipo.includes('rechazado') || notificacion.tipo.includes('observaciones') ? 'alta' : 'media',
      completada: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTareas(prev => [...prev, nuevaTarea]);
  }, [notificaciones, tareas]);

  const obtenerNotificaciones = useCallback(() => {
    return notificaciones;
  }, [notificaciones]);

  const obtenerTareas = useCallback(() => {
    return tareas;
  }, [tareas]);

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
  const tareasPendientes = tareas.filter(t => !t.completada && t.estado !== 'cancelada').length;

  return (
    <NotificacionContext.Provider
      value={{
        notificaciones,
        tareas,
        notificacionesNoLeidas,
        tareasPendientes,
        marcarNotificacionLeida,
        marcarTareaCompletada,
        crearNotificacion,
        crearTareaDesdeNotificacion,
        obtenerNotificaciones,
        obtenerTareas,
        showSuccess,
        showError
      }}
    >
      {children}
      {/* Modal de notificación: animado, barra de tiempo en éxito, error solo Aceptar */}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            minWidth: { xs: 280, sm: 380 },
            maxWidth: '90vw',
            '@keyframes modalEnter': {
              '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.92)' },
              '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            },
            animation: 'modalEnter 0.25s ease-out',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              border: '1px solid',
              borderColor: snackbarSeverity === 'success'
                ? theme.palette.success.main
                : theme.palette.error.main,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {snackbarSeverity === 'success' ? (
                  <CheckCircleIcon sx={{ fontSize: 32, color: theme.palette.success.main, flexShrink: 0 }} />
                ) : (
                  <ErrorOutlineIcon sx={{ fontSize: 32, color: theme.palette.error.main, flexShrink: 0 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                    {snackbarSeverity === 'success' ? 'Operación exitosa' : 'Error'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {snackbarMessage}
                  </Typography>
                </Box>
              </Box>
              {snackbarSeverity === 'success' && (
                <LinearProgress
                  variant="determinate"
                  value={successProgress}
                  sx={{
                    mt: 2,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.palette.success.light,
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.success.main },
                  }}
                />
              )}
              <Button
                variant="contained"
                size="medium"
                fullWidth
                onClick={handleSnackbarClose}
                sx={{
                  mt: 3,
                  ...(snackbarSeverity === 'success'
                    ? { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }
                    : { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText }),
                }}
              >
                Aceptar
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      {/* Backdrop: en error no cerrar al hacer clic, solo con botón */}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 9999,
            '@keyframes backdropIn': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
            animation: 'backdropIn 0.2s ease-out',
          }}
          onClick={snackbarSeverity === 'success' ? handleSnackbarClose : undefined}
        />
      )}
    </NotificacionContext.Provider>
  );
}

export function useNotificacion() {
  const context = useContext(NotificacionContext);
  if (context === undefined) {
    throw new Error('useNotificacion must be used within a NotificacionProvider');
  }
  return context;
}

