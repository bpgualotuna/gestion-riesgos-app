import { useState } from 'react';
import { useProceso } from '../contexts/ProcesoContext';
import { useNotification } from './useNotification';
import type { ObservacionProceso, HistorialCambioProceso } from '../types';

export const useRevisionProceso = () => {
    const { procesoSeleccionado, updateProceso } = useProceso();
    const { notificar } = useNotification();
    const [loading, setLoading] = useState(false);
    const [observaciones, setObservaciones] = useState<Record<string, ObservacionProceso[]>>({});
    const [historial, setHistorial] = useState<Record<string, HistorialCambioProceso[]>>({});

    const enviarARevision = async (proceso: any, gerenteId: string, gerenteNombre: string) => {
        if (!proceso) return;
        setLoading(true);
        try {
            await updateProceso(proceso.id, { estado: 'en_revision', gerenteId, gerenteNombre });
            
            // Agregar al historial
            const cambio: HistorialCambioProceso = {
                id: Date.now().toString(),
                procesoId: proceso.id,
                tipo: 'envio_revision',
                mensaje: `Proceso enviado a revisión por ${proceso.responsableNombre || 'Dueño del Proceso'}`,
                fecha: new Date().toISOString(),
                usuarioId: proceso.responsableId,
                usuarioNombre: proceso.responsableNombre || 'Dueño del Proceso',
            };
            setHistorial(prev => ({
                ...prev,
                [proceso.id]: [...(prev[proceso.id] || []), cambio]
            }));
            
            notificar('Proceso enviado a revisión', 'success');
            return { ...proceso, estado: 'en_revision', gerenteId, gerenteNombre };
        } catch (error) {
            notificar('Error al enviar a revisión', 'error');
        } finally {
            setLoading(false);
        }
    };

    const aprobarProceso = async () => {
        if (!procesoSeleccionado) return;
        setLoading(true);
        try {
            await updateProceso(procesoSeleccionado.id, { estado: 'aprobado' });
            
            // Agregar al historial
            const cambio: HistorialCambioProceso = {
                id: Date.now().toString(),
                procesoId: procesoSeleccionado.id,
                tipo: 'aprobacion',
                mensaje: 'Proceso aprobado por el gerente',
                fecha: new Date().toISOString(),
                usuarioId: procesoSeleccionado.gerenteId || '',
                usuarioNombre: procesoSeleccionado.gerenteNombre || 'Gerente',
            };
            setHistorial(prev => ({
                ...prev,
                [procesoSeleccionado.id]: [...(prev[procesoSeleccionado.id] || []), cambio]
            }));
            
            notificar('Proceso aprobado exitosamente', 'success');
        } catch (error) {
            notificar('Error al aprobar proceso', 'error');
        } finally {
            setLoading(false);
        }
    };

    const rechazarConObservaciones = async (procesoId: string, observacion: string, usuarioId: string, usuarioNombre: string) => {
        setLoading(true);
        try {
            await updateProceso(procesoId, { estado: 'con_observaciones' });
            
            // Agregar observación
            const nuevaObservacion: ObservacionProceso = {
                id: Date.now().toString(),
                procesoId,
                texto: observacion,
                fecha: new Date().toISOString(),
                usuarioId,
                usuarioNombre,
                resuelta: false,
            };
            setObservaciones(prev => ({
                ...prev,
                [procesoId]: [...(prev[procesoId] || []), nuevaObservacion]
            }));
            
            // Agregar al historial
            const cambio: HistorialCambioProceso = {
                id: (Date.now() + 1).toString(),
                procesoId,
                tipo: 'rechazo',
                mensaje: `Proceso rechazado con observaciones: ${observacion}`,
                fecha: new Date().toISOString(),
                usuarioId,
                usuarioNombre,
            };
            setHistorial(prev => ({
                ...prev,
                [procesoId]: [...(prev[procesoId] || []), cambio]
            }));
            
            notificar('Observaciones enviadas', 'success');
        } catch (error) {
            notificar('Error al enviar observaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resolverObservaciones = async (procesoId: string) => {
        setLoading(true);
        try {
            // Marcar todas las observaciones como resueltas
            setObservaciones(prev => ({
                ...prev,
                [procesoId]: (prev[procesoId] || []).map(obs => ({ ...obs, resuelta: true }))
            }));
            
            // Agregar al historial
            const cambio: HistorialCambioProceso = {
                id: Date.now().toString(),
                procesoId,
                tipo: 'resolucion',
                mensaje: 'Observaciones resueltas por el dueño del proceso',
                fecha: new Date().toISOString(),
                usuarioId: '',
                usuarioNombre: 'Dueño del Proceso',
            };
            setHistorial(prev => ({
                ...prev,
                [procesoId]: [...(prev[procesoId] || []), cambio]
            }));
            
            notificar('Observaciones resueltas', 'success');
        } catch (error) {
            notificar('Error al resolver observaciones', 'error');
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
        loading
    };
};
