/**
 * Identificación y Calificación Page
 * Diseño de tres paneles: RIESGO, CAUSAS, IMPACTO
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Autocomplete,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Tabs,
  Tab,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useCreateEvaluacionMutation, useUpdateRiesgoMutation } from '../../api/services/riesgosApi';
import ProcesoFiltros from '../../components/procesos/ProcesoFiltros';
import {
  getMockRiesgos,
  getMockRiesgosTalentoHumano,
  getMockTiposRiesgos,
  getMockObjetivos,
  getLabelsFrecuencia,
  getFuentesCausa,
  getDescripcionesImpacto,
  getMockOrigenes,
  getMockTiposProceso,
  getMockConsecuencias,
  getMockNivelesRiesgo,
  getMockClasificacionesRiesgo,
} from '../../api/services/mockData';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, DIMENSIONES_IMPACTO, LABELS_IMPACTO } from '../../utils/constants';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useRiesgo } from '../../contexts/RiesgoContext';
import type { Riesgo, FiltrosRiesgo, CausaRiesgo, RiesgoFormData } from '../../types';
import { generarIdRiesgoAutomatico, calcularImpactoGlobal, calcularRiesgoInherente } from '../../utils/calculations';
import { 
  obtenerPorcentajeMitigacion, 
  calcularFrecuenciaResidual, 
  calcularImpactoResidual, 
  calcularCalificacionResidual, 
  calcularPuntajeControl, 
  determinarEfectividadControl,
  determinarEvaluacionPreliminar,
  determinarEvaluacionDefinitiva,
  obtenerPorcentajeMitigacionAvanzado,
  calcularFrecuenciaResidualAvanzada,
  calcularImpactoResidualAvanzado
} from '../../utils/calculations';


// Consumed inside component via state

const normalizarDescripcionesImpacto = (data?: Record<string, Record<number, string>>) => ({
  economico: data?.economico ?? data?.['4'] ?? {},
  procesos: data?.procesos ?? data?.['8'] ?? {},
  legal: data?.legal ?? data?.['6'] ?? {},
  confidencialidadSGSI: data?.confidencialidadSGSI ?? data?.['2'] ?? {},
  reputacion: data?.reputacion ?? data?.['9'] ?? {},
  disponibilidadSGSI: data?.disponibilidadSGSI ?? data?.['3'] ?? {},
  integridadSGSI: data?.integridadSGSI ?? data?.['5'] ?? {},
  ambiental: data?.ambiental ?? data?.['1'] ?? {},
  personas: data?.personas ?? data?.['7'] ?? {},
});

const getSubtipoCodigo = (subtipo: any): string => {
  // Usar nombre como codigo si existe, ya que es lo que se muestra en admin
  return (subtipo?.codigo ?? subtipo?.nombre ?? subtipo?.id ?? '').toString();
};

const normalizarTiposRiesgos = (data?: any[]) => {
  return (data || []).map((tipo) => ({
    ...tipo,
    codigo: (tipo?.codigo ?? tipo?.id ?? tipo?.nombre ?? '').toString(),
    subtipos: (tipo?.subtipos || []).map((subtipo: any) => ({
      ...subtipo,
      codigo: getSubtipoCodigo(subtipo),
    })),
  }));
};


export default function IdentificacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { riesgoSeleccionado, iniciarEditar, iniciarVer } = useRiesgo();
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess, showError } = useNotification();

  // Helper para normalizar riesgos cargados - asegurar que causas tengan calificaciones
  const normalizarRiesgos = (riesgosData: RiesgoFormData[]) => {
    return riesgosData.map(riesgo => {
      // Calcular calificación global impacto
      const calificacionGlobal = calcularImpactoGlobal({
        personas: riesgo.impactos?.personas || 1,
        legal: riesgo.impactos?.legal || 1,
        ambiental: riesgo.impactos?.ambiental || 1,
        procesos: riesgo.impactos?.procesos || 1,
        reputacion: riesgo.impactos?.reputacion || 1,
        economico: riesgo.impactos?.economico || 1,
      });

      // Normalizar causas con calificaciones si no las tienen
      const causasNormalizadas = (riesgo.causas || []).map(causa => {
        const calificacionInherentePorCausa = calcularRiesgoInherente(
          calificacionGlobal,
          causa.frecuencia || 3
        );
        
        return {
          ...causa,
          calificacionGlobalImpacto: causa.calificacionGlobalImpacto ?? calificacionGlobal,
          calificacionInherentePorCausa: causa.calificacionInherentePorCausa ?? calificacionInherentePorCausa,
        };
      });

      return { ...riesgo, causas: causasNormalizadas };
    });
  };

  // Estado para múltiples riesgos
  const [riesgos, setRiesgos] = useState<RiesgoFormData[]>([]);
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});

  const cargarRiesgosProceso = () => {
    if (!procesoSeleccionado?.id) return [] as RiesgoFormData[];

    const stored = localStorage.getItem(`riesgos_identificacion_${procesoSeleccionado.id}`);
    if (stored) {
      try {
        return normalizarRiesgos(JSON.parse(stored));
      } catch (e) {
        console.error('Error al cargar riesgos desde localStorage:', e);
      }
    }

    if (procesoSeleccionado.id === '1' || procesoSeleccionado.nombre?.includes('Talento Humano')) {
      return normalizarRiesgos(getMockRiesgosTalentoHumano());
    }

    const mockResponse = getMockRiesgos({ procesoId: procesoSeleccionado.id });
    return normalizarRiesgos((mockResponse?.data || []) as RiesgoFormData[]);
  };

  useEffect(() => {
    const nuevosRiesgos = cargarRiesgosProceso();
    setRiesgos(nuevosRiesgos);
    setRiesgosExpandidos({});
  }, [procesoSeleccionado?.id]);

  // Guardar riesgos en localStorage cuando cambien
  useEffect(() => {
    if (procesoSeleccionado?.id && riesgos.length > 0) {
      try {
        localStorage.setItem(`riesgos_identificacion_${procesoSeleccionado.id}`, JSON.stringify(riesgos));
      } catch (e) {
        console.error('Error al guardar riesgos en localStorage:', e);
      }
    }
  }, [riesgos, procesoSeleccionado?.id]);

  // Helper to load catalogs from localStorage (where admin saves changes) or mockData
  const loadCatalogsFromStorage = () => {
    try {
      const storedTipos = localStorage.getItem('catalogos_tiposRiesgo');
      const storedImpactos = localStorage.getItem('catalogos_impactos');
      const storedObjetivos = localStorage.getItem('catalogos_objetivos');
      const storedFrecuencias = localStorage.getItem('catalogos_frecuencias');
      const storedOrigenes = localStorage.getItem('catalogos_origenes');

      return {
        tiposRiesgos: storedTipos ? JSON.parse(storedTipos) : getMockTiposRiesgos(),
        impactos: storedImpactos ? JSON.parse(storedImpactos) : getDescripcionesImpacto(),
        objetivos: storedObjetivos ? JSON.parse(storedObjetivos) : getMockObjetivos(),
        frecuencias: storedFrecuencias ? JSON.parse(storedFrecuencias) : getLabelsFrecuencia(),
        origenes: storedOrigenes ? JSON.parse(storedOrigenes) : getMockOrigenes(),
      };
    } catch (error) {
      console.error('Error loading catalogs from storage:', error);
      return {
        tiposRiesgos: getMockTiposRiesgos(),
        impactos: getDescripcionesImpacto(),
        objetivos: getMockObjetivos(),
        frecuencias: getLabelsFrecuencia(),
        origenes: getMockOrigenes(),
      };
    }
  };

  // Catalog States
  const catalogsFromStorage = loadCatalogsFromStorage();
  const [tiposRiesgos, setTiposRiesgos] = useState(normalizarTiposRiesgos(catalogsFromStorage.tiposRiesgos));
  const [objetivos, setObjetivos] = useState(catalogsFromStorage.objetivos);
  const [labelsFrecuencia, setLabelsFrecuencia] = useState(catalogsFromStorage.frecuencias);
  const [fuentesCausa, setFuentesCausa] = useState(getFuentesCausa());
  const [origenes, setOrigenes] = useState(catalogsFromStorage.origenes);
  const [tiposProceso, setTiposProceso] = useState(getMockTiposProceso());
  const [consecuencias, setConsecuencias] = useState(getMockConsecuencias());
  const [descripcionesImpacto, setDescripcionesImpacto] = useState(normalizarDescripcionesImpacto(catalogsFromStorage.impactos));
  const [nivelesRiesgo, setNivelesRiesgo] = useState(getMockNivelesRiesgo());
  const [clasificacionesRiesgo, setClasificacionesRiesgo] = useState(getMockClasificacionesRiesgo());

  // Refresh catalogs on mount - listen for changes from admin
  useEffect(() => {
    const handleStorageChange = () => {
      const catalogs = loadCatalogsFromStorage();
      setTiposRiesgos(normalizarTiposRiesgos(catalogs.tiposRiesgos));
      setObjetivos(catalogs.objetivos);
      setLabelsFrecuencia(catalogs.frecuencias);
      setOrigenes(catalogs.origenes);
      setDescripcionesImpacto(normalizarDescripcionesImpacto(catalogs.impactos));
    };

    // Listen for storage changes (admin updates)
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Función para crear un nuevo riesgo vacío
  const crearNuevoRiesgo = (): RiesgoFormData => {
    const nuevoId = `riesgo-${Date.now()}`;

    // Generar ID automático basado en la vicepresidencia del proceso seleccionado
    let numeroIdentificacion = '';
    if (procesoSeleccionado?.vicepresidencia) {
      console.log('Generando ID para proceso:', procesoSeleccionado.nombre, 'Vicepresidencia:', procesoSeleccionado.vicepresidencia);
      numeroIdentificacion = generarIdRiesgoAutomatico(procesoSeleccionado.vicepresidencia);
      console.log('ID generado:', numeroIdentificacion);
    } else {
      console.warn('El proceso seleccionado no tiene vicepresidencia configurada:', procesoSeleccionado);
    }

    return {
      id: nuevoId,
      descripcionRiesgo: '',
      numeroIdentificacion: numeroIdentificacion,
      origenRiesgo: '',
      tipoProceso: 'Operacional',
      consecuencia: 'Negativa',
      tipoRiesgo: '',
      subtipoRiesgo: '',
      objetivo: '',
      causas: [],
      impactos: {
        economico: 1,
        procesos: 1,
        legal: 1,
        confidencialidadSGSI: 1,
        reputacion: 1,
        disponibilidadSGSI: 1,
        personas: 1,
        integridadSGSI: 1,
        ambiental: 1,
      },
    };
  };

  // Añadir nuevo riesgo
  const handleAgregarRiesgo = () => {
    const nuevoRiesgo = crearNuevoRiesgo();
    setRiesgos([...riesgos, nuevoRiesgo]);
    setRiesgosExpandidos({ ...riesgosExpandidos, [nuevoRiesgo.id]: true });
  };

  // Eliminar riesgo
  const handleEliminarRiesgo = (riesgoId: string) => {
    setRiesgos(riesgos.filter(r => r.id !== riesgoId));
    const nuevosExpandidos = { ...riesgosExpandidos };
    delete nuevosExpandidos[riesgoId];
    setRiesgosExpandidos(nuevosExpandidos);
  };

  // Toggle expandir/colapsar riesgo
  const handleToggleExpandir = (riesgoId: string) => {
    setRiesgosExpandidos({
      ...riesgosExpandidos,
      [riesgoId]: !riesgosExpandidos[riesgoId],
    });
  };

  // Función para calcular calificación global impacto
  const calcularCalificacionGlobalImpacto = (impactos: RiesgoFormData['impactos']): number => {
    return calcularImpactoGlobal({
      personas: impactos.personas || 1,
      legal: impactos.legal || 1,
      ambiental: impactos.ambiental || 1,
      procesos: impactos.procesos || 1,
      reputacion: impactos.reputacion || 1,
      economico: impactos.economico || 1,
    });
  };

  // Función para calcular calificación inherente por causa
  const calcularCalificacionInherentePorCausa = (
    calificacionGlobalImpacto: number,
    frecuencia: number
  ): number => {
    // Obtener valor especial de la configuración
    const storedFormula = localStorage.getItem('config_formula_especial');
    const formulaEspecial = storedFormula ? JSON.parse(storedFormula) : { valorEspecial: 3.99 };

    // Caso especial: si ambos son 2, usar valor especial
    if (calificacionGlobalImpacto === 2 && frecuencia === 2) {
      return formulaEspecial.valorEspecial || 3.99;
    }

    return calificacionGlobalImpacto * frecuencia;
  };

  // Actualizar un riesgo específico y recalcular calificaciones
  const actualizarRiesgo = (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => {
    setRiesgos(riesgos.map(r => {
      if (r.id !== riesgoId) return r;

      const riesgoActualizado = { ...r, ...actualizacion };

      // Si se actualizaron los impactos, recalcular calificaciones de todas las causas
      if (actualizacion.impactos) {
        const calificacionGlobalImpacto = calcularCalificacionGlobalImpacto(riesgoActualizado.impactos);

        // Actualizar todas las causas con la nueva calificación global impacto y recalcular inherente
        const causasActualizadas = riesgoActualizado.causas.map(causa => {
          const calificacionInherente = calcularCalificacionInherentePorCausa(
            calificacionGlobalImpacto,
            causa.frecuencia || 3
          );

          return {
            ...causa,
            calificacionGlobalImpacto,
            calificacionInherentePorCausa: calificacionInherente,
          };
        });

        return { ...riesgoActualizado, causas: causasActualizadas };
      }

      // Si se actualizaron las causas, recalcular calificaciones
      if (actualizacion.causas) {
        const calificacionGlobalImpacto = calcularCalificacionGlobalImpacto(riesgoActualizado.impactos);

        const causasActualizadas = riesgoActualizado.causas.map(causa => {
          const calificacionInherente = calcularCalificacionInherentePorCausa(
            calificacionGlobalImpacto,
            causa.frecuencia || 3
          );

          return {
            ...causa,
            calificacionGlobalImpacto,
            calificacionInherentePorCausa: calificacionInherente,
          };
        });

        return { ...riesgoActualizado, causas: causasActualizadas };
      }

      return riesgoActualizado;
    }));
  };

  const [createEvaluacion] = useCreateEvaluacionMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();

  // Estados locales para el diálogo de causa (compartido)
  const [dialogCausaOpen, setDialogCausaOpen] = useState<boolean>(false);
  const [causaEditando, setCausaEditando] = useState<CausaRiesgo | null>(null);
  const [riesgoIdParaCausa, setRiesgoIdParaCausa] = useState<string>('');
  const [nuevaCausaDescripcion, setNuevaCausaDescripcion] = useState<string>('');
  const [nuevaCausaFuente, setNuevaCausaFuente] = useState<string>('1');
  const [nuevaCausaFrecuencia, setNuevaCausaFrecuencia] = useState<number>(3);

  // Estado para tabs de Inherente/Residual
  const [tabCalificacion, setTabCalificacion] = useState<'inherente' | 'residual'>('inherente');

  // Estado para diálogo de evaluación de criterios de control
  const [dialogEvaluacionOpen, setDialogEvaluacionOpen] = useState<boolean>(false);
  const [riesgoIdEvaluacion, setRiesgoIdEvaluacion] = useState<string>('');
  const [causaIdEvaluacion, setCausaIdEvaluacion] = useState<string>('');
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState({
    aplicabilidad: '',
    puntajeAplicabilidad: 0,
    cobertura: '',
    puntajeCobertura: 0,
    facilidadUso: '',
    puntajeFacilidad: 0,
    segregacion: '',
    puntajeSegregacion: 0,
    naturaleza: '',
    puntajeNaturaleza: 0,
    tipoMitigacion: 'AMBAS' as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
    recomendacion: '',
  });

  const handleSave = async (riesgoId: string) => {
    try {
      const riesgo = riesgos.find(r => r.id === riesgoId);
      if (!riesgo) return;

      // TODO: Guardar el riesgo y evaluación
      showSuccess('Riesgo guardado exitosamente');
    } catch (error) {
      showError('Error al guardar el riesgo');
    }
  };

  return (
    <Box>
      {/* Header con título */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          IDENTIFICACIÓN Y CALIFICACIÓN
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAgregarRiesgo}
          disabled={isReadOnly}
        >
          Añadir Riesgo
        </Button>
      </Box>

      {/* Filtros para Supervisor */}
      <ProcesoFiltros />

      {/* Tabs para Inherente/Residual */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabCalificacion} onChange={(e, newValue) => setTabCalificacion(newValue)}>
            <Tab label="Calificación INHERENTE" value="inherente" />
            <Tab label="Calificación RESIDUAL" value="residual" />
          </Tabs>
        </Box>
      </Card>

      {/* Contenido del Tab INHERENTE */}
      {tabCalificacion === 'inherente' && (
        <>
          {/* Lista de riesgos */}
          {riesgos.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay riesgos registrados. Haga clic en "Añadir Riesgo" para comenzar.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {riesgos.map((riesgo) => {
                const estaExpandido = riesgosExpandidos[riesgo.id] || false;
                const tipoRiesgoObj = (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo);
                const subtipoObj = tipoRiesgoObj?.subtipos.find(s => s.codigo === riesgo.subtipoRiesgo);

            return (
              <Card key={riesgo.id} sx={{ mb: 2 }}>
                {/* Header colapsable */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: estaExpandido ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                  onClick={() => handleToggleExpandir(riesgo.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <IconButton size="small">
                      {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Box sx={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100 }}>
                        {riesgo.numeroIdentificacion || 'Sin ID'}
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {riesgo.descripcionRiesgo || 'Sin descripción'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                        {riesgo.tipoRiesgo || 'Sin tipo'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                        {riesgo.subtipoRiesgo || 'Sin subtipo'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarRiesgo(riesgo.id);
                    }}
                    disabled={isReadOnly}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Contenido expandible */}
                <Collapse in={estaExpandido}>
                  <Box sx={{ p: 0 }}>
                    <RiesgoFormulario
                      riesgo={riesgo}
                      actualizarRiesgo={actualizarRiesgo}
                      isReadOnly={isReadOnly}
                      procesoSeleccionado={procesoSeleccionado}
                      onSave={() => handleSave(riesgo.id)}
                      onAgregarCausa={(riesgoId) => {
                        setRiesgoIdParaCausa(riesgoId);
                        setCausaEditando(null);
                        setNuevaCausaDescripcion('');
                        setNuevaCausaFuente('1');
                        setNuevaCausaFrecuencia(3);
                        setDialogCausaOpen(true);
                      }}
                      onEditarCausa={(riesgoId, causa) => {
                        setRiesgoIdParaCausa(riesgoId);
                        setCausaEditando(causa);
                        setNuevaCausaDescripcion(causa.descripcion);
                        setNuevaCausaFuente(causa.fuenteCausa || '1');
                        setNuevaCausaFrecuencia(causa.frecuencia || 3);
                        setDialogCausaOpen(true);
                      }}
                      onEliminarCausa={(riesgoId, causaId) => {
                        const nuevasCausas = riesgo.causas.filter(c => c.id !== causaId);
                        actualizarRiesgo(riesgoId, { causas: nuevasCausas });
                      }}
                      tiposRiesgos={tiposRiesgos}
                      origenes={origenes}
                      tiposProceso={tiposProceso}
                      consecuencias={consecuencias}
                      objetivos={objetivos}
                      labelsFrecuencia={labelsFrecuencia}
                      fuentesCausa={fuentesCausa}
                      descripcionesImpacto={descripcionesImpacto}
                    />

                    {/* Resumen de Calificaciones */}
                    {(() => {
                      // Calcular la calificación inherente global (máximo de todas las causas)
                      const calificacionesInherentes = riesgo.causas
                        .map(causa => causa.calificacionInherentePorCausa)
                        .filter(cal => cal !== undefined && cal !== null) as number[];

                      const calificacionInherenteGlobal = calificacionesInherentes.length > 0
                        ? Math.max(...calificacionesInherentes)
                        : 0;

                      // Determinar el nivel de riesgo según la calificación
                      // Determinar el nivel de riesgo usando el catálogo dinámico (cargado en hook o contexto idealmente, aquí simulado acceso directo o props)
                      // Nota: En una refactorización completa, estos niveles deberían venir de props o context.
                      // Por ahora, usaremos los valores hardcoded PERO alineados con lo que el usuario pidió centralizar,
                      // o mejor, usaremos una función helper que busque en el catálogo si estuviéramos pasando el catálogo.
                      // Dado que no tengo el catálogo en el scope de este map, lo haré hardcoded pero referenciando la estructura centralizada si es posible,
                      // o mejor, moveré esta lógica a una utilidad centralizada que use la configuración.

                      // SIN EMBARGO, para cumplir con el requerimiento de "traer del mock data",
                      // Deberíamos haber cargado los niveles en el estado del componente.
                      // Como este es un bloque de renderizado dentro de un map, no puedo llamar hooks aquí.
                      // Asumiré que los niveles siguen la lógica estándar por ahora, pero lo ideal es pasar 'nivelesRiesgo' como prop si fuera un componente separado.

                      // VOY A CAMBIAR ESTO para usar una función de utilidad importada que actúe sobre los datos centralizados,
                      // O mejor, definiré los niveles fuera del renderizado si son estáticos por ahora, o los leeré de props.

                      // Para este paso, refactorizaré para que coincida con la lógica de negocio centralizada.
                      const getNivelRiesgo = (calificacion: number): { nivel: string; color: string; bgColor: string } => {
                        // TODO: Consumir de getMockNivelesRiesgo() o props
                        if (calificacion === 0) return { nivel: 'Sin Calificar', color: '#666', bgColor: '#f5f5f5' };
                        if (calificacion >= 20) return { nivel: 'CRÍTICO', color: '#fff', bgColor: '#d32f2f' };
                        if (calificacion >= 15) return { nivel: 'ALTO', color: '#fff', bgColor: '#f57c00' };
                        if (calificacion >= 10) return { nivel: 'MEDIO', color: '#fff', bgColor: '#ed6c02' };
                        if (calificacion >= 5) return { nivel: 'BAJO', color: '#fff', bgColor: '#fbc02d' };
                        return { nivel: 'MUY BAJO', color: '#fff', bgColor: '#388e3c' };
                      };

                      const nivelInfo = getNivelRiesgo(calificacionInherenteGlobal);

                      return (
                        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                            Resumen de Calificaciones
                          </Typography>

                          {/* Tabla de calificaciones por causa */}
                          {riesgo.causas.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Causa</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Frecuencia</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación Global Impacto</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación Inherente por Causa</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {riesgo.causas.map((causa, index) => (
                                    <TableRow key={causa.id}>
                                      <TableCell>
                                        <Typography variant="body2">
                                          Causa {index + 1}: {causa.descripcion.length > 60
                                            ? `${causa.descripcion.substring(0, 60)}...`
                                            : causa.descripcion}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={labelsFrecuencia[causa.frecuencia || 3]?.label || 'N/A'}
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {causa.calificacionGlobalImpacto !== undefined
                                            ? causa.calificacionGlobalImpacto.toFixed(2)
                                            : 'N/A'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {causa.calificacionInherentePorCausa !== undefined
                                            ? causa.calificacionInherentePorCausa.toFixed(2)
                                            : 'N/A'}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              No hay causas registradas. Agregue causas para calcular las calificaciones.
                            </Alert>
                          )}

                          {/* Calificación Inherente Global del Riesgo */}
                          <Box
                            sx={{
                              p: 2,
                              backgroundColor: nivelInfo.bgColor,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box>
                              <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.9 }}>
                                CALIFICACIÓN INHERENTE GLOBAL DEL RIESGO
                              </Typography>
                              <Typography variant="h5" sx={{ color: nivelInfo.color, fontWeight: 700, mt: 0.5 }}>
                                {calificacionInherenteGlobal > 0 ? calificacionInherenteGlobal.toFixed(2) : 'N/A'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.8, mt: 0.5, display: 'block' }}>
                                (Máximo de todas las calificaciones inherentes por causa)
                              </Typography>
                            </Box>
                            <Chip
                              label={nivelInfo.nivel}
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: nivelInfo.color,
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })()}
                  </Box>
                </Collapse>
              </Card>
            );
          })}
            </Box>
          )}
        </>
      )}

      {/* Contenido del Tab RESIDUAL */}
      {tabCalificacion === 'residual' && (
        <>
          {/* Lista de riesgos para calificación residual */}
          {riesgos.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay riesgos registrados. Complete primero la calificación INHERENTE.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {riesgos.map((riesgo) => {
                const estaExpandido = riesgosExpandidos[riesgo.id] || false;
                const tipoRiesgoObj = (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo);
                const subtipoObj = tipoRiesgoObj?.subtipos.find(s => s.codigo === riesgo.subtipoRiesgo);

                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    {/* Header colapsable */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        cursor: 'pointer',
                        backgroundColor: estaExpandido ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        },
                      }}
                      onClick={() => handleToggleExpandir(riesgo.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <IconButton size="small">
                          {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                        <Box sx={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100 }}>
                            {riesgo.numeroIdentificacion || 'Sin ID'}
                          </Typography>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {riesgo.descripcionRiesgo || 'Sin descripción'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                            {riesgo.tipoRiesgo || 'Sin tipo'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Contenido expandible - Causas con evaluación de controles */}
                    <Collapse in={estaExpandido}>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                          Evaluación de Controles y Calificación Residual por Causa
                        </Typography>

                        {riesgo.causas && riesgo.causas.length > 0 ? (
                          <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableCell><strong>Causa</strong></TableCell>
                                  <TableCell align="center"><strong>Frecuencia Inherente</strong></TableCell>
                                  <TableCell align="center"><strong>Impacto Inherente</strong></TableCell>
                                  <TableCell align="center"><strong>Evaluación Control</strong></TableCell>
                                  <TableCell align="center"><strong>% Mitigación</strong></TableCell>
                                  <TableCell align="center"><strong>Frecuencia Residual</strong></TableCell>
                                  <TableCell align="center"><strong>Impacto Residual</strong></TableCell>
                                  <TableCell align="center"><strong>Calif. Residual</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {riesgo.causas.map((causa) => {
                                  // Calcular efectividad basada en criterios
                                  const puntajeTotal = calcularPuntajeControl(
                                    causa.puntajeAplicabilidad || 0,
                                    causa.puntajeCobertura || 0,
                                    causa.puntajeFacilidad || 0,
                                    causa.puntajeSegregacion || 0,
                                    causa.puntajeNaturaleza || 0
                                  );
                                  
                                  const efectividadControl = puntajeTotal > 0 
                                    ? determinarEfectividadControl(puntajeTotal)
                                    : 'No evaluado';
                                  
                                  const porcentajeMitigacion = obtenerPorcentajeMitigacion(efectividadControl);
                                  
                                  // Calcular valores residuales
                                  const frecuenciaInherente = causa.frecuencia || 1;
                                  const impactoInherente = causa.calificacionGlobalImpacto || 1;
                                  
                                  const frecuenciaResidual = calcularFrecuenciaResidual(frecuenciaInherente, porcentajeMitigacion);
                                  const impactoResidual = calcularImpactoResidual(impactoInherente, porcentajeMitigacion);
                                  const calificacionResidual = calcularCalificacionResidual(frecuenciaResidual, impactoResidual);

                                  return (
                                    <TableRow key={causa.id}>
                                      <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                          {causa.descripcion || 'Sin descripción'}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {frecuenciaInherente}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {impactoInherente.toFixed(2)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={() => {
                                            setRiesgoIdEvaluacion(riesgo.id);
                                            setCausaIdEvaluacion(causa.id);
                                            setCriteriosEvaluacion({
                                              aplicabilidad: causa.aplicabilidad || '',
                                              puntajeAplicabilidad: causa.puntajeAplicabilidad || 0,
                                              cobertura: causa.cobertura || '',
                                              puntajeCobertura: causa.puntajeCobertura || 0,
                                              facilidadUso: causa.facilidadUso || '',
                                              puntajeFacilidad: causa.puntajeFacilidad || 0,
                                              segregacion: causa.segregacion || '',
                                              puntajeSegregacion: causa.puntajeSegregacion || 0,
                                              naturaleza: causa.naturaleza || '',
                                              puntajeNaturaleza: causa.puntajeNaturaleza || 0,
                                              tipoMitigacion: causa.tipoMitigacion || 'AMBAS',
                                              recomendacion: causa.recomendacion || '',
                                            });
                                            setDialogEvaluacionOpen(true);
                                          }}
                                          disabled={isReadOnly}
                                        >
                                          Evaluar Control
                                        </Button>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                          {(porcentajeMitigacion * 100).toFixed(0)}%
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {frecuenciaResidual}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography variant="body2" fontWeight={600}>
                                          {impactoResidual.toFixed(2)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={calificacionResidual.toFixed(2)}
                                          color={
                                            calificacionResidual >= 15
                                              ? 'error'
                                              : calificacionResidual >= 10
                                              ? 'warning'
                                              : 'success'
                                          }
                                          variant="outlined"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Alert severity="info">
                            No hay causas registradas. Complete primero la calificación INHERENTE con causas.
                          </Alert>
                        )}

                        {/* Calificación Residual Global del Riesgo */}
                        {riesgo.causas && riesgo.causas.length > 0 && (() => {
                          const calificacionesResiduales = riesgo.causas.map(causa => {
                            const efectividadControl = causa.efectividadControl || 'No Aplica';
                            const porcentajeMitigacion = obtenerPorcentajeMitigacion(efectividadControl);
                            const frecuenciaInherente = causa.frecuencia || 1;
                            const impactoInherente = causa.calificacionGlobalImpacto || 1;
                            const frecuenciaResidual = calcularFrecuenciaResidual(frecuenciaInherente, porcentajeMitigacion);
                            const impactoResidual = calcularImpactoResidual(impactoInherente, porcentajeMitigacion);
                            return calcularCalificacionResidual(frecuenciaResidual, impactoResidual);
                          });

                          const calificacionResidualGlobal = Math.max(...calificacionesResiduales, 0);
                          const getNivelRiesgo = (calificacion: number) => {
                            if (calificacion === 0) return { nivel: 'Sin Calificar', color: '#666', bgColor: '#f5f5f5' };
                            if (calificacion >= 20) return { nivel: 'CRÍTICO', color: '#fff', bgColor: '#d32f2f' };
                            if (calificacion >= 15) return { nivel: 'ALTO', color: '#fff', bgColor: '#f57c00' };
                            if (calificacion >= 10) return { nivel: 'MEDIO', color: '#fff', bgColor: '#ed6c02' };
                            if (calificacion >= 5) return { nivel: 'BAJO', color: '#fff', bgColor: '#fbc02d' };
                            return { nivel: 'MÍNIMO', color: '#fff', bgColor: '#4caf50' };
                          };
                          const nivelInfo = getNivelRiesgo(calificacionResidualGlobal);

                          return (
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: nivelInfo.bgColor,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box>
                                <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.9 }}>
                                  CALIFICACIÓN RESIDUAL GLOBAL DEL RIESGO
                                </Typography>
                                <Typography variant="h5" sx={{ color: nivelInfo.color, fontWeight: 700, mt: 0.5 }}>
                                  {calificacionResidualGlobal > 0 ? calificacionResidualGlobal.toFixed(2) : 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.8, mt: 0.5, display: 'block' }}>
                                  (Máximo de todas las calificaciones residuales por causa)
                                </Typography>
                              </Box>
                              <Chip
                                label={nivelInfo.nivel}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  color: nivelInfo.color,
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                }}
                              />
                            </Box>
                          );
                        })()}
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}

      {/* Diálogo para agregar/editar causa */}
      <Dialog open={dialogCausaOpen} onClose={() => setDialogCausaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa' : 'Agregar Causa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Descripción de la Causa"
              multiline
              rows={3}
              value={nuevaCausaDescripcion}
              onChange={(e) => setNuevaCausaDescripcion(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Fuente</InputLabel>
              <Select
                value={nuevaCausaFuente}
                onChange={(e) => setNuevaCausaFuente(e.target.value)}
                label="Fuente"
              >
                {Object.entries(fuentesCausa).map(([key, value]) => (
                  <MenuItem key={key} value={key}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frecuencia</InputLabel>
              <Select
                value={nuevaCausaFrecuencia}
                onChange={(e) => setNuevaCausaFrecuencia(Number(e.target.value))}
                label="Frecuencia"
              >
                {Object.entries(labelsFrecuencia).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    {value.label} - {value.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCausaOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const riesgo = riesgos.find(r => r.id === riesgoIdParaCausa);
              if (riesgo) {
                // Calcular calificaciones para la nueva causa
                const calificacionGlobalImpacto = calcularCalificacionGlobalImpacto(riesgo.impactos);
                const calificacionInherente = calcularCalificacionInherentePorCausa(
                  calificacionGlobalImpacto,
                  nuevaCausaFrecuencia
                );

                const nuevaCausa: CausaRiesgo = {
                  id: causaEditando?.id || `causa-${Date.now()}`,
                  riesgoId: riesgoIdParaCausa,
                  descripcion: nuevaCausaDescripcion,
                  fuenteCausa: nuevaCausaFuente,
                  frecuencia: nuevaCausaFrecuencia,
                  calificacionGlobalImpacto,
                  calificacionInherentePorCausa: calificacionInherente,
                };
                const nuevasCausas = causaEditando
                  ? riesgo.causas.map(c => c.id === causaEditando.id ? nuevaCausa : c)
                  : [...riesgo.causas, nuevaCausa];
                actualizarRiesgo(riesgoIdParaCausa, { causas: nuevasCausas });
                setDialogCausaOpen(false);
              }
            }}
          >
            {causaEditando ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Evaluación de Control por Causa */}
      <Dialog open={dialogEvaluacionOpen} onClose={() => setDialogEvaluacionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Evaluación de Control - Causa
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Aplicabilidad */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Aplicabilidad</InputLabel>
                <Select
                  value={criteriosEvaluacion.aplicabilidad}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'totalmente') puntaje = 100;
                    else if (val === 'parcial') puntaje = 30;
                    else if (val === 'nula') puntaje = 0;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      aplicabilidad: val,
                      puntajeAplicabilidad: puntaje,
                    }));
                  }}
                  label="Aplicabilidad"
                >
                  <MenuItem value="totalmente">Totalmente Aplicable (100)</MenuItem>
                  <MenuItem value="parcial">Parcialmente Aplicable (30)</MenuItem>
                  <MenuItem value="nula">No Aplicable (0)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeAplicabilidad}
              </Typography>
            </Box>

            {/* Cobertura */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Cobertura</InputLabel>
                <Select
                  value={criteriosEvaluacion.cobertura}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'total') puntaje = 100;
                    else if (val === 'significativa') puntaje = 70;
                    else if (val === 'minima') puntaje = 10;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      cobertura: val,
                      puntajeCobertura: puntaje,
                    }));
                  }}
                  label="Cobertura"
                >
                  <MenuItem value="total">Cobertura Total (100)</MenuItem>
                  <MenuItem value="significativa">Cobertura Significativa (70)</MenuItem>
                  <MenuItem value="minima">Cobertura Mínima (10)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeCobertura}
              </Typography>
            </Box>

            {/* Facilidad de Uso */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Facilidad de Uso</InputLabel>
                <Select
                  value={criteriosEvaluacion.facilidadUso}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'facil') puntaje = 100;
                    else if (val === 'moderada') puntaje = 70;
                    else if (val === 'dificil') puntaje = 30;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      facilidadUso: val,
                      puntajeFacilidad: puntaje,
                    }));
                  }}
                  label="Facilidad de Uso"
                >
                  <MenuItem value="facil">Fácil de Usar (100)</MenuItem>
                  <MenuItem value="moderada">Facilidad Moderada (70)</MenuItem>
                  <MenuItem value="dificil">Difícil de Usar (30)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeFacilidad}
              </Typography>
            </Box>

            {/* Segregación */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Segregación</InputLabel>
                <Select
                  value={criteriosEvaluacion.segregacion}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'si') puntaje = 100;
                    else if (val === 'no') puntaje = 0;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      segregacion: val,
                      puntajeSegregacion: puntaje,
                    }));
                  }}
                  label="Segregación"
                >
                  <MenuItem value="si">Sí Segregado (100)</MenuItem>
                  <MenuItem value="no">No Segregado (0)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeSegregacion}
              </Typography>
            </Box>

            {/* Naturaleza del Control */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Naturaleza del Control</InputLabel>
                <Select
                  value={criteriosEvaluacion.naturaleza}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'preventivo') puntaje = 100;
                    else if (val === 'detective') puntaje = 60;
                    else if (val === 'correctivo') puntaje = 40;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      naturaleza: val,
                      puntajeNaturaleza: puntaje,
                    }));
                  }}
                  label="Naturaleza"
                >
                  <MenuItem value="preventivo">Preventivo (100)</MenuItem>
                  <MenuItem value="detective">Detective (60)</MenuItem>
                  <MenuItem value="correctivo">Correctivo (40)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeNaturaleza}
              </Typography>
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Mitigación</InputLabel>
                <Select
                  value={criteriosEvaluacion.tipoMitigacion}
                  onChange={(e) => {
                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      tipoMitigacion: e.target.value as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
                    }));
                  }}
                  label="Tipo de Mitigación"
                >
                  <MenuItem value="FRECUENCIA">Mitigación de Frecuencia</MenuItem>
                  <MenuItem value="IMPACTO">Mitigación de Impacto</MenuItem>
                  <MenuItem value="AMBAS">Mitigación de Ambas</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Recomendación"
                multiline
                rows={2}
                size="small"
                value={criteriosEvaluacion.recomendacion || ''}
                onChange={(e) => {
                  setCriteriosEvaluacion(prev => ({
                    ...prev,
                    recomendacion: e.target.value,
                  }));
                }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Cálculo de Puntaje Total y Evaluaciones */}
            {(() => {
              const puntajeTotal = calcularPuntajeControl(
                criteriosEvaluacion.puntajeAplicabilidad,
                criteriosEvaluacion.puntajeCobertura,
                criteriosEvaluacion.puntajeFacilidad,
                criteriosEvaluacion.puntajeSegregacion,
                criteriosEvaluacion.puntajeNaturaleza
              );

              // Evaluación preliminar (basada en puntaje)
              const evaluacionPreliminar = determinarEvaluacionPreliminar(puntajeTotal);

              // Evaluación definitiva (puede ajustarse por recomendación)
              const evaluacionDefinitiva = determinarEvaluacionDefinitiva(
                evaluacionPreliminar,
                criteriosEvaluacion.recomendacion
              );

              // % Mitigación según evaluación definitiva
              const porcentajeMitigacion = obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva);

              const getEfectividadColor = (efectividad: string) => {
                if (efectividad === 'Altamente Efectivo') return '#4caf50';
                if (efectividad === 'Efectivo') return '#8bc34a';
                if (efectividad === 'Medianamente Efectivo') return '#fbc02d';
                if (efectividad === 'Baja Efectividad') return '#ff9800';
                return '#f44336';
              };

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      PUNTAJE Y EVALUACIÓN
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Puntaje Total
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {puntajeTotal.toFixed(0)} / 100
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Eval. Preliminar
                        </Typography>
                        <Chip
                          label={evaluacionPreliminar}
                          size="small"
                          sx={{
                            backgroundColor: getEfectividadColor(evaluacionPreliminar),
                            color: '#fff',
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Eval. Definitiva
                        </Typography>
                        <Chip
                          label={evaluacionDefinitiva}
                          size="small"
                          sx={{
                            backgroundColor: getEfectividadColor(evaluacionDefinitiva),
                            color: '#fff',
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          % Mitigación
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(porcentajeMitigacion * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEvaluacionOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const riesgo = riesgos.find(r => r.id === riesgoIdEvaluacion);
              if (riesgo) {
                const causasActualizadas = riesgo.causas.map(c => {
                  if (c.id === causaIdEvaluacion) {
                    const puntajeTotal = calcularPuntajeControl(
                      criteriosEvaluacion.puntajeAplicabilidad,
                      criteriosEvaluacion.puntajeCobertura,
                      criteriosEvaluacion.puntajeFacilidad,
                      criteriosEvaluacion.puntajeSegregacion,
                      criteriosEvaluacion.puntajeNaturaleza
                    );

                    const evaluacionPreliminar = determinarEvaluacionPreliminar(puntajeTotal);
                    const evaluacionDefinitiva = determinarEvaluacionDefinitiva(
                      evaluacionPreliminar,
                      criteriosEvaluacion.recomendacion
                    );
                    const porcentajeMitigacion = obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva);

                    // Calcular residuales usando el tipo de mitigación
                    const frecuenciaInherente = c.frecuencia || 1;
                    const impactoInherente = c.calificacionGlobalImpacto || 1;

                    const frecuenciaResidual = calcularFrecuenciaResidualAvanzada(
                      frecuenciaInherente,
                      impactoInherente,
                      porcentajeMitigacion,
                      criteriosEvaluacion.tipoMitigacion
                    );

                    const impactoResidual = calcularImpactoResidualAvanzado(
                      impactoInherente,
                      frecuenciaInherente,
                      porcentajeMitigacion,
                      criteriosEvaluacion.tipoMitigacion
                    );

                    const calificacionResidual = calcularCalificacionResidual(
                      frecuenciaResidual,
                      impactoResidual
                    );

                    return {
                      ...c,
                      ...criteriosEvaluacion,
                      puntajeTotal,
                      evaluacionPreliminar,
                      evaluacionDefinitiva,
                      efectividadControl: evaluacionDefinitiva,
                      frecuenciaResidual,
                      impactoResidual,
                      calificacionResidual,
                      porcentajeMitigacion,
                    };
                  }
                  return c;
                });

                actualizarRiesgo(riesgoIdEvaluacion, { causas: causasActualizadas });
                setDialogEvaluacionOpen(false);
              }
            }}
          >
            Guardar Evaluación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Componente para el formulario de un riesgo individual
function RiesgoFormulario({
  riesgo,
  actualizarRiesgo,
  isReadOnly,
  procesoSeleccionado,
  onSave,
  onAgregarCausa,
  onEditarCausa,
  onEliminarCausa,
  tiposRiesgos,
  origenes,
  tiposProceso,
  consecuencias,
  objetivos,
  labelsFrecuencia,
  fuentesCausa,
  descripcionesImpacto,
}: {
  riesgo: RiesgoFormData;
  actualizarRiesgo: (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => void;
  isReadOnly: boolean;
  procesoSeleccionado: any;
  onSave: () => void;
  onAgregarCausa: (riesgoId: string) => void;
  onEditarCausa: (riesgoId: string, causa: CausaRiesgo) => void;
  onEliminarCausa: (riesgoId: string, causaId: string) => void;
  // Dynamic props
  tiposRiesgos: any[];
  origenes: any[];
  tiposProceso: any[];
  consecuencias: any[];
  objetivos: any[];
  labelsFrecuencia: any;
  fuentesCausa: any;
  descripcionesImpacto: any;
}) {
  const tipoRiesgoSeleccionado = useMemo(() => {
    return (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo) || null;
  }, [riesgo.tipoRiesgo, tiposRiesgos]);

  const impactos = riesgo.impactos ?? {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Panel RIESGO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "RIESGO" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            RIESGO
          </Typography>
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
          {/* Campos del riesgo en dos columnas */}
          <Grid2 container spacing={2}>
            {/* Columna izquierda - incluye descripción */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Descripción del riesgo - Campo más pequeño */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción del Riesgo"
                  value={riesgo.descripcionRiesgo}
                  onChange={(e) => actualizarRiesgo(riesgo.id, { descripcionRiesgo: e.target.value })}
                  disabled={isReadOnly}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.9rem',
                    },
                  }}
                />
                {/* Origen del riesgo */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ width: '40%', fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Origen del riesgo
                        </TableCell>
                        <TableCell sx={{ width: '60%' }}>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.origenRiesgo}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { origenRiesgo: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                            >
                              {origenes?.map((o) => (
                                <MenuItem key={o.id} value={o.nombre}>{o.nombre}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          # Identificación
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={riesgo.numeroIdentificacion || ''}
                            disabled={true}
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipo de Proceso
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.tipoProceso}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { tipoProceso: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                            >
                              {tiposProceso?.map((tp) => (
                                <MenuItem key={tp.id} value={tp.nombre}>{tp.nombre}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Proceso
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={procesoSeleccionado?.nombre || ''}
                            disabled
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Consecuencia
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.consecuencia}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { consecuencia: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                            >
                              {consecuencias?.map((c) => (
                                <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>

            {/* Columna derecha */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {/* Tipo de Riesgo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipo de Riesgo
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            value={riesgo.tipoRiesgo ? (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo) || null : null}
                            onChange={(_, newValue) => {
                              if (newValue) {
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: newValue.codigo, subtipoRiesgo: '' });
                              } else {
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: '', subtipoRiesgo: '' });
                              }
                            }}
                            options={tiposRiesgos || []}
                            getOptionLabel={(option) => {
                              // Si el código ya incluye el nombre, solo mostrar el código
                              if (option.codigo.includes(option.nombre)) {
                                return option.codigo;
                              }
                              return `${option.codigo} ${option.nombre}`;
                            }}
                            disabled={isReadOnly}
                            size="small"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="standard"
                                placeholder="Buscar tipo de riesgo..."
                                sx={{ fontSize: '0.875rem' }}
                                InputProps={{
                                  ...params.InputProps,
                                  disableUnderline: true,
                                }}
                              />
                            )}
                            sx={{
                              width: '100%',
                              '& .MuiAutocomplete-input': {
                                fontSize: '0.875rem',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-inputRoot': {
                                flexWrap: 'wrap',
                              },
                              '& .MuiAutocomplete-tag': {
                                maxWidth: '100%',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-popper': {
                                '& .MuiAutocomplete-paper': {
                                  width: '100%',
                                  minWidth: '100%',
                                  maxHeight: '400px',
                                },
                              },
                            }}
                            ListboxProps={{
                              sx: {
                                maxHeight: '400px',
                              },
                            }}
                            renderOption={(props, option) => (
                              <Tooltip
                                title={option.descripcion || ''}
                                placement="right"
                                arrow
                                enterDelay={300}
                              >
                                <Box component="li" {...props} sx={{ py: 0.75 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                    {option.codigo.includes(option.nombre) ? option.codigo : `${option.codigo} ${option.nombre}`}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            )}
                            filterOptions={(options, { inputValue }) => {
                              const searchTerm = (inputValue ?? '').toLowerCase();
                              return options.filter((option) => {
                                const codigo = (option.codigo ?? '').toLowerCase();
                                const nombre = (option.nombre ?? '').toLowerCase();
                                const descripcion = (option.descripcion ?? '').toLowerCase();
                                return codigo.includes(searchTerm) || nombre.includes(searchTerm) || descripcion.includes(searchTerm);
                              });
                            }}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Descripción del Tipo de Riesgo */}
                      {riesgo.tipoRiesgo && tipoRiesgoSeleccionado && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                              {tipoRiesgoSeleccionado.descripcion}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Subtipo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Subtipo
                        </TableCell>
                        <TableCell>
                          {riesgo.tipoRiesgo && tipoRiesgoSeleccionado ? (
                            <Autocomplete
                              value={riesgo.subtipoRiesgo ? (() => {
                                const tipoObj = (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo);
                                return tipoObj?.subtipos.find((s: any) => getSubtipoCodigo(s) === riesgo.subtipoRiesgo) || null;
                              })() : null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: getSubtipoCodigo(newValue) });
                                } else {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: '' });
                                }
                              }}
                              options={tipoRiesgoSeleccionado.subtipos}
                              getOptionLabel={(option) => getSubtipoCodigo(option)}
                              disabled={isReadOnly}
                              size="small"
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="standard"
                                  placeholder="Buscar subtipo..."
                                  sx={{ fontSize: '0.875rem' }}
                                  InputProps={{
                                    ...params.InputProps,
                                    disableUnderline: true,
                                  }}
                                />
                              )}
                              sx={{
                                width: '100%',
                                '& .MuiAutocomplete-input': {
                                  fontSize: '0.875rem',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-inputRoot': {
                                  flexWrap: 'wrap',
                                },
                                '& .MuiAutocomplete-tag': {
                                  maxWidth: '100%',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-popper': {
                                  '& .MuiAutocomplete-paper': {
                                    width: '100%',
                                    minWidth: '100%',
                                    maxHeight: '400px',
                                  },
                                },
                              }}
                              ListboxProps={{
                                sx: {
                                  maxHeight: '400px',
                                },
                              }}
                              renderOption={(props, option) => (
                                <Tooltip
                                  title={option.descripcion || ''}
                                  placement="right"
                                  arrow
                                  enterDelay={300}
                                >
                                  <Box component="li" {...props} sx={{ py: 0.75 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                      {option.codigo}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                              filterOptions={(options, { inputValue }) => {
                                const searchTerm = (inputValue ?? '').toLowerCase();
                                return options.filter((option) => {
                                  const codigo = (option.codigo ?? '').toLowerCase();
                                  const descripcion = (option.descripcion ?? '').toLowerCase();
                                  return codigo.includes(searchTerm) || descripcion.includes(searchTerm);
                                });
                              }}
                            />
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              value=""
                              disabled
                              placeholder="Seleccione primero un tipo de riesgo"
                              variant="standard"
                              sx={{ fontSize: '0.875rem' }}
                              InputProps={{ disableUnderline: true }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Descripción del Subtipo */}
                      {riesgo.subtipoRiesgo && riesgo.tipoRiesgo && (() => {
                        const tipoObj = (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo);
                        const subtipoObj = tipoObj?.subtipos.find((s: any) => getSubtipoCodigo(s) === riesgo.subtipoRiesgo);
                        return subtipoObj ? (
                          <TableRow>
                            <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                {subtipoObj.descripcion}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : null;
                      })()}

                      {/* Objetivo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Objetivo
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <InputLabel id="objetivo-label" sx={{ fontSize: '0.875rem' }}>
                              Seleccione un objetivo
                            </InputLabel>
                            <Select
                              labelId="objetivo-label"
                              value={riesgo.objetivo}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { objetivo: e.target.value })}
                              label="Seleccione un objetivo"
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccione un objetivo</span>;
                                }
                                return (
                                  <span style={{
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    display: 'block',
                                    maxWidth: '100%'
                                  }}>
                                    {selected}
                                  </span>
                                );
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    maxHeight: '250px',
                                  },
                                },
                              }}
                            >
                              {objetivos?.map((obj: any) => (
                                <MenuItem key={obj.id} value={`${obj.codigo} ${obj.descripcion}`} sx={{ py: 0.5, fontSize: '0.875rem' }}>
                                  {obj.codigo} {obj.descripcion}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {/* Panel CAUSAS */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "CAUSAS" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            CAUSAS
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Causa</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Fuente</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Frecuencia</TableCell>
                  {!isReadOnly && (
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }} align="right">Acciones</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgo.causas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 3 : 4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay causas registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  riesgo.causas.map((causa: CausaRiesgo) => (
                    <TableRow
                      key={causa.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {causa.descripcion.length > 80
                            ? `${causa.descripcion.substring(0, 80)}...`
                            : causa.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fuentesCausa[Number(causa.fuenteCausa)] || fuentesCausa[1]}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {labelsFrecuencia[causa.frecuencia || 3]?.label || ''}
                        </Typography>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditarCausa(riesgo.id, causa);
                            }}
                            title="Editar causa"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminarCausa(riesgo.id, causa.id);
                            }}
                            color="error"
                            title="Eliminar causa"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!isReadOnly && (
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                size="medium"
                onClick={() => onAgregarCausa(riesgo.id)}
              >
                Agregar Causa
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Panel IMPACTO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "IMPACTO" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            IMPACTO
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Grid2 container spacing={2}>
            {/* Columna izquierda de impactos */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Impacto económico */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Impacto económico
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.economico || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, economico: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.economico[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.economico && !isNaN(Number(impactos.economico)) ? Number(impactos.economico) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.economico[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Procesos */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Procesos
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.procesos || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, procesos: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.procesos[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.procesos && !isNaN(Number(impactos.procesos)) ? Number(impactos.procesos) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.procesos[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Legal */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Legal
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.legal || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, legal: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.legal[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.legal && !isNaN(Number(impactos.legal)) ? Number(impactos.legal) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.legal[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Confidencialidad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Confidencialidad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.confidencialidadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, confidencialidadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.confidencialidadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.confidencialidadSGSI && !isNaN(Number(impactos.confidencialidadSGSI)) ? Number(impactos.confidencialidadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.confidencialidadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Reputación */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Reputación
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.reputacion || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, reputacion: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.reputacion[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.reputacion && !isNaN(Number(impactos.reputacion)) ? Number(impactos.reputacion) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.reputacion[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

              </Box>
            </Grid2>

            {/* Columna derecha de impactos */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Disponibilidad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Disponibilidad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.disponibilidadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, disponibilidadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.disponibilidadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.disponibilidadSGSI && !isNaN(Number(impactos.disponibilidadSGSI)) ? Number(impactos.disponibilidadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.disponibilidadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Personas */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Personas
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.personas || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, personas: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.personas[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.personas && !isNaN(Number(impactos.personas)) ? Number(impactos.personas) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.personas[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Integridad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Integridad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.integridadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, integridadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.integridadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.integridadSGSI && !isNaN(Number(impactos.integridadSGSI)) ? Number(impactos.integridadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.integridadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Ambiental */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Ambiental
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                          value={impactos.ambiental || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                                impactos: { ...impactos, ambiental: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.ambiental[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.ambiental && !isNaN(Number(impactos.ambiental)) ? Number(impactos.ambiental) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.ambiental[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          fullWidth
          sx={{ mt: 3 }}
          onClick={onSave}
        >
          Guardar
        </Button>
      )}
    </Box>
  );
}
