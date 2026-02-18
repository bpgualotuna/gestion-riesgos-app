/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState, useMemo, useEffect } from 'react';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import Grid2 from '../../utils/Grid2';
import { useGetPuntosMapaQuery, useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery, useGetMapaConfigQuery, useGetNivelesRiesgoQuery, useGetEjesMapaQuery, riesgosApi } from '../../api/services/riesgosApi';
import { useAppDispatch } from '../../app/hooks';
import { colors } from '../../app/theme/colors';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, ROUTES, NIVELES_RIESGO } from '../../utils/constants';
import { useProceso } from '../../contexts/ProcesoContext';
import { useRiesgo } from '../../contexts/RiesgoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';
import type { FiltrosRiesgo, PuntoMapa, Riesgo } from '../../types';
import { Alert } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import ResumenEstadisticasMapas from '../../components/mapas/ResumenEstadisticasMapas';


// Función para generar ID del riesgo (número + sigla)
// Prioriza numeroIdentificacion del backend si existe, sino genera desde siglaGerencia
const generarIdRiesgo = (punto: PuntoMapa): string => {
  // Si el backend ya tiene numeroIdentificacion, usarlo directamente
  if (punto.numeroIdentificacion && punto.numeroIdentificacion.trim()) {
    return punto.numeroIdentificacion;
  }
  // Fallback: generar desde número y sigla
  const numero = punto.numero || 0;
  const sigla = punto.siglaGerencia || '';
  return `${numero}${sigla}`;
};

