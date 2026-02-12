/**
 * 🔗 API Service Centralizado
 * Consumidor único de todos los datos desde el backend
 * NO usar localStorage ni mockData - TODO debe venir del API
 * 
 * Uso:
 * import { api } from '@/services/api'
 * 
 * api.riesgos.getAll({ procesoId: 1 })
 * api.usuarios.getAll()
 * api.procesos.getById(1)
 */

// ⚠️ Importante: en producción usamos VITE_API_BASE_URL (mismo valor que API_BASE_URL en utils/constants)
// VITE_API_URL se mantiene solo por compatibilidad hacia atrás.
const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string) ||
    (import.meta.env.VITE_API_URL as string) ||
    (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_URL as string)) ||
    'http://localhost:8080/api'

// ============================================
// Configuración Headers
// ============================================

const getHeaders = () => ({
    'Content-Type': 'application/json',
    // Sin localStorage: autenticacion manejada por el backend/cookies si aplica
})

// ============================================
// Manejador de Errores
// ============================================

async function handleResponse(response: Response) {
    if (!response.ok) {
        const error = await response.text()
        throw new Error(`[${response.status}] ${response.statusText}: ${error}`)
    }
    return response.json()
}

// ============================================
// APIs por Módulo
// ============================================

export const api = {
    // ========== USUARIOS ==========
    usuarios: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/usuarios`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        delete: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            })
            if (!res.ok) throw new Error(`Error al eliminar usuario ${id}`)
            return { success: true }
        }
    },

    // ========== ÁREAS ==========
    areas: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/areas`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/areas/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/areas`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        delete: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/areas/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            })
            if (!res.ok) throw new Error(`Error al eliminar área ${id}`)
            return { success: true }
        }
    },

    // ========== PROCESOS ==========
    procesos: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/procesos`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            if (id === undefined || id === null || id === '') {
                console.warn('[api.procesos.getById] llamada con id inválido:', id)
                throw new Error('Invalid proceso id')
            }
            const res = await fetch(`${API_BASE_URL}/procesos/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/procesos`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/procesos/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        delete: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/procesos/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            })
            if (!res.ok) throw new Error(`Error al eliminar proceso ${id}`)
            return { success: true }
        }
    },

    // ========== RIESGOS ==========
    riesgos: {
        getAll: async (filtros?: { procesoId?: number; clasificacion?: string; zona?: string; busqueda?: string; page?: number; pageSize?: number; includeCausas?: string }) => {
            const params = new URLSearchParams()
            if (filtros?.procesoId) params.append('procesoId', String(filtros.procesoId))
            if (filtros?.clasificacion) params.append('clasificacion', filtros.clasificacion)
            if (filtros?.zona) params.append('zona', filtros.zona)
            if (filtros?.busqueda) params.append('busqueda', filtros.busqueda)
            if (filtros?.page) params.append('page', String(filtros.page))
            if (filtros?.pageSize) params.append('pageSize', String(filtros.pageSize))
            if (filtros?.includeCausas) params.append('includeCausas', filtros.includeCausas)

            const url = `${API_BASE_URL}/riesgos${params.toString() ? '?' + params.toString() : ''}`
            const res = await fetch(url, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/riesgos/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/riesgos`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/riesgos/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        delete: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/riesgos/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            })
            if (!res.ok) throw new Error(`Error al eliminar riesgo ${id}`)
            return { success: true }
        },
        getEstadisticas: async (procesoId?: number) => {
            const url = procesoId
                ? `${API_BASE_URL}/riesgos/estadisticas?procesoId=${procesoId}`
                : `${API_BASE_URL}/riesgos/estadisticas`
            const res = await fetch(url, { headers: getHeaders() })
            return handleResponse(res)
        },
        causas: {
            create: async (data: any) => {
                const res = await fetch(`${API_BASE_URL}/riesgos/causas`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(data)
                })
                return handleResponse(res)
            },
            update: async (id: number, data: any) => {
                const res = await fetch(`${API_BASE_URL}/riesgos/causas/${id}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(data)
                })
                return handleResponse(res)
            }
        }
    },

    // ========== EVALUACIONES ==========
    evaluaciones: {
        getByRiesgo: async (riesgoId: number) => {
            const res = await fetch(`${API_BASE_URL}/evaluaciones/riesgo/${riesgoId}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/evaluaciones`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/evaluaciones/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        }
    },

    // ========== CATÁLOGOS ==========
    catalogs: {
        getTiposRiesgo: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/tipos-riesgo`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getObjetivos: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/objetivos`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getFrecuencias: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/frecuencias`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getFuentes: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/fuentes`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getOrigenes: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/origenes`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getTiposProceso: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/tipos-proceso`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getConsecuencias: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/consecuencias`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getImpactos: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/impactos`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getNivelesRiesgo: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/niveles-riesgo`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getMapaConfig: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/mapa-config`, { headers: getHeaders() })
            return handleResponse(res)
        },
        updateMapaConfig: async (type: string, data: any) => {
            const res = await fetch(`${API_BASE_URL}/catalogos/mapa-config`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ type, data })
            })
            return handleResponse(res)
        },
        getEjesMapa: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/ejes-mapa`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getConfiguraciones: async () => {
            const res = await fetch(`${API_BASE_URL}/catalogos/configuraciones`, { headers: getHeaders() })
            return handleResponse(res)
        }
    },

    // ========== GERENCIAS ==========
    gerencias: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/gerencias`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/gerencias/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        }
    },

    // ========== CARGOS ==========
    cargos: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/cargos`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getById: async (id: number) => {
            const res = await fetch(`${API_BASE_URL}/cargos/${id}`, { headers: getHeaders() })
            return handleResponse(res)
        }
    },

    // ========== PRIORIZACIONES ==========
    priorizaciones: {
        getAll: async () => {
            const res = await fetch(`${API_BASE_URL}/priorizaciones`, { headers: getHeaders() })
            return handleResponse(res)
        },
        getByRiesgo: async (riesgoId: number) => {
            const res = await fetch(`${API_BASE_URL}/priorizaciones/riesgo/${riesgoId}`, { headers: getHeaders() })
            return handleResponse(res)
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE_URL}/priorizaciones`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        },
        update: async (id: number, data: any) => {
            const res = await fetch(`${API_BASE_URL}/priorizaciones/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            })
            return handleResponse(res)
        }
    }
}

export default api
