/**
 * Notificación Context
 * Manages notifications and tasks for the review and approval workflow
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Notificacion, Tarea } from '../types';
import { useAuth } from "./AuthContext";

import { Snackbar, Alert } from '@mui/material';

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
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
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

