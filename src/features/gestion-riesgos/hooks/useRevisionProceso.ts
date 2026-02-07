/**
 * Hook para manejar el flujo de revisión y aprobación de procesos
 */

import { useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotificacion } from '../../../shared/contexts/NotificacionContext';
import { useNotification } from '../../../shared/hooks/useNotification';
import { useProceso } from '../../../contexts/ProcesoContext';
import { 
  useUpdateProcesoMutation,
  useGetObservacionesQuery,
  useCreateObservacionMutation,
  useUpdateObservacionMutation,
  useGetHistorialQuery,
  useCreateHistorialMutation,
} from '../api/riesgosApi';
import type { 
  Proceso, 
  EstadoProceso, 
  ObservacionProceso, 
  HistorialCambioProceso 
} from '../types';

export function useRevisionProceso() {
  const { user } = useAuth();
  const { crearNotificacion } = useNotificacion();
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, setProcesoSeleccionado } = useProceso();
  const [updateProceso] = useUpdateProcesoMutation();
  const [createObservacion] = useCreateObservacionMutation();
  const [updateObservacion] = useUpdateObservacionMutation();
  const [createHistorial] = useCreateHistorialMutation();

  // Obtener observaciones de un proceso (usando query hook)
  const obtenerObservaciones = useCallback((procesoId: string): ObservacionProceso[] => {
    // Esto se debe usar con el hook useGetObservacionesQuery en el componente
    // Por ahora mantenemos compatibilidad con localStorage como fallback
    const stored = localStorage.getItem('observaciones_procesos');
    if (!stored) return [];
    const todas: ObservacionProceso[] = JSON.parse(stored);
    return todas.filter(o => o.procesoId === procesoId && !o.resuelta);
  }, []);

  // Obtener historial de un proceso (usando query hook)
  const obtenerHistorial = useCallback((procesoId: string): HistorialCambioProceso[] => {
    // Esto se debe usar con el hook useGetHistorialQuery en el componente
    // Por ahora mantenemos compatibilidad con localStorage como fallback
    const stored = localStorage.getItem('historial_cambios_procesos');
    if (!stored) return [];
    const todo: HistorialCambioProceso[] = JSON.parse(stored);
    return todo.filter(h => h.procesoId === procesoId).sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, []);

  // Registrar cambio en historial
  const registrarHistorial = useCallback(async (
    proceso: Proceso,
    accion: HistorialCambioProceso['accion'],
    descripcion: string,
    cambios?: Record<string, { anterior: any; nuevo: any }>
  ) => {
    if (!user) return;

    const historial: HistorialCambioProceso = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      procesoId: proceso.id,
      usuarioId: user.id,
      usuarioNombre: user.fullName,
      accion,
      descripcion,
      cambios,
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      // Intentar guardar en JSON Server
      await createHistorial(historial).unwrap();
    } catch (error) {
      // Fallback a localStorage si el servidor no está disponible
      const stored = localStorage.getItem('historial_cambios_procesos');
      const todo: HistorialCambioProceso[] = stored ? JSON.parse(stored) : [];
      todo.push(historial);
      localStorage.setItem('historial_cambios_procesos', JSON.stringify(todo));
    }
  }, [user, createHistorial]);

  // Enviar proceso a revisión
  const enviarARevision = useCallback(async (proceso: Proceso, gerenteId: string, gerenteNombre: string) => {
    if (!user) {
      showError('Debe estar autenticado para realizar esta acción');
      return proceso;
    }

    // Actualizar proceso usando RTK Query
    try {
      await updateProceso({
        id: proceso.id,
        estado: 'en_revision',
      }).unwrap();

      const procesoActualizado: Proceso = {
        ...proceso,
        estado: 'en_revision',
        gerenteId,
        gerenteNombre,
        fechaEnviadoRevision: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Registrar en historial
      registrarHistorial(
        procesoActualizado,
        'enviado_revision',
        `Proceso enviado a revisión por ${user.fullName}`
      );

      // Crear notificación para el gerente
      crearNotificacion({
        usuarioId: gerenteId,
        tipo: 'proceso_enviado_revision',
        titulo: 'Proceso enviado a revisión',
        mensaje: `El proceso "${proceso.nombre}" ha sido enviado a revisión por ${user.fullName}`,
        procesoId: proceso.id,
      });

      showSuccess('Proceso enviado a revisión. El gerente recibirá una notificación.');
      
      // Actualizar proceso seleccionado si es el mismo
      if (procesoSeleccionado?.id === proceso.id) {
        setProcesoSeleccionado(procesoActualizado);
      }
      
      return procesoActualizado;
    } catch (error) {
      showError('Error al enviar el proceso a revisión');
      return proceso;
    }
  }, [user, crearNotificacion, registrarHistorial, updateProceso, procesoSeleccionado, setProcesoSeleccionado, showSuccess, showError]);

  // Aprobar proceso
  const aprobarProceso = useCallback(async (proceso: Proceso) => {
    if (!user) {
      showError('Debe estar autenticado para realizar esta acción');
      return proceso;
    }

    try {
      // Actualizar proceso usando RTK Query
      await updateProceso({
        id: proceso.id,
        estado: 'aprobado',
      }).unwrap();

      const procesoActualizado: Proceso = {
        ...proceso,
        estado: 'aprobado',
        fechaAprobado: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Registrar en historial
      registrarHistorial(
        procesoActualizado,
        'aprobado',
        `Proceso aprobado por ${user.fullName}`
      );

      // Crear notificación para el dueño
      if (proceso.responsableId) {
        crearNotificacion({
          usuarioId: proceso.responsableId,
          tipo: 'proceso_aprobado',
          titulo: 'Proceso aprobado',
          mensaje: `El proceso "${proceso.nombre}" ha sido aprobado por ${user.fullName}`,
          procesoId: proceso.id,
        });
      }

      showSuccess('Proceso aprobado exitosamente. El dueño recibirá una notificación.');
      
      // Actualizar proceso seleccionado si es el mismo
      if (procesoSeleccionado?.id === proceso.id) {
        setProcesoSeleccionado(procesoActualizado);
      }
      
      return procesoActualizado;
    } catch (error) {
      showError('Error al aprobar el proceso');
      return proceso;
    }
  }, [user, crearNotificacion, registrarHistorial, updateProceso, procesoSeleccionado, setProcesoSeleccionado, showSuccess, showError]);

  // Rechazar proceso con observaciones
  const rechazarConObservaciones = useCallback(async (
    proceso: Proceso,
    observacion: string
  ) => {
    if (!user) {
      showError('Debe estar autenticado para realizar esta acción');
      return;
    }

    try {

    // Crear observación
    const nuevaObservacion: ObservacionProceso = {
      id: `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      procesoId: proceso.id,
      gerenteId: user.id,
      gerenteNombre: user.fullName,
      observacion,
      fecha: new Date().toISOString(),
      resuelta: false,
      createdAt: new Date().toISOString(),
    };

    try {
      // Intentar guardar en JSON Server
      await createObservacion(nuevaObservacion).unwrap();
    } catch (error) {
      // Fallback a localStorage si el servidor no está disponible
      const stored = localStorage.getItem('observaciones_procesos');
      const todas: ObservacionProceso[] = stored ? JSON.parse(stored) : [];
      todas.push(nuevaObservacion);
      localStorage.setItem('observaciones_procesos', JSON.stringify(todas));
    }

      // Actualizar proceso usando RTK Query
      await updateProceso({
        id: proceso.id,
        estado: 'con_observaciones',
      }).unwrap();

      const procesoActualizado: Proceso = {
        ...proceso,
        estado: 'con_observaciones',
        updatedAt: new Date().toISOString(),
      };

    // Registrar en historial
    registrarHistorial(
      procesoActualizado,
      'observaciones_agregadas',
      `Observaciones agregadas por ${user.fullName}`,
      { observacion: { anterior: null, nuevo: observacion } }
    );

    // Crear notificación para el dueño
    if (proceso.responsableId) {
      crearNotificacion({
        usuarioId: proceso.responsableId,
        tipo: 'observaciones_agregadas',
        titulo: 'Observaciones en proceso',
        mensaje: `El proceso "${proceso.nombre}" tiene observaciones de ${user.fullName}. Por favor revise y corrija.`,
        procesoId: proceso.id,
        observacionId: nuevaObservacion.id,
      });
    }

      showSuccess('Observaciones agregadas. El dueño recibirá una notificación.');
      
      // Actualizar proceso seleccionado si es el mismo
      if (procesoSeleccionado?.id === proceso.id) {
        setProcesoSeleccionado(procesoActualizado);
      }
      
      return { proceso: procesoActualizado, observacion: nuevaObservacion };
    } catch (error) {
      showError('Error al rechazar el proceso con observaciones');
      return { proceso, observacion: null as any };
    }
  }, [user, crearNotificacion, registrarHistorial, updateProceso, procesoSeleccionado, setProcesoSeleccionado, showSuccess, showError]);

  // Resolver observaciones
  const resolverObservaciones = useCallback(async (proceso: Proceso, observacionIds: string[]) => {
    if (!user) {
      showError('Debe estar autenticado para realizar esta acción');
      return proceso;
    }

    try {

    // Marcar observaciones como resueltas
    try {
      // Intentar actualizar en JSON Server
      for (const obsId of observacionIds) {
        await updateObservacion({
          id: obsId,
          resuelta: true,
          fechaResuelta: new Date().toISOString(),
        }).unwrap();
      }
    } catch (error) {
      // Fallback a localStorage si el servidor no está disponible
      const stored = localStorage.getItem('observaciones_procesos');
      if (stored) {
        const todas: ObservacionProceso[] = JSON.parse(stored);
        const actualizadas = todas.map(obs => 
          observacionIds.includes(obs.id)
            ? { ...obs, resuelta: true, fechaResuelta: new Date().toISOString() }
            : obs
        );
        localStorage.setItem('observaciones_procesos', JSON.stringify(actualizadas));
      }
    }

      // Verificar si todas las observaciones están resueltas
      const observacionesPendientes = obtenerObservaciones(proceso.id);
      const nuevoEstado: EstadoProceso = observacionesPendientes.length === 0 
        ? 'borrador' 
        : 'con_observaciones';

      // Actualizar proceso usando RTK Query
      await updateProceso({
        id: proceso.id,
        estado: nuevoEstado,
      }).unwrap();

      const procesoActualizado: Proceso = {
        ...proceso,
        estado: nuevoEstado,
        updatedAt: new Date().toISOString(),
      };

      // Registrar en historial con detalles de las observaciones resueltas
      const observacionesResueltas = obtenerObservaciones(proceso.id)
        .filter(obs => observacionIds.includes(obs.id))
        .map(obs => obs.observacion);
      
      registrarHistorial(
        procesoActualizado,
        'observaciones_resueltas',
        `Observaciones resueltas por ${user.fullName}. ${observacionesResueltas.length} observación(es) resuelta(s)`,
        {
          observaciones_resueltas: {
            anterior: observacionesResueltas,
            nuevo: [],
          },
          estado: {
            anterior: proceso.estado,
            nuevo: nuevoEstado,
          },
        }
      );

    // Si todas están resueltas, notificar al gerente
    if (nuevoEstado === 'borrador' && proceso.gerenteId) {
      crearNotificacion({
        usuarioId: proceso.gerenteId,
        tipo: 'observaciones_resueltas',
        titulo: 'Observaciones resueltas',
        mensaje: `Todas las observaciones del proceso "${proceso.nombre}" han sido resueltas por ${user.fullName}`,
        procesoId: proceso.id,
      });
    }

      showSuccess('Observaciones resueltas exitosamente.');
      
      // Actualizar proceso seleccionado si es el mismo
      if (procesoSeleccionado?.id === proceso.id) {
        setProcesoSeleccionado(procesoActualizado);
      }
      
      return procesoActualizado;
    } catch (error) {
      showError('Error al resolver las observaciones');
      return proceso;
    }
  }, [user, crearNotificacion, registrarHistorial, obtenerObservaciones, updateProceso, procesoSeleccionado, setProcesoSeleccionado, showSuccess, showError]);

  return {
    enviarARevision,
    aprobarProceso,
    rechazarConObservaciones,
    resolverObservaciones,
    obtenerObservaciones,
    obtenerHistorial,
  };
}

