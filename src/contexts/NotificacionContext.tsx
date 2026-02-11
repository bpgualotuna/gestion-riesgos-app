/**
 * Notificación Context
 * Manages notifications and tasks for the review and approval workflow
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Notificacion, Tarea } from '../types';
import { useAuth } from "./AuthContext";
import { useTheme } from '@mui/material/styles';

import { Snackbar, Alert, Box, Paper, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

  const showSuccess = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, []);

  const showError = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Auto-close after 1 second
  useEffect(() => {
    if (snackbarOpen) {
      const timer = setTimeout(() => {
        setSnackbarOpen(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [snackbarOpen]);

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
      {/* Custom Alert Overlay */}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            animation: 'slideInBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            '@keyframes slideInBounce': {
              '0%': {
                opacity: 0,
                transform: 'translate(-50%, -60%) scale(0.7)',
              },
              '100%': {
                opacity: 1,
                transform: 'translate(-50%, -50%) scale(1)',
              }
            },
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' }
            }
          }}
        >
          <Paper
            elevation={24}
            sx={{
              minWidth: 400,
              background: snackbarSeverity === 'success'
                ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.error.light} 0%, ${theme.palette.error.main} 100%)`,
              borderRadius: 4,
              p: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                animation: 'shimmer 1.5s infinite',
              },
              '@keyframes shimmer': {
                '0%': { left: '-100%' },
                '100%': { left: '100%' }
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                position: 'relative',
                zIndex: 1
              }}
            >
              {/* Animated Icon */}
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '50%',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1s ease-in-out infinite',
                  boxShadow: '0 0 20px rgba(255,255,255,0.5)'
                }}
              >
                {snackbarSeverity === 'success' ? (
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#fff' }} />
                ) : (
                  <Alert severity="error" sx={{ fontSize: 48, color: '#fff' }} />
                )}
              </Box>

              {/* Message */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    letterSpacing: '0.5px'
                  }}
                >
                  {snackbarMessage}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    mt: 0.5,
                    fontWeight: 500
                  }}
                >
                  {snackbarSeverity === 'success' ? '¡Operación exitosa!' : 'Ocurrió un error'}
                </Typography>
              </Box>
            </Box>

            {/* Progress bar */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                width: '100%',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  backgroundColor: '#fff',
                  animation: 'progress 1s linear',
                  '@keyframes progress': {
                    '0%': { width: '100%' },
                    '100%': { width: '0%' }
                  }
                }}
              />
            </Box>
          </Paper>
        </Box>
      )}
      {/* Backdrop */}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            animation: 'fadeInBackdrop 0.3s ease-in-out',
            '@keyframes fadeInBackdrop': {
              from: { opacity: 0 },
              to: { opacity: 1 }
            }
          }}
          onClick={handleSnackbarClose}
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