export default function MapaPage() {
  const { procesoSeleccionado } = useProceso();
  const { iniciarVer } = useRiesgo();
  const { esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user } = useAuth();
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();
  const { data: mapaConfig } = useGetMapaConfigQuery(); // Moved here to avoid initialization error
  const { data: procesos = [] } = useGetProcesosQuery();
  const { data: niveles = [] } = useGetNivelesRiesgoQuery();
  const { data: ejes } = useGetEjesMapaQuery();
  const [clasificacion, setClasificacion] = useState<string>('all');
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [mostrarFueraApetito, setMostrarFueraApetito] = useState(false);
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number } | null>(null);
  const [dialogoResumenAbierto, setDialogoResumenAbierto] = useState(false);
  const [dialogoDetalleRiesgoAbierto, setDialogoDetalleRiesgoAbierto] = useState(false);
  const [riesgoSeleccionadoDetalle, setRiesgoSeleccionadoDetalle] = useState<Riesgo | null>(null);
  const [puntoSeleccionadoDetalle, setPuntoSeleccionadoDetalle] = useState<PuntoMapa | null>(null);
  const [tipoMapaDetalle, setTipoMapaDetalle] = useState<'inherente' | 'residual'>('inherente');
  const [dialogoRiesgosFueraApetitoAbierto, setDialogoRiesgosFueraApetitoAbierto] = useState(false);

  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles
  const { data: evaluacionesRiesgo = [] } = useGetEvaluacionesByRiesgoQuery(
    String(riesgoSeleccionadoDetalle?.id || ''),
    { skip: !riesgoSeleccionadoDetalle }
  );
  const evaluacionRiesgo = evaluacionesRiesgo[0] || null;

  // Obtener procesos visibles (supervisor por asignación, dueño por responsable, gerente director por asignación)
  const procesosPropios = useMemo(() => {
    if (!user) return [];
    if (esGerenteGeneralDirector) {
      // Gerente General también debe filtrar por asignaciones
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    if (esGerenteGeneralProceso) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    if (esSupervisorRiesgos) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    // Gerente General Proceso
    if (esGerenteGeneralProceso) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    // Dueño de Proceso REAL
    if (user?.role === 'dueño_procesos') {
      return procesos.filter((p) => p.responsableId === user.id);
    }
    return [];
  }, [procesos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, areasAsignadas, procesosAsignados, user]);

  // Aplicar filtros de área y proceso si están seleccionados
  // IMPORTANTE: Esta página tiene sus propios filtros, NO usa el filtro del header (procesoSeleccionado)
  const procesoIdFiltrado = useMemo(() => {
    // Si hay filtro de proceso local, usarlo
    if (filtroProceso && filtroProceso !== 'all') {
      return String(filtroProceso);
    }
    // Si hay filtro de área pero no de proceso, no filtrar por procesoId aquí
    // (se filtrará después en puntosFiltrados por área)
    if (filtroArea && filtroArea !== 'all') {
      return undefined; // Devolver undefined para filtrar después por área
    }
    // Si no hay filtros locales, mostrar todos los procesos disponibles del usuario
    // (NO usar procesoSeleccionado del header)
    return undefined;
  }, [filtroProceso, filtroArea]);

  const filtros: FiltrosRiesgo = {
    procesoId: procesoIdFiltrado,
    clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
  };

  const dispatch = useAppDispatch();
  
  const { data: puntos, isLoading: isLoadingPuntos, error: errorPuntos, refetch: refetchPuntos } = useGetPuntosMapaQuery(filtros, {
    // Forzar refetch cuando cambien los filtros
    refetchOnMountOrArgChange: true,
  });
  const { data: riesgosData, isLoading: isLoadingRiesgos, error: errorRiesgos, refetch: refetchRiesgos } = useGetRiesgosQuery({
    ...filtros,
    includeCausas: true
  }, {
    // Forzar refetch cuando cambien los filtros
    refetchOnMountOrArgChange: true,
  });

  // Forzar invalidación de caché cuando cambien los filtros
  useEffect(() => {
    console.log('[MapaPage] 🔄 Filtros cambiados, invalidando caché:', {
      filtros,
      filtroArea,
      filtroProceso,
      clasificacion
    });
    dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion']));
    // Refetch manual para asegurar datos actualizados
    refetchPuntos();
    refetchRiesgos();
  }, [filtros.procesoId, filtros.clasificacion, filtroArea, filtroProceso, clasificacion, dispatch, refetchPuntos, refetchRiesgos]);
  
  // Escuchar cambios en los datos para forzar actualización del mapa
  useEffect(() => {
    if (puntos && puntos.length > 0) {
      console.log('[MapaPage] 📊 Puntos actualizados:', {
        total: puntos.length,
        muestra: puntos.slice(0, 3).map(p => ({
          riesgoId: p.riesgoId,
          id: generarIdRiesgo(p),
          inherente: `${p.probabilidad}-${p.impacto}`,
          residual: `${p.probabilidadResidual || p.probabilidad}-${p.impactoResidual || p.impacto}`
        }))
      });
    }
  }, [puntos]);

  // Obtener riesgos completos para el diálogo
  const riesgosCompletos = riesgosData?.data || [];
  
  // Logs de depuración
  useEffect(() => {
    console.log('[MapaPage] 📊 Datos recibidos:', {
      puntosCount: puntos?.length || 0,
      riesgosCount: riesgosCompletos.length,
      filtros,
      procesosPropiosCount: procesosPropios.length,
      esSupervisor: esSupervisorRiesgos,
      esDueño: esDueñoProcesos,
      puntosSample: puntos?.slice(0, 3).map(p => ({
        riesgoId: p.riesgoId,
        id: generarIdRiesgo(p),
        numeroIdentificacion: p.numeroIdentificacion,
        siglaGerencia: p.siglaGerencia,
        zona: p.zona,
        procesoId: p.procesoId
      }))
    });
  }, [puntos, riesgosCompletos, filtros, procesosPropios, esSupervisorRiesgos, esDueñoProcesos]);

  // Filtrar puntos y riesgos para mostrar solo los de sus procesos (aplicando filtros de área)
  const puntosFiltrados = useMemo(() => {
    console.log('[MapaPage] 🔍 Filtrando puntos:', {
      puntosCount: puntos?.length || 0,
      riesgosCompletosCount: riesgosCompletos.length,
      esSupervisor: esSupervisorRiesgos,
      esDueño: esDueñoProcesos,
      esGerenteDirector: esGerenteGeneralDirector,
      esGerenteProceso: esGerenteGeneralProceso,
      procesosPropiosCount: procesosPropios.length,
      filtroArea,
      filtroProceso,
      procesoSeleccionadoId: procesoSeleccionado?.id
    });

    // Si es supervisor, dueño o gerente general, aplicar filtros por procesos asignados
    if ((esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector || esGerenteGeneralProceso) && procesosPropios.length > 0) {
      let procesosIds = procesosPropios.map((p) => String(p.id));

      // Aplicar filtro de área si está seleccionado
      if (filtroArea && filtroArea !== 'all') {
        procesosIds = procesosPropios
          .filter(p => String(p.areaId) === String(filtroArea))
          .map(p => String(p.id));
        console.log('[MapaPage] 🔍 Filtrado por área:', { filtroArea, procesosIds });
      }

      // Aplicar filtro de proceso si está seleccionado (sobrescribe el filtro de área)
      if (filtroProceso && filtroProceso !== 'all') {
        procesosIds = [String(filtroProceso)];
        console.log('[MapaPage] 🔍 Filtrado por proceso:', { filtroProceso, procesosIds });
      }

      // Filtrar puntos por procesos permitidos
      const filtrados = puntos?.filter((p) => {
        const riesgo = riesgosCompletos.find((r) => String(r.id) === String(p.riesgoId));
        if (!riesgo) {
          console.warn('[MapaPage] ⚠️ Riesgo no encontrado para punto:', p.riesgoId);
          return false;
        }
        
        const procesoIdRiesgo = String(riesgo.procesoId);
        const pertenece = procesosIds.includes(procesoIdRiesgo);
        
        if (!pertenece) {
          console.log('[MapaPage] ⚠️ Riesgo excluido por proceso:', {
            riesgoId: riesgo.id,
            procesoIdRiesgo,
            procesosIdsPermitidos: procesosIds
          });
          return false;
        }
        
        // Aplicar filtro de clasificación si está seleccionado
        if (clasificacion !== 'all') {
          const clasificacionRiesgo = riesgo.clasificacion || 'Negativa';
          if (clasificacionRiesgo !== clasificacion) {
            return false;
          }
        }
        
        return true;
      }) || [];
      
      console.log('[MapaPage] ✅ Puntos filtrados:', {
        total: filtrados.length,
        procesosIds,
        clasificacion,
        riesgosEncontrados: filtrados.map(p => {
          const riesgo = riesgosCompletos.find(r => String(r.id) === String(p.riesgoId));
          return {
            riesgoId: p.riesgoId,
            procesoId: riesgo?.procesoId,
            id: generarIdRiesgo(p)
          };
        })
      });
      
      console.log('[MapaPage] ✅ Puntos filtrados para supervisor/dueño/gerente:', {
        total: filtrados.length,
        procesosIds,
        clasificacion,
        sample: filtrados.slice(0, 3).map(p => {
          const riesgo = riesgosCompletos.find(r => String(r.id) === String(p.riesgoId));
          return {
            riesgoId: p.riesgoId,
            id: generarIdRiesgo(p),
            numeroIdentificacion: p.numeroIdentificacion,
            siglaGerencia: p.siglaGerencia,
            procesoId: riesgo?.procesoId,
            clasificacion: riesgo?.clasificacion,
            zona: p.zona
          };
        })
      });
      
      return filtrados;
    }
    
    // NOTA: Ya no usamos procesoSeleccionado del header aquí
    // Esta página tiene sus propios filtros (filtroArea, filtroProceso)

    // Si no hay proceso seleccionado ni filtros, mostrar todos los puntos (aplicando solo clasificación)
    const todosFiltrados = puntos?.filter((p) => {
      if (clasificacion === 'all') return true;
      const riesgo = riesgosCompletos.find((r) => String(r.id) === String(p.riesgoId));
      if (!riesgo) return false;
      const clasificacionRiesgo = riesgo.clasificacion || 'Negativa';
      return clasificacionRiesgo === clasificacion;
    }) || [];
    
    console.log('[MapaPage] ✅ Mostrando todos los puntos (solo filtro clasificación):', {
      total: todosFiltrados.length,
      clasificacion,
      puntosTotales: puntos?.length || 0
    });
    return todosFiltrados;
  }, [puntos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, procesosPropios, riesgosCompletos, filtroArea, filtroProceso, clasificacion]);

  // Crear matriz 5x5 para riesgo inherente usando puntos filtrados
  const matrizInherente = useMemo(() => {
    const matriz: { [key: string]: PuntoMapa[] } = {};
    
    console.log('[MapaPage] 🔄 Construyendo matriz inherente con', puntosFiltrados.length, 'puntos');
    
    // Filtrar solo puntos válidos
    const puntosValidos = puntosFiltrados.filter(p => {
      const prob = Number(p.probabilidad);
      const imp = Number(p.impacto);
      return !isNaN(prob) && !isNaN(imp) && prob >= 1 && prob <= 5 && imp >= 1 && imp <= 5;
    });
    
    puntosValidos.forEach((punto) => {
      // Asegurar que probabilidad e impacto sean números enteros
      const probabilidad = Math.round(Number(punto.probabilidad));
      const impacto = Math.round(Number(punto.impacto));
      
      // Validar que estén en el rango correcto (1-5)
      if (probabilidad < 1 || probabilidad > 5 || impacto < 1 || impacto > 5) {
        console.warn('[MapaPage] ⚠️ Punto con valores fuera de rango:', {
          riesgoId: punto.riesgoId,
          id: generarIdRiesgo(punto),
          probabilidad,
          impacto
        });
        return; // Saltar este punto
      }
      
      const clave = `${probabilidad}-${impacto}`;
      
      if (!matriz[clave]) {
        matriz[clave] = [];
      }
      
      // Log para verificar ubicación
      console.log('[MapaPage] 📍 Riesgo inherente ubicado:', {
        riesgoId: punto.riesgoId,
        id: generarIdRiesgo(punto),
        celda: clave,
        probabilidad,
        impacto,
        nivelRiesgo: punto.nivelRiesgo
      });
      
      // Guardar el punto con valores validados
      matriz[clave].push({
        ...punto,
        probabilidad,
        impacto,
      });
    });
    
    console.log('[MapaPage] ✅ Matriz Inherente construida:', {
      totalCeldas: Object.keys(matriz).length,
      totalPuntos: Object.values(matriz).reduce((sum, puntos) => sum + puntos.length, 0),
      muestra: Object.entries(matriz).slice(0, 5).map(([clave, puntos]) => ({
        celda: clave,
        cantidad: puntos.length,
        riesgos: puntos.map(p => generarIdRiesgo(p))
      }))
    });
    
    return matriz;
  }, [puntosFiltrados]);

  // Crear matriz 5x5 para riesgo residual
  // Calcular riesgo residual basado en evaluaciones y causas con controles
  const matrizResidual = useMemo(() => {
    const matriz: { [key: string]: PuntoMapa[] } = {};
    
    console.log('[MapaPage] 🔄 Construyendo matriz residual con', puntosFiltrados.length, 'puntos');
    
    puntosFiltrados.forEach((punto) => {
      const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
      if (!riesgo) {
        console.warn('[MapaPage] ⚠️ Riesgo no encontrado para punto:', punto.riesgoId);
        return;
      }

      // Usar valores residuales del backend (calculados desde causas con controles)
      let probabilidadResidual = punto.probabilidadResidual;
      let impactoResidual = punto.impactoResidual;
      
      // Si no hay valores residuales en el punto, calcular desde las causas con controles
      if (!probabilidadResidual || !impactoResidual) {
        if (riesgo.causas && riesgo.causas.length > 0) {
          const causasConControles = riesgo.causas.filter((c: any) => {
            const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
            return tipo === 'CONTROL';
          });
          
          if (causasConControles.length > 0) {
            // Obtener el máximo de las calificaciones residuales
            const calificacionesResiduales = causasConControles
              .map((c: any) => {
                // Leer desde el JSON gestion si existe
                let gestionJson: any = null;
                try {
                  if (c.gestion && typeof c.gestion === 'string') {
                    gestionJson = JSON.parse(c.gestion);
                  } else if (c.gestion && typeof c.gestion === 'object') {
                    gestionJson = c.gestion;
                  }
                } catch (e) {
                  console.warn(`[MapaPage] Error parsing gestion JSON para causa ${c.id}:`, e);
                }
                
                // Priorizar calificacionResidual del JSON, luego riesgoResidual, luego calcular
                if (gestionJson) {
                  if (gestionJson.calificacionResidual !== undefined && gestionJson.calificacionResidual !== null && gestionJson.calificacionResidual > 0) {
                    return Number(gestionJson.calificacionResidual);
                  }
                  if (gestionJson.riesgoResidual !== undefined && gestionJson.riesgoResidual !== null && gestionJson.riesgoResidual > 0) {
                    return Number(gestionJson.riesgoResidual);
                  }
                  if (gestionJson.frecuenciaResidual !== undefined && gestionJson.impactoResidual !== undefined) {
                    const freqRes = Number(gestionJson.frecuenciaResidual);
                    const impRes = Number(gestionJson.impactoResidual);
                    const cal = freqRes === 2 && impRes === 2 ? 3.99 : freqRes * impRes;
                    return cal;
                  }
                }
                
                // Fallback: intentar leer directamente de la causa
                if (c.calificacionResidual !== undefined && c.calificacionResidual !== null && c.calificacionResidual > 0) {
                  return Number(c.calificacionResidual);
                }
                if (c.riesgoResidual !== undefined && c.riesgoResidual !== null && c.riesgoResidual > 0) {
                  return Number(c.riesgoResidual);
                }
                
                // Fallback final: calcular desde valores inherentes
                const freqInh = Number(c.frecuencia || punto.probabilidad);
                const impInh = Number(punto.impacto);
                const cal = freqInh === 2 && impInh === 2 ? 3.99 : freqInh * impInh;
                return cal;
              })
              .filter((cal: number) => !isNaN(cal) && cal > 0);
            
            if (calificacionesResiduales.length > 0) {
              const calificacionMaxResidual = Math.max(...calificacionesResiduales);
              
              // Convertir calificación residual a probabilidad e impacto
              let mejorProbRes = 1;
              let mejorImpRes = 1;
              let menorDiferenciaRes = Math.abs(calificacionMaxResidual - (mejorProbRes * mejorImpRes));
              
              for (let prob = 1; prob <= 5; prob++) {
                for (let imp = 1; imp <= 5; imp++) {
                  const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
                  
                  if (valor >= calificacionMaxResidual) {
                    const diferencia = valor - calificacionMaxResidual;
                    if (diferencia < menorDiferenciaRes || (menorDiferenciaRes > 0 && valor < (mejorProbRes * mejorImpRes))) {
                      menorDiferenciaRes = diferencia;
                      mejorProbRes = prob;
                      mejorImpRes = imp;
                    }
                  } else {
                    const diferencia = Math.abs(calificacionMaxResidual - valor);
                    if (diferencia < menorDiferenciaRes) {
                      menorDiferenciaRes = diferencia;
                      mejorProbRes = prob;
                      mejorImpRes = imp;
                    }
                  }
                }
              }
              
              probabilidadResidual = mejorProbRes;
              impactoResidual = mejorImpRes;
              
              console.log('[MapaPage] 📊 Riesgo residual calculado:', {
                riesgoId: punto.riesgoId,
                id: generarIdRiesgo(punto),
                calificacionMaxResidual,
                probabilidadResidual,
                impactoResidual,
                inherente: `${punto.probabilidad}-${punto.impacto}`
              });
            }
          }
        }
      }
      
      // Fallback: usar valores inherentes si no hay residuales
      if (!probabilidadResidual || !impactoResidual) {
        probabilidadResidual = punto.probabilidad;
        impactoResidual = punto.impacto;
      }
      
      // Validar y redondear
      probabilidadResidual = Math.max(1, Math.min(5, Math.round(Number(probabilidadResidual))));
      impactoResidual = Math.max(1, Math.min(5, Math.round(Number(impactoResidual))));

      const clave = `${probabilidadResidual}-${impactoResidual}`;
      if (!matriz[clave]) {
        matriz[clave] = [];
      }
      
      // Crear un punto residual basado en el inherente
      matriz[clave].push({
        ...punto,
        probabilidad: probabilidadResidual,
        impacto: impactoResidual,
      });
    });
    
    console.log('[MapaPage] ✅ Matriz Residual construida:', {
      totalCeldas: Object.keys(matriz).length,
      totalPuntos: Object.values(matriz).reduce((sum, puntos) => sum + puntos.length, 0),
      muestra: Object.entries(matriz).slice(0, 5).map(([clave, puntos]) => ({
        celda: clave,
        cantidad: puntos.length,
        riesgos: puntos.map(p => generarIdRiesgo(p))
      }))
    });
    
    return matriz;
  }, [puntosFiltrados, riesgosCompletos]);

  // Calcular nivel de riesgo basado en probabilidad e impacto (Usando Configuración o Fallback)
  const calcularNivelRiesgo = (probabilidad: number, impacto: number): string => {
    // Si existe configuración dinámica, usarla
    if (mapaConfig && mapaConfig.inherente) {
      const clave = `${probabilidad}-${impacto}`;
      const nivelId = mapaConfig.inherente[clave];
      if (nivelId) {
        // Mapear ID de nivel a NIVELES_RIESGO constant
        const nivel = niveles?.find(n => n.id === nivelId);
        if (nivel && nivel.nombre) {
          // Aquí idealmente NIVELES_RIESGO debería coincidir con los IDs o nombres de la config.
          // Si nivel.nombre es "Crítico", return NIVELES_RIESGO.CRITICO
          // Simplificación: Retornamos el nombre en mayúsculas si coincide, o una lógica de mapeo.
          // Dado que NIVELES_RIESGO es CRITICO, ALTO, MEDIO, BAJO.
          const nombreUpper = nivel.nombre.toUpperCase();
          if (nombreUpper.includes('CRITICO') || nombreUpper.includes('CRÍTICO')) return NIVELES_RIESGO.CRITICO;
          if (nombreUpper.includes('ALTO')) return NIVELES_RIESGO.ALTO;
          if (nombreUpper.includes('MEDIO')) return NIVELES_RIESGO.MEDIO;
          if (nombreUpper.includes('BAJO')) return NIVELES_RIESGO.BAJO;
        }
      }
    }

    // Fallback: Lógica matemática según documento Proceso_Calificacion_Inherente_Global.md
    // Zonas: 15-25 Crítico, 10-14 Alto, 4-9 Medio, 1-3 Bajo
    // Excepción: 2x2 = 3.99 (cae en zona baja)
    let riesgo = probabilidad * impacto;
    if (probabilidad === 2 && impacto === 2) {
      riesgo = 3.99; // Excepción documentada
    }
    
    if (riesgo >= 15 && riesgo <= 25) return NIVELES_RIESGO.CRITICO;
    if (riesgo >= 10 && riesgo <= 14) return NIVELES_RIESGO.ALTO;
    if (riesgo >= 4 && riesgo <= 9) return NIVELES_RIESGO.MEDIO;
    return NIVELES_RIESGO.BAJO;
  };

  // Calcular estadísticas comparativas: Inherente vs Residual
  const estadisticasComparativas = useMemo(() => {
    if (!puntosFiltrados || puntosFiltrados.length === 0) return null;

    // Estadísticas de riesgo inherente
    const inherente = {
      total: puntosFiltrados.length,
      porNivel: {
        critico: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.CRITICO).length,
        alto: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.ALTO).length,
        medio: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.MEDIO).length,
        bajo: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.BAJO).length,
      },
    };

    // Estadísticas de riesgo residual
    const residual = {
      total: puntosFiltrados.length,
      porNivel: {
        critico: 0,
        alto: 0,
        medio: 0,
        bajo: 0,
      },
    };

    // Calcular residual y comparar cambios
    const cambios: { [key: string]: number } = {
      'critico-critico': 0,
      'critico-alto': 0,
      'critico-medio': 0,
      'critico-bajo': 0,
      'alto-alto': 0,
      'alto-medio': 0,
      'alto-bajo': 0,
      'medio-medio': 0,
      'medio-bajo': 0,
      'bajo-bajo': 0,
    };

    puntosFiltrados.forEach((punto) => {
      const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
      if (!riesgo) return;

      const nivelInherente = calcularNivelRiesgo(punto.probabilidad, punto.impacto);

      // Calcular residual (aproximación: reducir 20%)
      const probabilidadResidual = punto.probabilidadResidual ?? Math.max(1, Math.round(punto.probabilidad * 0.8));
      const impactoResidual = punto.impactoResidual ?? Math.max(1, Math.round(punto.impacto * 0.8));
      const nivelResidual = calcularNivelRiesgo(probabilidadResidual, impactoResidual);

      // Contar por nivel residual
      if (nivelResidual === NIVELES_RIESGO.CRITICO) residual.porNivel.critico++;
      else if (nivelResidual === NIVELES_RIESGO.ALTO) residual.porNivel.alto++;
      else if (nivelResidual === NIVELES_RIESGO.MEDIO) residual.porNivel.medio++;
      else residual.porNivel.bajo++;

      // Contar cambios
      const claveCambio = `${nivelInherente}-${nivelResidual}`;
      if (cambios[claveCambio] !== undefined) {
        cambios[claveCambio]++;
      }
    });

    return {
      inherente,
      residual,
      cambios,
    };
  }, [puntosFiltrados, riesgosCompletos]);

  // Análisis de Mitigación (Insights)
  const riskInsights = useMemo(() => {
    if (!puntosFiltrados || puntosFiltrados.length === 0) return null;

    // 1. Top Mitigaciones (Mayor reducción de puntaje)
    const mitigaciones = puntosFiltrados.map(punto => {
      const riesgo = riesgosCompletos.find(r => r.id === punto.riesgoId);
      if (!riesgo) return null;

      const scoreInherente = punto.probabilidad * punto.impacto;
      // Aproximación residual (usando la misma lógica global)
      const probRes = punto.probabilidadResidual ?? Math.max(1, Math.round(punto.probabilidad * 0.8));
      const impRes = punto.impactoResidual ?? Math.max(1, Math.round(punto.impacto * 0.8));
      const scoreResidual = probRes * impRes;

      const reduccion = scoreInherente - scoreResidual;

      return {
        id: generarIdRiesgo(punto),
        nombre: riesgo.descripcion || punto.descripcion, // Usar descripción del riesgo
        scoreInherente,
        scoreResidual,
        reduccion,
        nivelResidual: calcularNivelRiesgo(probRes, impRes)
      };
    }).filter(Boolean).sort((a, b) => (b?.reduccion || 0) - (a?.reduccion || 0));

    const topMitigaciones = mitigaciones.slice(0, 3);

    // 2. Riesgos Críticos Persistentes
    const criticosPersistentes = mitigaciones.filter(m => m && m.nivelResidual === NIVELES_RIESGO.CRITICO);

    // 3. Eficacia Global (% de riesgos que bajaron de nivel o puntaje)
    const totalMejorados = mitigaciones.filter(m => (m?.reduccion || 0) > 0).length;
    const eficacia = Math.round((totalMejorados / puntosFiltrados.length) * 100);

    return {
      topMitigaciones,
      criticosPersistentes,
      eficacia
    };
  }, [puntosFiltrados, riesgosCompletos]);

  // Identificar riesgos fuera del límite (solo riesgos RESIDUALES >= límite configurado)
  const riesgosFueraLimite = useMemo(() => {
    // Obtener umbral del límite de apetito configurado (por defecto 15)
    const umbralLimite = mapaConfig?.umbralApetito || 15;

    // Extraer todos los puntos residuales de la matriz residual
    const puntosResiduales: PuntoMapa[] = [];
    Object.values(matrizResidual).forEach(puntos => {
      puntosResiduales.push(...puntos);
    });

    // Filtrar solo los que están fuera del límite
    return puntosResiduales
      .filter((punto) => {
        const valorRiesgo = punto.probabilidad * punto.impacto;
        return valorRiesgo >= umbralLimite && punto.clasificacion === CLASIFICACION_RIESGO.NEGATIVA;
      })
      .map((punto) => {
        const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
        return { punto, riesgo, valorRiesgo: punto.probabilidad * punto.impacto };
      })
      .sort((a, b) => b.valorRiesgo - a.valorRiesgo); // Ordenar de mayor a menor riesgo
  }, [matrizResidual, riesgosCompletos, mapaConfig]);

  // Obtener riesgos de la celda seleccionada usando puntos filtrados
  const [tipoMapaSeleccionado, setTipoMapaSeleccionado] = useState<'inherente' | 'residual'>('inherente');
  const matrizActual = tipoMapaSeleccionado === 'inherente' ? matrizInherente : matrizResidual;

  const riesgosCeldaSeleccionada = useMemo(() => {
    if (!celdaSeleccionada) return [];
    
    // Asegurar que sean números enteros
    const prob = Math.round(Number(celdaSeleccionada.probabilidad)) || 1;
    const imp = Math.round(Number(celdaSeleccionada.impacto)) || 1;
    const clave = `${prob}-${imp}`;
    
    const riesgos = matrizActual[clave] || [];
    
    // Validar que los riesgos realmente pertenezcan a esta celda
    const riesgosValidos = riesgos.filter(p => {
      const pProb = Math.round(Number(p.probabilidad));
      const pImp = Math.round(Number(p.impacto));
      return pProb === prob && pImp === imp;
    });
    
    return riesgosValidos;
  }, [celdaSeleccionada, matrizActual]);

  // Si es supervisor, dueño o gerente general, mostrar solo procesos que tiene asignados
  if ((esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesosPropios.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No tiene procesos asignados.
        </Alert>
      </Box>
    );
  }

  // NOTA: Esta página NO usa procesoSeleccionado del header
  // Tiene sus propios filtros (filtroArea, filtroProceso) que son independientes


  /* Hook moved to top */
  const getCellColor = (probabilidad: number, impacto: number): string => {
    // Asegurar que sean números válidos
    const prob = Number(probabilidad) || 1;
    const imp = Number(impacto) || 1;
    const cellKey = `${prob}-${imp}`;

    // Use backend configuration if available
    if (mapaConfig && mapaConfig.inherente) {
      const nivelId = mapaConfig.inherente[cellKey];
      if (nivelId) {
        const nivel = niveles?.find(n => n.id === nivelId);
        if (nivel && nivel.color) {
          return nivel.color;
        }
      }
    }

    // Fallback to theme colors según documento Proceso_Calificacion_Inherente_Global.md
    // Zonas: 15-25 Rojo, 10-14 Naranja, 4-9 Amarillo, 1-3 Verde
    // Excepción: 2x2 = 3.99 (cae en zona verde)
    let riesgo = prob * imp;
    if (prob === 2 && imp === 2) {
      riesgo = 3.99; // Excepción documentada
    }
    
    if (riesgo >= 15 && riesgo <= 25) return colors.risk.critical.main; // Rojo - Zona Extrema/Crítica
    if (riesgo >= 10 && riesgo <= 14) return colors.risk.high.main; // Naranja - Zona Alta
    if (riesgo >= 4 && riesgo <= 9) return colors.risk.medium.main; // Amarillo - Zona Moderada
    return colors.risk.low.main; // Verde - Zona Baja (1-3, incluye 3.99)
  };

  // Función para obtener el color basado en el nivel de riesgo (string)
  const getColorByNivelRiesgo = (nivelRiesgo: string | null | undefined): string => {
    if (!nivelRiesgo) return colors.risk.low.main;
    
    const nivelUpper = nivelRiesgo.toUpperCase();
    if (nivelUpper.includes('CRÍTICO') || nivelUpper.includes('CRITICO')) {
      return colors.risk.critical.main; // Rojo
    }
    if (nivelUpper.includes('ALTO')) {
      return colors.risk.high.main; // Naranja
    }
    if (nivelUpper.includes('MEDIO')) {
      return colors.risk.medium.main; // Amarillo
    }
    return colors.risk.low.main; // Verde (BAJO o cualquier otro)
  };
  
  // Función auxiliar para convertir color hex a rgba con opacidad
  const hexToRgba = (hex: string, opacity: number): string => {
    // Si el color ya tiene formato rgba, devolverlo
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    
    // Remover # si existe
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getCellLabel = (probabilidad: number, impacto: number): string => {
    // Calcular riesgo con excepción 2x2 = 3.99
    let riesgo = probabilidad * impacto;
    if (probabilidad === 2 && impacto === 2) {
      riesgo = 3.99;
    }
    
    // Etiquetas según documento
    if (riesgo >= 15 && riesgo <= 25) return 'CRÍTICO';
    if (riesgo >= 10 && riesgo <= 14) return 'ALTO';
    if (riesgo >= 4 && riesgo <= 9) return 'MEDIO';
    return 'BAJO';
  };

  const handleCellClick = (probabilidad: number, impacto: number, tipo: 'inherente' | 'residual') => {
    // Asegurar que sean números enteros
    const prob = Math.round(Number(probabilidad)) || 1;
    const imp = Math.round(Number(impacto)) || 1;
    const clave = `${prob}-${imp}`;
    
    setTipoMapaSeleccionado(tipo);
    const matrizActual = tipo === 'inherente' ? matrizInherente : matrizResidual;
    const riesgosCelda = matrizActual[clave] || [];
    
    console.log('[MapaPage] 🔍 Click en celda:', {
      probabilidad,
      impacto,
      probValidada: prob,
      impValidado: imp,
      clave,
      tipo,
      cantidadRiesgos: riesgosCelda.length,
      riesgos: riesgosCelda.map(p => ({
        id: generarIdRiesgo(p),
        prob: p.probabilidad,
        imp: p.impacto,
        clavePunto: `${p.probabilidad}-${p.impacto}`
      }))
    });
    
    if (riesgosCelda.length === 1) {
      // Si solo hay un riesgo en la celda, abrir directamente el detalle completo
      const puntoUnico = riesgosCelda[0];
      const riesgo = riesgosCompletos.find((r) => r.id === puntoUnico.riesgoId);
      if (riesgo) {
        setRiesgoSeleccionadoDetalle(riesgo);
        setPuntoSeleccionadoDetalle(puntoUnico);
        setTipoMapaDetalle(tipo);
        setDialogoDetalleRiesgoAbierto(true);
      }
    } else if (riesgosCelda.length > 1) {
      // Si hay varios riesgos, mostrar el resumen de la celda para que el usuario escoja
      setCeldaSeleccionada({ probabilidad: prob, impacto: imp });
      setDialogoResumenAbierto(true);
    } else {
      console.warn('[MapaPage] ⚠️ No se encontraron riesgos en la celda', clave);
    }
  };

  // Función para obtener los bordes rojos de una celda de límite (Tolerancia)
  const getBordesLimite = (probabilidad: number, impacto: number): { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } => {
    if (!mapaConfig || !mapaConfig.tolerancia) return {};

    const claveCelda = `${probabilidad}-${impacto}`;
    const tolerada = mapaConfig.tolerancia.includes(claveCelda);
    const bordes: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } = {};

    const checkVecino = (p: number, i: number) => {
      const key = `${p}-${i}`;
      return mapaConfig.tolerancia.includes(key);
    };

    // Lógica simétrica al Admin: Dibujar borde si el estado de tolerancia es diferente al del vecino,
    // pero respetando los límites de la matriz (no dibujar borde en el extremo exterior).

    // Arriba (Impacto + 1)
    if (impacto < 5 && tolerada !== checkVecino(probabilidad, impacto + 1)) bordes.top = true;

    // Derecha (Probabilidad + 1)
    if (probabilidad < 5 && tolerada !== checkVecino(probabilidad + 1, impacto)) bordes.right = true;

    // Abajo (Impacto - 1)
    if (impacto > 1 && tolerada !== checkVecino(probabilidad, impacto - 1)) bordes.bottom = true;

    // Izquierda (Probabilidad - 1)
    if (probabilidad > 1 && tolerada !== checkVecino(probabilidad - 1, impacto)) bordes.left = true;

    return bordes;
  };

  const renderMatrix = (matriz: { [key: string]: PuntoMapa[] }, tipo: 'inherente' | 'residual') => {
    const probabilidades = ejes?.probabilidad.map(p => p.valor) || [1, 2, 3, 4, 5];
    const impactos = ejes?.impacto.map(i => i.valor).sort((a, b) => b - a) || [5, 4, 3, 2, 1];

    const esFueraApetito = (prob: number, imp: number) => {
      const valor = prob * imp;
      return valor >= 15; // Hardcoded threshold based on constants
    };

    return (
      <Box sx={{ minWidth: 350, position: 'relative' }}>
        <Box display="flex" alignItems="center" mb={1.5}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              mr: 2,
              fontSize: '0.75rem',
            }}
          >
            IMPACTO
          </Typography>
          <Box flexGrow={1}>
            <Box>
              {impactos.map((impacto) => {
                const etiquetaImpacto = ejes?.impacto.find(i => i.valor === impacto)?.nombre || '';

                return (
                  <Box key={impacto} display="flex" mb={0.5}>
                    <Box
                      sx={{
                        width: 50, // Reduced from 60
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.65rem', // Reduced font
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                        {impacto}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, fontSize: '0.55rem' }}>
                        {etiquetaImpacto}
                      </Typography>
                    </Box>
                    {probabilidades.map((probabilidad) => {
                      // Asegurar que sean números enteros para la clave
                      const prob = Math.round(Number(probabilidad)) || 1;
                      const imp = Math.round(Number(impacto)) || 1;
                      const key = `${prob}-${imp}`;
                      const riesgosCelda = matriz[key] || [];
                      const cellColor = getCellColor(prob, imp);
                      const fuerApetito = esFueraApetito(prob, imp);
                      const bordesLimite = getBordesLimite(prob, imp);
                      
                      // Validar que los riesgos en esta celda realmente pertenezcan aquí
                      const riesgosValidosEnCelda = riesgosCelda.filter(p => {
                        const pProb = Math.round(Number(p.probabilidad));
                        const pImp = Math.round(Number(p.impacto));
                        return pProb === prob && pImp === imp;
                      });

                      // Determine visible IDs (max 3 or 4 to keep it small)
                      const maxVisible = 4;
                      const visibleRiesgos = riesgosValidosEnCelda.slice(0, maxVisible);
                      const remaining = riesgosValidosEnCelda.length - maxVisible;

                      return (
                        <Box
                          key={probabilidad}
                          onClick={() => handleCellClick(prob, imp, tipo)}
                          sx={{
                            width: 60, // Reduced from 70
                            minHeight: 60, // Reduced from 70

                            // Borders logic
                            borderTop: fuerApetito ? '3px solid #d32f2f' : (bordesLimite.top ? '3px dashed #d32f2f' : '1px solid #000'),
                            borderRight: fuerApetito ? '3px solid #d32f2f' : (bordesLimite.right ? '3px dashed #d32f2f' : '1px solid #000'),
                            borderBottom: fuerApetito ? '3px solid #d32f2f' : (bordesLimite.bottom ? '3px dashed #d32f2f' : '1px solid #000'),
                            borderLeft: fuerApetito ? '3px solid #d32f2f' : (bordesLimite.left ? '3px dashed #d32f2f' : '1px solid #000'),

                            ...(fuerApetito && { border: '3px solid #d32f2f' }),

                            backgroundColor: hexToRgba(cellColor, 0.3), // 30% de opacidad para mejor visibilidad
                            // Thicker left border indicator
                            borderLeftWidth: fuerApetito ? 3 : (bordesLimite.left ? 3 : 4),
                            borderLeftColor: fuerApetito ? '#d32f2f' : (bordesLimite.left ? '#d32f2f' : cellColor),

                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            cursor: riesgosValidosEnCelda.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            p: 0.25,
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: hexToRgba(cellColor, 0.5), // 50% de opacidad al hover
                              transform: riesgosValidosEnCelda.length > 0 ? 'scale(1.05)' : 'none',
                              zIndex: 10,
                            },
                            ml: 0.5,
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.25,
                            justifyContent: 'center',
                            width: '100%',
                            maxHeight: '100%',
                            overflow: 'hidden'
                          }}>
                            {visibleRiesgos.map((punto) => (
                              <Typography
                                key={punto.riesgoId}
                                variant="caption"
                                onClick={(e) => handleIdRiesgoClick(e, punto, tipo)}
                                sx={{
                                  fontSize: '0.55rem',
                                  lineHeight: 1.1,
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(255,255,255,0.8)',
                                  borderRadius: '2px',
                                  px: 0.25,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  color: '#000',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {generarIdRiesgo(punto)}
                              </Typography>
                            ))}
                            {remaining > 0 && (
                              <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#000' }}>
                                +{remaining}
                              </Typography>
                            )}
                          </Box>

                          {fuerApetito && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 1,
                                right: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#d32f2f',
                                zIndex: 5,
                              }}
                            >
                              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 'bold' }}>!</Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
              <Box display="flex" mt={0.5}>
                <Box sx={{ width: 50 }} />
                {probabilidades.map((prob) => {
                  const etiquetaProb = ejes?.probabilidad.find(p => p.valor === prob)?.nombre || '';

                  return (
                    <Box
                      key={prob}
                      sx={{
                        width: 60, // Reduced from 70
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        ml: 0.5,
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                        {prob}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.55rem', lineHeight: 1.1 }}>
                        {etiquetaProb}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box display="flex" justifyContent="center" mt={1}>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                  FRECUENCIA/PROBABILIDAD
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };




  // Estado para secciones expandidas en el diálogo
  const [seccionesExpandidas, setSeccionesExpandidas] = useState<{
    causas: boolean;
    residual: boolean;
    controles: boolean;
  }>({
    causas: false,
    residual: false,
    controles: false,
  });

  // Manejar clic en ID del riesgo individual
  const handleIdRiesgoClick = (e: React.MouseEvent, punto: PuntoMapa, tipoMapa: 'inherente' | 'residual' = 'inherente') => {
    e.stopPropagation(); // Evitar que se active el click de la celda
    // Buscar el riesgo completo con causas
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (riesgo) {
      setRiesgoSeleccionadoDetalle(riesgo);
      setPuntoSeleccionadoDetalle(punto);
      setTipoMapaDetalle(tipoMapa);
      setDialogoDetalleRiesgoAbierto(true);
      // Si es residual, expandir automáticamente la sección de controles
      setSeccionesExpandidas({ 
        causas: tipoMapa === 'residual', 
        residual: tipoMapa === 'residual', 
        controles: tipoMapa === 'residual' 
      });
    }
  };

  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles

  // Debug: Log para verificar datos
  console.log('MapaPage Debug:', {
    puntos: puntos?.length || 0,
    puntosFiltrados: puntosFiltrados?.length || 0,
    filtros,
    procesoIdFiltrado,
    clasificacion,
    isLoadingPuntos,
    isLoadingRiesgos,
    errorPuntos: errorPuntos ? 'Error presente' : 'Sin error',
    errorRiesgos: errorRiesgos ? 'Error presente' : 'Sin error',
    muestraPuntos: puntosFiltrados?.slice(0, 3).map(p => ({
      riesgoId: p.riesgoId,
      id: generarIdRiesgo(p),
      probabilidad: p.probabilidad,
      impacto: p.impacto,
      tipoProb: typeof p.probabilidad,
      tipoImp: typeof p.impacto,
      clave: `${p.probabilidad}-${p.impacto}`
    }))
  });

  // Validación removida - permite cargar sin proceso seleccionado
  // (Supervisor/Dueño puede ver el mapa sin seleccionar proceso específico - usa filtros locales)

  // Verificar si tiene asignaciones
  const sinAsignaciones = (esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesosPropios.length === 0;

  return (
    <Box>
      {/* Modal bloqueante si no tiene asignaciones */}
      {sinAsignaciones && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <VisibilityIcon
                sx={{ fontSize: 80, color: 'warning.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Aún no tiene procesos asignados
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Para acceder al mapa de riesgos, necesita que el administrador le asigne áreas o procesos para supervisar.
              </Typography>
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  ¿Qué debe hacer?
                </Typography>
                <Typography variant="body2">
                  Contacte al administrador del sistema para que le asigne las áreas y procesos correspondientes a su rol.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Contenido del mapa - solo visible si tiene asignaciones */}
      {!sinAsignaciones && (<>
        {/* Mostrar errores si existen */}
        {(errorPuntos || errorRiesgos) ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error al cargar los datos del mapa. Por favor, intente nuevamente.
          </Alert>
        ) : null}

        {/* Mostrar indicador de carga */}
        {(isLoadingPuntos || isLoadingRiesgos) && !errorPuntos && !errorRiesgos ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Cargando mapa de riesgos...
          </Alert>
        ) : null}

        {/* Mostrar mensaje si no hay datos pero no está cargando */}
        {!isLoadingPuntos && !isLoadingRiesgos && !errorPuntos && !errorRiesgos && puntosFiltrados.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No hay riesgos disponibles con los filtros seleccionados.
          </Alert>
        ) : null}

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
              Mapas de Calor de Riesgos
            </Typography>

          </Box>
          <Button
            variant={mostrarFueraApetito ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setDialogoRiesgosFueraApetitoAbierto(true)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Riesgos Fuera del Apetito
          </Button>
        </Box>

        <Grid2 container spacing={3}>
          {/* Columna principal: Filtros y Leyenda */}
          <Grid2 xs={12}>
            {/* Filter */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {(esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector || esGerenteGeneralProceso) && procesosPropios.length > 0 && (
                    <>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filtrar por Área</InputLabel>
                        <Select
                          value={filtroArea || 'all'}
                          onChange={(e) => {
                            setFiltroArea(e.target.value);
                            setFiltroProceso('all'); // Reset proceso cuando cambia área
                          }}
                          label="Filtrar por Área"
                        >
                          <MenuItem value="all">Todas las áreas</MenuItem>
                          {Array.from(new Set(procesosPropios.map(p => p.areaId).filter(Boolean))).map(areaId => {
                            const proceso = procesosPropios.find(p => p.areaId === areaId);
                            return (
                              <MenuItem key={areaId} value={String(areaId)}>
                                {proceso?.areaNombre || `Área ${areaId}`}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filtrar por Proceso</InputLabel>
                        <Select
                          value={filtroProceso || 'all'}
                          onChange={(e) => setFiltroProceso(e.target.value)}
                          label="Filtrar por Proceso"
                        >
                          <MenuItem value="all">Todos los procesos</MenuItem>
                          {procesosPropios
                            .filter(p => !filtroArea || filtroArea === 'all' || String(p.areaId) === String(filtroArea))
                            .map((proceso) => (
                              <MenuItem key={proceso.id} value={String(proceso.id)}>
                                {proceso.nombre}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Clasificación</InputLabel>
                    <Select
                      value={clasificacion}
                      onChange={(e) => setClasificacion(e.target.value)}
                      label="Clasificación"
                    >
                      <MenuItem value="all">Todas</MenuItem>
                      <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
                      <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>


            {/* Legend */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Leyenda
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {clasificacion === CLASIFICACION_RIESGO.POSITIVA ? (
                    // Leyenda Positiva (Azul/Gris)
                    <>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#1565c0', // Blue 800
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Extremo</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#42a5f5', // Blue 400
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Alto</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#757575', // Grey 600
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Medio</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#bdbdbd', // Grey 400
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Bajo</Typography>
                      </Box>
                    </>
                  ) : (
                    // Leyenda Negativa (Rojo/Naranja/Verde)
                    <>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: colors.risk.critical.main,
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Crítico (≥20)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: '#d32f2f',
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Muy Alto (15-19)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: colors.risk.high.main,
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Alto (10-14)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: colors.risk.medium.main,
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Medio (5-9)</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            backgroundColor: colors.risk.low.main,
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">Bajo (≤4)</Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Matrices lado a lado */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
              {/* Mapa de Riesgo Inherente */}
              <Grid2 xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
                      MAPA DE RIESGOS INHERENTE
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, overflowX: 'auto' }}>
                      {renderMatrix(matrizInherente, 'inherente')}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid2>

              {/* Mapa de Riesgo Residual */}
              <Grid2 xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
                      MAPA DE RIESGOS RESIDUAL
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, overflowX: 'auto' }}>
                      {renderMatrix(matrizResidual, 'residual')}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

          </Grid2>
        </Grid2>

        {/* Diálogo de Resumen */}
        <Dialog
          open={dialogoResumenAbierto}
          onClose={() => setDialogoResumenAbierto(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Riesgos en la Celda ({celdaSeleccionada?.probabilidad}, {celdaSeleccionada?.impacto})
          </DialogTitle>
          <DialogContent>
            {riesgosCeldaSeleccionada.length === 0 ? (
              <Alert severity="info">No hay riesgos en esta celda.</Alert>
            ) : (
              <List>
                {riesgosCeldaSeleccionada.map((punto) => {
                  const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                  
                  // Usar información del punto (que viene del backend) o del riesgo completo como fallback
                  const descripcion = punto.descripcion || riesgo?.descripcion || 'Sin descripción';
                  // Solo usar zona y tipologia si realmente existen y no son valores incorrectos conocidos
                  const zonaRaw = punto.zona || riesgo?.zona || null;
                  const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                  const tipologia = punto.tipologiaNivelI || riesgo?.tipologiaNivelI || null;
                  
                  console.log('[MapaPage] 📄 Mostrando riesgo en diálogo:', {
                    puntoId: punto.riesgoId,
                    id: generarIdRiesgo(punto),
                    numeroIdentificacion: punto.numeroIdentificacion,
                    siglaGerencia: punto.siglaGerencia,
                    numero: punto.numero,
                    prob: punto.probabilidad,
                    imp: punto.impacto,
                    tieneRiesgoCompleto: !!riesgo,
                    descripcion,
                    zona: punto.zona,
                    zonaRiesgo: riesgo?.zona,
                    tipologia: punto.tipologiaNivelI,
                    tipologiaRiesgo: riesgo?.tipologiaNivelI
                  });
                  
                  const handleSeleccionarRiesgo = () => {
                    if (riesgo) {
                      setRiesgoSeleccionadoDetalle(riesgo);
                      setPuntoSeleccionadoDetalle(punto);
                      setTipoMapaDetalle(tipoMapaSeleccionado);
                      setDialogoDetalleRiesgoAbierto(true);
                      setDialogoResumenAbierto(false);
                    }
                  };
                  
                  return (
                    <Card
                      key={punto.riesgoId}
                      sx={{
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
                      }}
                      onClick={handleSeleccionarRiesgo}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              ID: {generarIdRiesgo(punto)}
                            </Typography>
                            <Chip
                              label={punto.nivelRiesgo || 'Sin calificar'}
                              size="small"
                              sx={{
                                backgroundColor: getColorByNivelRiesgo(punto.nivelRiesgo),
                                color: '#fff',
                                mr: 1,
                              }}
                            />
                            <Chip
                              label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                              size="small"
                              color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                            />
                          </Box>

                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          <strong>Descripción:</strong> {descripcion}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2">
                            <strong>Probabilidad:</strong> {punto.probabilidad}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Impacto:</strong> {punto.impacto}
                          </Typography>
                          {zona && (
                            <Typography variant="body2">
                              <strong>Zona:</strong> {zona}
                            </Typography>
                          )}
                          {tipologia && (
                            <Typography variant="body2">
                              <strong>Tipología:</strong> {tipologia}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoResumenAbierto(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Detalles del Riesgo Individual */}
        <Dialog
          open={dialogoDetalleRiesgoAbierto}
          onClose={() => setDialogoDetalleRiesgoAbierto(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Resumen del Riesgo
              </Typography>
              {riesgoSeleccionadoDetalle && (
                <Chip
                  label={generarIdRiesgo(puntoSeleccionadoDetalle!)}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            {riesgoSeleccionadoDetalle && puntoSeleccionadoDetalle ? (
              <Box>
                {/* Información del Riesgo */}
                <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Información del Riesgo
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={puntoSeleccionadoDetalle.nivelRiesgo}
                        size="small"
                        sx={{
                          backgroundColor: getColorByNivelRiesgo(puntoSeleccionadoDetalle.nivelRiesgo),
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                        size="small"
                        color={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Descripción:</strong> {riesgoSeleccionadoDetalle.descripcion}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2">
                        <strong>Probabilidad:</strong> {puntoSeleccionadoDetalle.probabilidad}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Impacto:</strong> {puntoSeleccionadoDetalle.impacto}
                      </Typography>
                      {(() => {
                        const zonaRaw = puntoSeleccionadoDetalle?.zona || riesgoSeleccionadoDetalle.zona;
                        const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                        return zona ? (
                          <Typography variant="body2">
                            <strong>Zona:</strong> {zona}
                          </Typography>
                        ) : null;
                      })()}
                      {(puntoSeleccionadoDetalle?.tipologiaNivelI || riesgoSeleccionadoDetalle.tipologiaNivelI) && (
                        <Typography variant="body2">
                          <strong>Tipología:</strong> {puntoSeleccionadoDetalle?.tipologiaNivelI || riesgoSeleccionadoDetalle.tipologiaNivelI}
                        </Typography>
                      )}
                    </Box>

                    {/* Información del Proceso y Responsable */}
                    {(() => {
                      const procesoId = riesgoSeleccionadoDetalle.procesoId || puntoSeleccionadoDetalle?.procesoId;
                      const procesoNombre = puntoSeleccionadoDetalle?.procesoNombre || 
                        (procesoId ? procesos.find(p => String(p.id) === String(procesoId))?.nombre : null) ||
                        riesgoSeleccionadoDetalle.procesoNombre ||
                        'Proceso desconocido';
                      
                      if (procesoId) {
                        const procesoRiesgo = procesos.find(p => String(p.id) === String(procesoId));
                        return (
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                              Información del Proceso
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Proceso:</strong> {procesoNombre}
                              </Typography>
                              {procesoRiesgo?.responsableNombre && (
                                <Typography variant="body2">
                                  <strong>Responsable (Dueño del Proceso):</strong>{' '}
                                  <Chip
                                    label={procesoRiesgo.responsableNombre}
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 0.5 }}
                                  />
                                </Typography>
                              )}
                              {procesoRiesgo?.areaNombre && (
                                <Typography variant="body2">
                                  <strong>Área:</strong> {procesoRiesgo.areaNombre}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Card>

                {/* Evaluación del Riesgo */}
                {evaluacionRiesgo ? (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight={600}>
                        Evaluación del Riesgo
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Probabilidad</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {evaluacionRiesgo.probabilidad}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Impacto Global</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {evaluacionRiesgo.impactoGlobal}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Riesgo Inherente</Typography>
                          <Typography variant="h6" fontWeight={600} color="error">
                            {evaluacionRiesgo.riesgoInherente}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Nivel de Riesgo</Typography>
                          <Chip
                            label={evaluacionRiesgo.nivelRiesgo}
                            size="small"
                            sx={{
                              backgroundColor: getColorByNivelRiesgo(evaluacionRiesgo.nivelRiesgo),
                              color: '#fff',
                              fontWeight: 600,
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        Impactos por Dimensión
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Personas</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoPersonas}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Legal</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoLegal}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Ambiental</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoAmbiental}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Procesos</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoProcesos}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Reputación</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoReputacion}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Económico</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoEconomico}</Typography>
                        </Box>
                      </Box>
                      {evaluacionRiesgo.evaluadoPor && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Evaluado por: <strong>{evaluacionRiesgo.evaluadoPor}</strong>
                          </Typography>
                          {evaluacionRiesgo.fechaEvaluacion && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Fecha: {new Date(evaluacionRiesgo.fechaEvaluacion).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Este riesgo aún no tiene evaluación registrada.
                  </Alert>
                )}

                {/* Causas del Riesgo - Expandible */}
                {riesgoSeleccionadoDetalle && (riesgoSeleccionadoDetalle.causas as any) && (riesgoSeleccionadoDetalle.causas as any).length > 0 && (
                  <Accordion 
                    expanded={seccionesExpandidas.causas}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, causas: !prev.causas }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Causas Identificadas ({(riesgoSeleccionadoDetalle.causas as any)?.length || 0})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell><strong>Descripción</strong></TableCell>
                              <TableCell><strong>Fuente</strong></TableCell>
                              <TableCell align="center"><strong>Frecuencia</strong></TableCell>
                              <TableCell align="center"><strong>Calificación Inherente</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {((riesgoSeleccionadoDetalle.causas as any) || []).map((causa: any, idx: number) => (
                              <TableRow key={causa.id || idx}>
                                <TableCell>{causa.descripcion || 'Sin descripción'}</TableCell>
                                <TableCell>{causa.fuenteCausa || 'N/A'}</TableCell>
                                <TableCell align="center">{causa.frecuencia || 'N/A'}</TableCell>
                                <TableCell align="center">
                                  {causa.calificacionInherentePorCausa !== undefined && causa.calificacionInherentePorCausa !== null
                                    ? causa.calificacionInherentePorCausa.toFixed(2)
                                    : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Información Residual - Expandible */}
                {evaluacionRiesgo && ((evaluacionRiesgo as any).probabilidadResidual || (evaluacionRiesgo as any).impactoResidual) && (
                  <Accordion 
                    expanded={seccionesExpandidas.residual}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, residual: !prev.residual }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Evaluación Residual
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Probabilidad Residual</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {(evaluacionRiesgo as any).probabilidadResidual || puntoSeleccionadoDetalle?.probabilidadResidual || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Impacto Residual</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {(evaluacionRiesgo as any).impactoResidual || puntoSeleccionadoDetalle?.impactoResidual || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Riesgo Residual</Typography>
                          <Typography variant="h6" fontWeight={600} color="success.main">
                            {(evaluacionRiesgo as any).riesgoResidual || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Nivel Riesgo Residual</Typography>
                          <Chip
                            label={(evaluacionRiesgo as any).nivelRiesgoResidual || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: getColorByNivelRiesgo((evaluacionRiesgo as any).nivelRiesgoResidual),
                              color: '#fff',
                              fontWeight: 600,
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Controles Aplicados - Solo mostrar si es mapa residual */}
                {tipoMapaDetalle === 'residual' && riesgoSeleccionadoDetalle && (riesgoSeleccionadoDetalle.causas as any) && (riesgoSeleccionadoDetalle.causas as any).length > 0 && (
                  <Accordion 
                    expanded={seccionesExpandidas.controles}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, controles: !prev.controles }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Controles Aplicados ({(riesgoSeleccionadoDetalle.causas as any).filter((c: any) => {
                          const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                          return tipo === 'CONTROL';
                        }).length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell><strong>Causa Original</strong></TableCell>
                              <TableCell><strong>Control</strong></TableCell>
                              <TableCell align="center"><strong>Efectividad</strong></TableCell>
                              <TableCell align="center"><strong>% Mitigación</strong></TableCell>
                              <TableCell align="center"><strong>Frec. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Imp. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Calif. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Nivel Residual</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {((riesgoSeleccionadoDetalle.causas as any) || [])
                              .filter((c: any) => {
                                const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                                return tipo === 'CONTROL';
                              })
                              .map((causa: any, idx: number) => {
                                // Leer datos del control desde gestion JSON o directamente
                                let gestionJson: any = null;
                                try {
                                  if (causa.gestion && typeof causa.gestion === 'string') {
                                    gestionJson = JSON.parse(causa.gestion);
                                  } else if (causa.gestion && typeof causa.gestion === 'object') {
                                    gestionJson = causa.gestion;
                                  }
                                } catch (e) {
                                  console.warn(`Error parsing gestion JSON para causa ${causa.id}:`, e);
                                }

                                const controlDescripcion = gestionJson?.controlDescripcion || causa.controlDescripcion || 'Sin descripción';
                                const efectividad = gestionJson?.evaluacionDefinitiva || causa.evaluacionDefinitiva || 'Sin evaluar';
                                const porcentajeMitigacion = gestionJson?.porcentajeMitigacion || causa.porcentajeMitigacion || 0;
                                const frecuenciaResidual = gestionJson?.frecuenciaResidual || causa.frecuenciaResidual || 'N/A';
                                const impactoResidual = gestionJson?.impactoResidual || causa.impactoResidual || 'N/A';
                                const calificacionResidual = gestionJson?.calificacionResidual || gestionJson?.riesgoResidual || causa.calificacionResidual || causa.riesgoResidual || 'N/A';
                                const nivelRiesgoResidual = gestionJson?.nivelRiesgoResidual || causa.nivelRiesgoResidual || 'N/A';

                                return (
                                  <TableRow key={causa.id || idx}>
                                    <TableCell sx={{ maxWidth: 200 }}>{causa.descripcion || 'Sin descripción'}</TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>{controlDescripcion}</TableCell>
                                    <TableCell align="center">{efectividad}</TableCell>
                                    <TableCell align="center">
                                      {porcentajeMitigacion > 0 ? `${(porcentajeMitigacion * 100).toFixed(0)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">{frecuenciaResidual}</TableCell>
                                    <TableCell align="center">{impactoResidual}</TableCell>
                                    <TableCell align="center">
                                      {typeof calificacionResidual === 'number' ? calificacionResidual.toFixed(2) : calificacionResidual}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={nivelRiesgoResidual}
                                        size="small"
                                        sx={{
                                          backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual),
                                          color: '#fff',
                                          fontWeight: 600,
                                          fontSize: '0.65rem',
                                          height: 20,
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoDetalleRiesgoAbierto(false)}>
              Cerrar
            </Button>

          </DialogActions>
        </Dialog>

        {/* Diálogo de Riesgos Fuera del Apetito */}
        <Dialog
          open={dialogoRiesgosFueraApetitoAbierto}
          onClose={() => setDialogoRiesgosFueraApetitoAbierto(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600} color="error">
                Riesgos Fuera del Límite (Residuales)
              </Typography>
              <Chip
                label={`${riesgosFueraLimite.length} riesgo${riesgosFueraLimite.length !== 1 ? 's' : ''}`}
                color="error"
                size="small"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Los siguientes riesgos residuales tienen un valor ≥ al límite configurado y requieren atención inmediata.
            </Alert>
            {riesgosFueraLimite.length === 0 ? (
              <Alert severity="success">
                No hay riesgos fuera del apetito. Todos los riesgos están dentro del nivel aceptable.
              </Alert>
            ) : (
              <List>
                {riesgosFueraLimite.map(({ punto, riesgo, valorRiesgo }) => (
                  <Card key={punto.riesgoId} sx={{ mb: 2, border: '2px solid', borderColor: getCellColor(punto.probabilidad, punto.impacto) }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            ID: {generarIdRiesgo(punto)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip
                              label={punto.nivelRiesgo}
                              size="small"
                              sx={{
                                backgroundColor: getCellColor(punto.probabilidad, punto.impacto),
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                            <Chip
                              label={`Valor: ${valorRiesgo}`}
                              size="small"
                              color="error"
                            />
                            {riesgo?.procesoId && (
                              <Chip
                                label={procesos.find((p) => p.id === riesgo.procesoId)?.nombre || 'Sin proceso'}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            if (riesgo) {
                              setRiesgoSeleccionadoDetalle(riesgo);
                              setPuntoSeleccionadoDetalle(punto);
                              setDialogoDetalleRiesgoAbierto(true);
                              setDialogoRiesgosFueraApetitoAbierto(false);
                            }
                          }}
                        >
                          Ver Detalle
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Descripción:</strong> {punto.descripcion || riesgo?.descripcion || 'Sin descripción'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                          <strong>Probabilidad:</strong> {punto.probabilidad}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Impacto:</strong> {punto.impacto}
                        </Typography>
                        {(() => {
                          const zonaRaw = punto.zona || riesgo?.zona;
                          const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                          return zona ? (
                            <Typography variant="body2">
                              <strong>Zona:</strong> {zona}
                            </Typography>
                          ) : null;
                        })()}
                        {(punto.tipologiaNivelI || riesgo?.tipologiaNivelI) && (
                          <Typography variant="body2">
                            <strong>Tipología:</strong> {punto.tipologiaNivelI || riesgo?.tipologiaNivelI}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoRiesgosFueraApetitoAbierto(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Resumen de Estadísticas: Comparativa Inherente vs Residual */}
        <ResumenEstadisticasMapas
          matrizInherente={matrizInherente}
          matrizResidual={matrizResidual}
          procesos={procesos}
          filtroArea={filtroArea}
          filtroProceso={filtroProceso}
          puntosFiltrados={puntosFiltrados}
        />
      </>)}
    </Box>
  );
}


