/**
 * 🎯 RiesgosContext - ACTUALIZADO CON API
 * Gestiona toda la lógica de riesgos, evaluaciones y sus relaciones
 * ELIMINA completion localStorage y usa API real
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'

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
  // ============================================

  const cargarRiesgos = useCallback(async (filtros?: any) => {
    try {
      setLoading(true)
      setError(null)

      console.log('[RiesgosContext] Cargando riesgos con filtros:', filtros)

      // Llamar a API con filtros
      const respuesta = await api.riesgos.getAll(filtros)

      // La API retorna { data: [...], total, page, pageSize } o solo [...]
      const arregloRiesgos = respuesta.data || respuesta
      setRiesgos(arregloRiesgos)

      console.log(`[RiesgosContext] ✅ ${arregloRiesgos.length} riesgos cargados`)
    } catch (err: any) {
      const mensaje = err.message || 'Error cargando riesgos'
      console.error('[RiesgosContext] ❌ Error:', mensaje)
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
      console.log('[RiesgosContext] Creando riesgo:', data)

      const nuevoRiesgo = await api.riesgos.create(data)
      setRiesgos([...riesgos, nuevoRiesgo])

      console.log(`[RiesgosContext] ✅ Riesgo creado: ${nuevoRiesgo.id}`)
      return nuevoRiesgo
    } catch (err: any) {
      const mensaje = err.message || 'Error creando riesgo'
      console.error('[RiesgosContext] ❌ Error:', mensaje)
      setError(mensaje)
      throw err
    }
  }, [riesgos])

  // ============================================
  // ACTUALIZAR RIESGOS
  // ============================================

  const actualizarRiesgo = useCallback(async (id: number, data: any): Promise<Riesgo> => {
    try {
      setError(null)
      console.log(`[RiesgosContext] Actualizando riesgo ${id}:`, data)

      const actualizado = await api.riesgos.update(id, data)
      
      // Actualizar en estado local
      setRiesgos(riesgos.map(r => r.id === id ? actualizado : r))

      console.log(`[RiesgosContext] ✅ Riesgo ${id} actualizado`)
      return actualizado
    } catch (err: any) {
      const mensaje = err.message || 'Error actualizando riesgo'
      console.error('[RiesgosContext] ❌ Error:', mensaje)
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
      console.log(`[RiesgosContext] Eliminando riesgo ${id}`)

      await api.riesgos.delete(id)
      
      // Actualizar en estado local
      setRiesgos(riesgos.filter(r => r.id !== id))

      console.log(`[RiesgosContext] ✅ Riesgo ${id} eliminado`)
    } catch (err: any) {
      const mensaje = err.message || 'Error eliminando riesgo'
      console.error('[RiesgosContext] ❌ Error:', mensaje)
      setError(mensaje)
      throw err
    }
  }, [riesgos])

  // ============================================
  // OBTENER DETALLE
  // ============================================

  const obtenerRiesgoDetalle = useCallback(async (id: number): Promise<Riesgo> => {
    try {
      console.log(`[RiesgosContext] Obteniendo detalle de riesgo ${id}`)
      const riesgo = await api.riesgos.getById(id)
      console.log(`[RiesgosContext] ✅ Detalle obtenido`)
      return riesgo
    } catch (err: any) {
      const mensaje = err.message || `Error obteniendo riesgo ${id}`
      console.error('[RiesgosContext] ❌ Error:', mensaje)
      setError(mensaje)
      throw err
    }
  }, [])

  // ============================================
  // REFRESCAR
  // ============================================

  const refrescar = useCallback(async () => {
    console.log('[RiesgosContext] Refrescando riesgos...')
    await cargarRiesgos()
  }, [cargarRiesgos])

  // ============================================
  // CARGAR AL MONTAR
  // ============================================

  useEffect(() => {
    console.log('[RiesgosContext] Componente montado, cargando riesgos...')
    cargarRiesgos()
  }, [cargarRiesgos])

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

export function useRiesgo() {
  const contexto = useContext(RiesgosContext)
  if (!contexto) {
    throw new Error('useRiesgo debe usarse dentro de <RiesgosProvider>')
  }
  return contexto
}

export default RiesgosContext
