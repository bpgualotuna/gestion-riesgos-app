/**
 * Hook para gestionar el historial de cambios de procesos
 * Permite registrar y consultar cambios en: ficha, análisis, normatividad, contexto, DOFA, benchmarking
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { HistorialCambio } from '../types';

export function useHistorialCambios() {
  const { user } = useAuth();

  /**
   * Registra un cambio en el historial
   */
  const registrarCambio = useCallback(
    (params: {
      procesoId: string;
      procesoNombre: string;
      seccion: HistorialCambio['seccion'];
      accion: HistorialCambio['accion'];
      camposModificados: string[];
      valoresAnteriores?: Record<string, any>;
      valoresNuevos?: Record<string, any>;
      razonCambio?: string;
    }) => {
      const historialRaw = localStorage.getItem('historial_cambios');
      const historial: HistorialCambio[] = historialRaw ? JSON.parse(historialRaw) : [];

      const nuevoCambio: HistorialCambio = {
        id: `cambio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        procesoId: params.procesoId,
        procesoNombre: params.procesoNombre,
        seccion: params.seccion,
        accion: params.accion,
        camposModificados: params.camposModificados,
        valoresAnteriores: params.valoresAnteriores,
        valoresNuevos: params.valoresNuevos,
        razonCambio: params.razonCambio,
        usuarioId: user?.id || 'system',
        usuarioNombre: user?.fullName || 'Sistema',
        fecha: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      historial.push(nuevoCambio);
      localStorage.setItem('historial_cambios', JSON.stringify(historial));

      return nuevoCambio;
    },
    [user]
  );

  /**
   * Obtiene el historial completo
   */
  const obtenerHistorial = useCallback((): HistorialCambio[] => {
    const historialRaw = localStorage.getItem('historial_cambios');
    return historialRaw ? JSON.parse(historialRaw) : [];
  }, []);

  /**
   * Obtiene el historial filtrado por proceso
   */
  const obtenerHistorialPorProceso = useCallback((procesoId: string): HistorialCambio[] => {
    const historial = obtenerHistorial();
    return historial.filter((cambio) => cambio.procesoId === procesoId);
  }, [obtenerHistorial]);

  /**
   * Obtiene el historial filtrado por sección
   */
  const obtenerHistorialPorSeccion = useCallback(
    (procesoId: string, seccion: HistorialCambio['seccion']): HistorialCambio[] => {
      const historial = obtenerHistorialPorProceso(procesoId);
      return historial.filter((cambio) => cambio.seccion === seccion);
    },
    [obtenerHistorialPorProceso]
  );

  /**
   * Obtiene los últimos N cambios de un proceso
   */
  const obtenerUltimosCambios = useCallback(
    (procesoId: string, limite: number = 10): HistorialCambio[] => {
      const historial = obtenerHistorialPorProceso(procesoId);
      return historial
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, limite);
    },
    [obtenerHistorialPorProceso]
  );

  /**
   * Compara valores antiguos y nuevos para detectar cambios
   */
  const detectarCambios = useCallback(
    (valoresAnteriores: Record<string, any>, valoresNuevos: Record<string, any>): string[] => {
      const camposModificados: string[] = [];
      const todasLasClaves = new Set([
        ...Object.keys(valoresAnteriores),
        ...Object.keys(valoresNuevos),
      ]);

      for (const clave of todasLasClaves) {
        const valorAnterior = valoresAnteriores[clave];
        const valorNuevo = valoresNuevos[clave];

        // Comparar valores (soporta objetos y arrays)
        if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
          camposModificados.push(clave);
        }
      }

      return camposModificados;
    },
    []
  );

  /**
   * Registra cambios detectando automáticamente los campos modificados
   */
  const registrarCambioAutomatico = useCallback(
    (params: {
      procesoId: string;
      procesoNombre: string;
      seccion: HistorialCambio['seccion'];
      accion: HistorialCambio['accion'];
      valoresAnteriores: Record<string, any>;
      valoresNuevos: Record<string, any>;
      razonCambio?: string;
    }) => {
      const camposModificados = detectarCambios(params.valoresAnteriores, params.valoresNuevos);

      // Solo registrar si hay cambios
      if (camposModificados.length === 0 && params.accion === 'editar') {
        return null;
      }

      return registrarCambio({
        procesoId: params.procesoId,
        procesoNombre: params.procesoNombre,
        seccion: params.seccion,
        accion: params.accion,
        camposModificados,
        valoresAnteriores: params.valoresAnteriores,
        valoresNuevos: params.valoresNuevos,
        razonCambio: params.razonCambio,
      });
    },
    [detectarCambios, registrarCambio]
  );

  /**
   * Limpia el historial completo (solo para administradores)
   */
  const limpiarHistorial = useCallback(() => {
    localStorage.removeItem('historial_cambios');
  }, []);

  /**
   * Exporta el historial a JSON
   */
  const exportarHistorial = useCallback((procesoId?: string): string => {
    const historial = procesoId ? obtenerHistorialPorProceso(procesoId) : obtenerHistorial();
    return JSON.stringify(historial, null, 2);
  }, [obtenerHistorial, obtenerHistorialPorProceso]);

  return {
    registrarCambio,
    registrarCambioAutomatico,
    obtenerHistorial,
    obtenerHistorialPorProceso,
    obtenerHistorialPorSeccion,
    obtenerUltimosCambios,
    detectarCambios,
    limpiarHistorial,
    exportarHistorial,
  };
}
