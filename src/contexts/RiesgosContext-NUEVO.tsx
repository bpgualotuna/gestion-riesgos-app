/**
 * 🎯 RiesgosContext - ACTUALIZADO CON API
 * Gestiona toda la lógica de riesgos, evaluaciones y sus relaciones
 * ELIMINA completion localStorage y usa API real
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

// ============================================
// TIPOS
// ============================================

interface Riesgo {
  id: number
  procesoId: number
  numero: number
  numeroIdentificacion?: string
  descripcion: string
  clasificacion?: string
  zona?: string
  tipologiaNivelI?: string
  tipologiaNivelII?: string
  causaRiesgo?: string
  fuenteCausa?: string
  origen?: string
  gerencia?: string
  siglaGerencia?: string
  createdAt: string
  updatedAt: string
  evaluacion?: any
}

interface RiesgosContextType {
  // Estado
  riesgos: Riesgo[]
  loading: boolean
  error: string | null

  // Acciones
  cargarRiesgos: (filtros?: any) => Promise<void>
  crearRiesgo: (data: any) => Promise<Riesgo>
  actualizarRiesgo: (id: number, data: any) => Promise<Riesgo>
  eliminarRiesgo: (id: number) => Promise<void>
  obtenerRiesgoDetalle: (id: number) => Promise<Riesgo>
  refrescar: () => Promise<void>
}

// ============================================
// CONTEXTO
// ============================================

const RiesgosContext = createContext<RiesgosContextType | undefined>(undefined)

interface RiesgosProviderProps {
  children: ReactNode
}

export function RiesgosProvider({ children }: RiesgosProviderProps) {
  const [riesgos, setRiesgos] = useState<Riesgo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // CARGAR RIESGOS
  // OPTIMIZADO: Acepta procesoId para filtrar desde el backend
  // ============================================

  const cargarRiesgos = useCallback(async (filtros?: any) => {
    try {
      setLoading(true)
      setError(null)

      // OPTIMIZADO: Siempre incluir causas y filtrar por procesoId si se proporciona
      const filtrosOptimizados: any = { 
        ...filtros, 
        includeCausas: 'true' 
      };

      // Llamar a API con filtros optimizados - el backend filtrará por procesoId
      const respuesta = await api.riesgos.getAll(filtrosOptimizados)

      // La API retorna { data: [...], total, page, pageSize } o solo [...]
      const arregloRiesgos = respuesta.data || respuesta
      setRiesgos(arregloRiesgos)
    } catch (err: any) {
      const mensaje = err.message || 'Error cargando riesgos'
      setError(mensaje)
    } finally {
      setLoading(false)
    }
  }, [])

  // ============================================
  // CREAR RIESGOS
  // ============================================

  const crearRiesgo = useCallback(async (data: any): Promise<Riesgo> => {
    try {
      setError(null)
      const nuevoRiesgo = await api.riesgos.create(data)
      await cargarRiesgos()
      return nuevoRiesgo
    } catch (err: any) {
      const mensaje = err.message || 'Error creando riesgo'
      setError(mensaje)
      throw err
    }
  }, [cargarRiesgos])

  // ============================================
  // ACTUALIZAR RIESGOS
  // ============================================

  const actualizarRiesgo = useCallback(async (id: number, data: any): Promise<Riesgo> => {
    try {
      setError(null)
      const actualizado = await api.riesgos.update(id, data)

      // Actualizar en estado local (solo si el riesgo existe en el estado actual)
      setRiesgos(prevRiesgos => {
        const existe = prevRiesgos.some(r => r.id === id);
        if (existe) {
          return prevRiesgos.map(r => r.id === id ? actualizado : r);
        }
        // Si no existe, no agregarlo (puede ser de otro proceso)
        return prevRiesgos;
      })
      return actualizado
    } catch (err: any) {
      const mensaje = err.message || 'Error actualizando riesgo'
      setError(mensaje)
      throw err
    }
  }, [riesgos])

  // ============================================
  // ELIMINAR RIESGOS
  // ============================================

  const eliminarRiesgo = useCallback(async (id: number) => {
    try {
      setError(null)
      await api.riesgos.delete(id)
      setRiesgos(riesgos.filter(r => r.id !== id))
    } catch (err: any) {
      const mensaje = err.message || 'Error eliminando riesgo'
      setError(mensaje)
      throw err
    }
  }, [riesgos])

  // ============================================
  // OBTENER DETALLE
  // ============================================

  const obtenerRiesgoDetalle = useCallback(async (id: number): Promise<Riesgo> => {
    try {
      const riesgo = await api.riesgos.getById(id)
      return riesgo
    } catch (err: any) {
      const mensaje = err.message || `Error obteniendo riesgo ${id}`
      setError(mensaje)
      throw err
    }
  }, [])

  // ============================================
  // REFRESCAR
  // ============================================

  const refrescar = useCallback(async () => {
    await cargarRiesgos()
  }, [cargarRiesgos])

  // ============================================
  // CARGAR AL MONTAR
  // OPTIMIZADO: No cargar automáticamente - dejar que cada página decida cuándo cargar
  // Esto evita cargar datos innecesarios
  // ============================================

  // Removido: useEffect que cargaba automáticamente
  // Ahora cada página carga solo cuando lo necesita y con los filtros correctos

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: RiesgosContextType = {
    riesgos,
    loading,
    error,
    cargarRiesgos,
    crearRiesgo,
    actualizarRiesgo,
    eliminarRiesgo,
    obtenerRiesgoDetalle,
    refrescar
  }

  return (
    <RiesgosContext.Provider value={value}>
      {children}
    </RiesgosContext.Provider>
  )
}

// ============================================
// HOOK PARA USAR CONTEXTO
// ============================================

export function useRiesgos() {
  const contexto = useContext(RiesgosContext)
  if (!contexto) {
    throw new Error('useRiesgos debe usarse dentro de <RiesgosProvider>')
  }
  return contexto
}

export default RiesgosContext
