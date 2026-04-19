import { useState } from 'react';
import { useProceso } from '../contexts/ProcesoContext';
import { useNotification } from './useNotification';
import { useUpdateProcesoMutation } from '../api/services/riesgosApi';
import type { ObservacionProceso, HistorialCambioProceso } from '../types';

export const useRevisionProceso = () => {
  const { procesoSeleccionado } = useProceso();
  const { showSuccess, showError } = useNotification();
  const [updateProcesoMutation] = useUpdateProcesoMutation();
  const [loading, setLoading] = useState(false);
  const [observaciones, setObservaciones] = useState<Record<string, ObservacionProceso[]>>({});
  const [historial, setHistorial] = useState<Record<string, HistorialCambioProceso[]>>({});

  const enviarARevision = async (proceso: any, gerenteId: string, gerenteNombre: string) => {
    if (!proceso) return;
    setLoading(true);
    try {
      await updateProcesoMutation({
        id: String(proceso.id),
        estado: 'en_revision',
        gerenteId,
        gerenteNombre,
      } as any).unwrap();

      const cambio: HistorialCambioProceso = {
        id: Date.now().toString(),
        procesoId: String(proceso.id),
        tipo: 'envio_revision',
        mensaje: `Proceso enviado a revisión por ${proceso.responsableNombre || 'Dueño del Proceso'}`,
        fecha: new Date().toISOString(),
        usuarioId: String(proceso.responsableId ?? ''),
        usuarioNombre: proceso.responsableNombre || 'Dueño del Proceso',
      };
      setHistorial((prev) => ({
        ...prev,
        [String(proceso.id)]: [...(prev[String(proceso.id)] || []), cambio],
      }));

      showSuccess('Proceso enviado a revisión');
      return { ...proceso, estado: 'en_revision', gerenteId, gerenteNombre };
    } catch {
      showError('Error al enviar a revisión');
    } finally {
      setLoading(false);
    }
  };

  const aprobarProceso = async () => {
    if (!procesoSeleccionado) return;
    setLoading(true);
    try {
      await updateProcesoMutation({
        id: String(procesoSeleccionado.id),
        estado: 'aprobado',
      } as any).unwrap();

      const cambio: HistorialCambioProceso = {
        id: Date.now().toString(),
        procesoId: String(procesoSeleccionado.id),
        tipo: 'aprobacion',
        mensaje: 'Proceso aprobado por el gerente',
        fecha: new Date().toISOString(),
        usuarioId: String(procesoSeleccionado.gerenteId ?? ''),
        usuarioNombre: procesoSeleccionado.gerenteNombre || 'Gerente',
      };
      setHistorial((prev) => ({
        ...prev,
        [String(procesoSeleccionado.id)]: [...(prev[String(procesoSeleccionado.id)] || []), cambio],
      }));

      showSuccess('Proceso aprobado exitosamente');
    } catch {
      showError('Error al aprobar proceso');
    } finally {
      setLoading(false);
    }
  };

  const rechazarConObservaciones = async (
    procesoId: string,
    observacion: string,
    usuarioId: string,
    usuarioNombre: string
  ) => {
    setLoading(true);
    try {
      await updateProcesoMutation({
        id: String(procesoId),
        estado: 'con_observaciones',
      } as any).unwrap();

      const nuevaObservacion: ObservacionProceso = {
        id: Date.now().toString(),
        procesoId,
        texto: observacion,
        fecha: new Date().toISOString(),
        usuarioId,
        usuarioNombre,
        resuelta: false,
      };
      setObservaciones((prev) => ({
        ...prev,
        [procesoId]: [...(prev[procesoId] || []), nuevaObservacion],
      }));

      const cambio: HistorialCambioProceso = {
        id: (Date.now() + 1).toString(),
        procesoId,
        tipo: 'rechazo',
        mensaje: `Proceso rechazado con observaciones: ${observacion}`,
        fecha: new Date().toISOString(),
        usuarioId,
        usuarioNombre,
      };
      setHistorial((prev) => ({
        ...prev,
        [procesoId]: [...(prev[procesoId] || []), cambio],
      }));

      showSuccess('Observaciones enviadas');
    } catch {
      showError('Error al enviar observaciones');
    } finally {
      setLoading(false);
    }
  };

  const resolverObservaciones = async (procesoId: string) => {
    setLoading(true);
    try {
      setObservaciones((prev) => ({
        ...prev,
        [procesoId]: (prev[procesoId] || []).map((obs) => ({ ...obs, resuelta: true })),
      }));

      const cambio: HistorialCambioProceso = {
        id: Date.now().toString(),
        procesoId,
        tipo: 'resolucion',
        mensaje: 'Observaciones resueltas por el dueño del proceso',
        fecha: new Date().toISOString(),
        usuarioId: '',
        usuarioNombre: 'Dueño del Proceso',
      };
      setHistorial((prev) => ({
        ...prev,
        [procesoId]: [...(prev[procesoId] || []), cambio],
      }));

      showSuccess('Observaciones resueltas');
    } catch {
      showError('Error al resolver observaciones');
    } finally {
      setLoading(false);
    }
  };

  const obtenerObservaciones = (procesoId: string): ObservacionProceso[] => {
    return observaciones[procesoId] || [];
  };

  const obtenerHistorial = (procesoId: string): HistorialCambioProceso[] => {
    return historial[procesoId] || [];
  };

  return {
    enviarARevision,
    aprobarProceso,
    rechazarConObservaciones,
    resolverObservaciones,
    obtenerObservaciones,
    obtenerHistorial,
    loading,
  };
};
