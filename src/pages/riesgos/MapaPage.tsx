/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Autocomplete,
} from '@mui/material';
import Grid2 from '../../../../../shared/components/ui/Grid2';
import { useGetPuntosMapaQuery, useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery } from '../../api/services/riesgosApi';
import { colors } from '../../app/theme/colors';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, ROUTES, NIVELES_RIESGO } from '../../utils/constants';
import { useProceso } from '../../contexts/ProcesoContext';
import { useRiesgo } from '../../contexts/RiesgoContext';
import { useAuth } from '../../contexts/AuthContext';
import type { FiltrosRiesgo, PuntoMapa, Riesgo } from '../types';
import { Alert } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

// Función para generar ID del riesgo (número + sigla)
const generarIdRiesgo = (punto: PuntoMapa): string => {
    const numero = punto.numero || 0;
    const sigla = punto.siglaGerencia || '';
    return `${numero}${sigla}`;
};

export default function MapaPage() {
    const navigate = useNavigate();
    const { procesoSeleccionado, modoProceso } = useProceso();
    const { iniciarVer } = useRiesgo();
    const { esSupervisorRiesgos, user } = useAuth();
    const { data: procesos = [] } = useGetProcesosQuery();
    const [clasificacion, setClasificacion] = useState<string>('all');
    const [filtroArea, setFiltroArea] = useState<string>('all');
    const [filtroProceso, setFiltroProceso] = useState<string>('all');
    const [mostrarFueraApetito, setMostrarFueraApetito] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ probabilidad: number; impacto: number } | null>(null);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [detalleRiesgoDialogOpen, setDetalleRiesgoDialogOpen] = useState(false);
    const [riesgoSeleccionadoDetalle, setRiesgoSeleccionadoDetalle] = useState<Riesgo | null>(null);
    const [puntoSeleccionadoDetalle, setPuntoSeleccionadoDetalle] = useState<PuntoMapa | null>(null);
    const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);

    // Si es supervisor, obtener todos los procesos asignados
    const procesosSupervisor = useMemo(() => {
        if (esSupervisorRiesgos && user) {
            return procesos.filter((p) => p.directorId === user.id);
        }
        return [];
    }, [procesos, esSupervisorRiesgos, user]);

    // Si es supervisor, aplicar filtros de área y proceso si están seleccionados
    const procesoIdFiltrado = useMemo(() => {
        if (esSupervisorRiesgos) {
            if (filtroProceso && filtroProceso !== 'all') {
                return filtroProceso;
            }
            // Si hay filtro de área pero no de proceso, mostrar todos los procesos de esa área
            if (filtroArea && filtroArea !== 'all') {
                // Devolver undefined para que se filtren después por área
                return undefined;
            }
            return undefined; // Mostrar todos los procesos del supervisor
        }
        return procesoSeleccionado?.id;
    }, [esSupervisorRiesgos, filtroProceso, filtroArea, procesoSeleccionado]);

    const filtros: FiltrosRiesgo = {
        procesoId: procesoIdFiltrado,
        clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
    };

    const { data: puntos } = useGetPuntosMapaQuery(filtros);
    const { data: riesgosData } = useGetRiesgosQuery(filtros);

    // Obtener riesgos completos para el diálogo
    const riesgosCompletos = riesgosData?.data || [];

    // Si es supervisor, filtrar puntos y riesgos para mostrar solo los de sus procesos (aplicando filtros de área)
    const puntosFiltrados = useMemo(() => {
        if (esSupervisorRiesgos && procesosSupervisor.length > 0) {
            let procesosIds = procesosSupervisor.map((p) => p.id);

            // Aplicar filtro de área si está seleccionado
            if (filtroArea && filtroArea !== 'all') {
                procesosIds = procesosSupervisor
                    .filter(p => p.areaId === filtroArea)
                    .map(p => p.id);
            }

            // Aplicar filtro de proceso si está seleccionado
            if (filtroProceso && filtroProceso !== 'all') {
                procesosIds = [filtroProceso];
            }

            return puntos?.filter((p) => {
                const riesgo = riesgosCompletos.find((r) => r.id === p.riesgoId);
                return riesgo && procesosIds.includes(riesgo.procesoId);
            }) || [];
        }
        return puntos || [];
    }, [puntos, esSupervisorRiesgos, procesosSupervisor, riesgosCompletos, filtroArea, filtroProceso]);

    // Create 5x5 matrix para riesgo inherente usando puntos filtrados
    const matrizInherente: { [key: string]: PuntoMapa[] } = {};
    puntosFiltrados.forEach((punto) => {
        const key = `${punto.probabilidad}-${punto.impacto}`;
        if (!matrizInherente[key]) {
            matrizInherente[key] = [];
        }
        matrizInherente[key].push(punto);
    });

    // Create 5x5 matrix para riesgo residual
    // Calcular riesgo residual basado en evaluaciones (aproximación: reducir probabilidad/impacto según efectividad de controles)
    const matrizResidual: { [key: string]: PuntoMapa[] } = {};
    puntosFiltrados.forEach((punto) => {
        const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
        if (!riesgo) return;

        // Aproximación: reducir probabilidad e impacto en un 20% para riesgo residual
        // En producción, esto vendría de las evaluaciones residuales reales
        const factorReduccion = 0.8; // 20% de reducción
        const probabilidadResidual = Math.max(1, Math.round(punto.probabilidad * factorReduccion));
        const impactoResidual = Math.max(1, Math.round(punto.impacto * factorReduccion));

        const key = `${probabilidadResidual}-${impactoResidual}`;
        if (!matrizResidual[key]) {
            matrizResidual[key] = [];
        }
        // Crear un punto residual basado en el inherente
        matrizResidual[key].push({
            ...punto,
            probabilidad: probabilidadResidual,
            impacto: impactoResidual,
        });
    });

    // Calcular nivel de riesgo basado en probabilidad e impacto
    const calcularNivelRiesgo = (probabilidad: number, impacto: number): string => {
        const riesgo = probabilidad * impacto;
        if (riesgo >= 20) return NIVELES_RIESGO.CRITICO;
        if (riesgo >= 15) return NIVELES_RIESGO.ALTO;
        if (riesgo >= 10) return NIVELES_RIESGO.ALTO;
        if (riesgo >= 5) return NIVELES_RIESGO.MEDIO;
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

        // Contadores de resumen
        let bajaron = 0;
        let seMantuvieron = 0;
        let subieron = 0;

        // Orden de niveles para comparar (de mayor a menor)
        const ordenNiveles: { [key: string]: number } = {
            [NIVELES_RIESGO.CRITICO]: 4,
            [NIVELES_RIESGO.ALTO]: 3,
            [NIVELES_RIESGO.MEDIO]: 2,
            [NIVELES_RIESGO.BAJO]: 1,
        };

        puntosFiltrados.forEach((punto) => {
            const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
            if (!riesgo) return;

            const nivelInherente = calcularNivelRiesgo(punto.probabilidad, punto.impacto);

            // Calcular residual (aproximación: reducir 20%)
            const factorReduccion = 0.8;
            const probResidual = Math.max(1, Math.round(punto.probabilidad * factorReduccion));
            const impResidual = Math.max(1, Math.round(punto.impacto * factorReduccion));
            const nivelResidual = calcularNivelRiesgo(probResidual, impResidual);

            // Contar por nivel residual
            if (nivelResidual === NIVELES_RIESGO.CRITICO) residual.porNivel.critico++;
            else if (nivelResidual === NIVELES_RIESGO.ALTO) residual.porNivel.alto++;
            else if (nivelResidual === NIVELES_RIESGO.MEDIO) residual.porNivel.medio++;
            else residual.porNivel.bajo++;

            // Contar cambios
            const cambioKey = `${nivelInherente}-${nivelResidual}`;
            if (cambios[cambioKey] !== undefined) {
                cambios[cambioKey]++;
            }

            // Analizar si bajó, se mantuvo o subió
            const ordenInherente = ordenNiveles[nivelInherente] || 0;
            const ordenResidual = ordenNiveles[nivelResidual] || 0;

            if (ordenResidual < ordenInherente) {
                bajaron++; // Mejoró (bajó de nivel)
            } else if (ordenResidual === ordenInherente) {
                seMantuvieron++; // Se mantuvo en el mismo nivel
            } else {
                subieron++; // Empeoró (subió de nivel)
            }
        });

        return {
            inherente,
            residual,
            cambios,
            resumen: {
                bajaron,
                seMantuvieron,
                subieron,
                total: puntosFiltrados.length,
            },
        };
    }, [puntosFiltrados, riesgosCompletos]);

    // Identificar riesgos fuera del apetito (>= 15 para riesgo alto/crítico)
    const riesgosFueraApetito = useMemo(() => {
        const umbralApetito = 15; // Riesgos >= 15 están fuera del apetito
        return puntosFiltrados.filter((punto) => {
            const valorRiesgo = punto.probabilidad * punto.impacto;
            return valorRiesgo >= umbralApetito && punto.clasificacion === CLASIFICACION_RIESGO.NEGATIVA;
        }).map((punto) => {
            const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
            return { punto, riesgo, valorRiesgo: punto.probabilidad * punto.impacto };
        });
    }, [puntosFiltrados, riesgosCompletos]);

    // Obtener riesgos de la celda seleccionada usando puntos filtrados
    const [tipoMapaSeleccionado, setTipoMapaSeleccionado] = useState<'inherente' | 'residual'>('inherente');
    const matrizActual = tipoMapaSeleccionado === 'inherente' ? matrizInherente : matrizResidual;

    const riesgosCeldaSeleccionada = useMemo(() => {
        if (!selectedCell) return [];
        const key = `${selectedCell.probabilidad}-${selectedCell.impacto}`;
        return matrizActual[key] || [];
    }, [selectedCell, matrizActual]);

    // Si es supervisor, mostrar solo procesos que supervisa
    if (esSupervisorRiesgos && procesosSupervisor.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">
                    No tiene procesos asignados para supervisar.
                </Alert>
            </Box>
        );
    }

    // Si es supervisor y tiene proceso seleccionado, verificar que sea uno de sus procesos
    if (esSupervisorRiesgos && procesoSeleccionado && !procesosSupervisor.find(p => p.id === procesoSeleccionado.id)) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    Este proceso no está asignado a su supervisión. Por favor seleccione uno de sus procesos desde el Dashboard.
                </Alert>
            </Box>
        );
    }

    const getCellColor = (probabilidad: number, impacto: number): string => {
        const riesgo = probabilidad * impacto;
        // Ajustado exactamente según la matriz de la imagen:
        // Verde (Bajo): valores 1, 2, 3, 4 (celdas: (1,1), (1,2), (1,3), (2,1), (2,2), (3,1))
        // Amarillo (Medio): valores 4, 6, 8, 9, 12 (celdas: (1,4), (2,3), (2,4), (3,2), (3,3), (4,1), (4,2), (4,3))
        // Naranja (Alto): valores 5, 10, 12, 16 (celdas: (1,5), (2,5), (3,4), (4,4), (5,1), (5,2))
        // Rojo (Muy Alto): valores 15, 20 (celdas: (4,5), (5,3), (5,4))
        // Rojo Oscuro (Crítico): valor 25 (celda: (5,5))

        // Matriz 5x5 completa con colores del theme
        // Formato: (probabilidad, impacto) donde impacto 5 es la fila de arriba
        const cellKey = `${probabilidad}-${impacto}`;
        const cellColorMap: { [key: string]: string } = {
            // Fila 5 (Impacto 5 - Extremo)
            '1-5': colors.risk.high.main,      // Muy Bajo, Extremo
            '2-5': colors.risk.high.main,       // Bajo, Extremo
            '3-5': colors.risk.critical.main,   // Moderada, Extremo
            '4-5': colors.risk.critical.main,  // Alta, Extremo
            '5-5': colors.risk.critical.main,  // Muy Alta, Extremo

            // Fila 4 (Impacto 4 - Grave)
            '1-4': colors.risk.medium.main,     // Muy Bajo, Grave
            '2-4': colors.risk.medium.main,     // Bajo, Grave
            '3-4': colors.risk.high.main,       // Moderada, Grave - tomate/naranja
            '4-4': colors.risk.critical.main,    // Alta, Grave - rojo
            '5-4': colors.risk.critical.main,   // Muy Alta, Grave

            // Fila 3 (Impacto 3 - Moderado)
            '1-3': colors.risk.low.main,        // Muy Bajo, Moderado
            '2-3': colors.risk.medium.main,     // Bajo, Moderado
            '3-3': colors.risk.medium.main,     // Moderada, Moderado - amarillo
            '4-3': colors.risk.high.main,       // Alta, Moderado - tomate/naranja
            '5-3': colors.risk.critical.main,   // Muy Alta, Moderado

            // Fila 2 (Impacto 2 - Leve)
            '1-2': colors.risk.low.main,        // Muy Bajo, Leve
            '2-2': colors.risk.low.main,        // Bajo, Leve
            '3-2': colors.risk.medium.main,     // Moderada, Leve
            '4-2': colors.risk.medium.main,     // Alta, Leve
            '5-2': colors.risk.high.main,       // Muy Alta, Leve

            // Fila 1 (Impacto 1 - No Significativo)
            '1-1': colors.risk.low.main,        // Muy Bajo, No Significativo
            '2-1': colors.risk.low.main,        // Bajo, No Significativo
            '3-1': colors.risk.low.main,        // Moderada, No Significativo
            '4-1': colors.risk.medium.main,     // Alta, No Significativo
            '5-1': colors.risk.high.main,       // Muy Alta, No Significativo
        };

        // Si hay un mapeo específico, usarlo; si no, usar lógica por defecto
        if (cellColorMap[cellKey]) {
            return cellColorMap[cellKey];
        }

        // Lógica por defecto basada en el valor del riesgo
        if (riesgo >= 25) return colors.risk.critical.main;
        if (riesgo >= 17) return '#d32f2f';
        if (riesgo >= 10) return colors.risk.high.main;
        if (riesgo >= 4) return colors.risk.medium.main;
        return colors.risk.low.main;
    };

    const getCellLabel = (probabilidad: number, impacto: number): string => {
        const riesgo = probabilidad * impacto;
        if (riesgo >= 20) return 'CRÍTICO';
        if (riesgo >= 15) return 'ALTO';
        if (riesgo >= 10) return 'MEDIO';
        return 'BAJO';
    };

    const handleCellClick = (probabilidad: number, impacto: number, tipo: 'inherente' | 'residual') => {
        setTipoMapaSeleccionado(tipo);
        const key = `${probabilidad}-${impacto}`;
        const matrizActual = tipo === 'inherente' ? matrizInherente : matrizResidual;
        const cellRiesgos = matrizActual[key] || [];
        if (cellRiesgos.length > 0) {
            setSelectedCell({ probabilidad, impacto });
            setSummaryDialogOpen(true);
        }
    };

    // Función para obtener los bordes rojos de una celda de límite
    const getBordesLimite = (probabilidad: number, impacto: number): { top?: boolean; right?: boolean } => {
        const cellKey = `${probabilidad}-${impacto}`;
        // Según la especificación del usuario:
        // Formato: (probabilidad, impacto) donde impacto 5 es la fila de arriba
        // (4,1): SOLO línea derecha roja (NO superior) - "No Significativo" (impacto 1) y "Alta" (probabilidad 4)
        // (4,2): línea superior y derecha roja
        // (3,3): línea superior y derecha roja
        // (2,4): línea superior y derecha roja
        // (1,4): línea superior roja (fila 4, primera columna - línea roja en el lado superior)
        const bordesLimite: { [key: string]: { top?: boolean; right?: boolean } } = {
            '4-1': { top: false, right: true }, // Solo derecha (No Significativo y Alta)
            '4-2': { top: true, right: true },
            '3-3': { top: true, right: true },
            '2-4': { top: true, right: true },
            '1-4': { top: true, right: false }, // Solo superior (fila 4, primera columna)
        };
        return bordesLimite[cellKey] || {};
    };

    // Función para renderizar una matriz
    const renderMatrix = (matriz: { [key: string]: PuntoMapa[] }, tipo: 'inherente' | 'residual') => {
        return (
            <Box sx={{ minWidth: 500, position: 'relative' }}>
                {/* Y-axis label */}
                <Box display="flex" alignItems="center" mb={1.5}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            mr: 2,
                            fontSize: '0.85rem',
                        }}
                    >
                        IMPACTO
                    </Typography>

                    <Box flexGrow={1}>
                        {/* Matrix Grid */}
                        <Box>
                            {[5, 4, 3, 2, 1].map((impacto) => {
                                // Obtener etiqueta de impacto
                                const etiquetasImpacto: Record<number, string> = {
                                    5: 'Extremo',
                                    4: 'Grave',
                                    3: 'Moderado',
                                    2: 'Leve',
                                    1: 'No Significativo',
                                };
                                const etiquetaImpacto = etiquetasImpacto[impacto] || '';

                                return (
                                    <Box key={impacto} display="flex" mb={0.75}>
                                        {/* Y-axis value con etiqueta */}
                                        <Box
                                            sx={{
                                                width: 75,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                backgroundColor: '#f5f5f5',
                                                border: '1px solid #e0e0e0',
                                                p: 0.5,
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                                                {impacto}
                                            </Typography>
                                            <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.2, fontSize: '0.65rem' }}>
                                                {etiquetaImpacto}
                                            </Typography>
                                        </Box>

                                        {/* Cells */}
                                        {[1, 2, 3, 4, 5].map((probabilidad) => {
                                            const key = `${probabilidad}-${impacto}`;
                                            const cellRiesgos = matriz[key] || [];
                                            const cellColor = getCellColor(probabilidad, impacto);
                                            const cellLabel = getCellLabel(probabilidad, impacto);
                                            const bordesLimite = getBordesLimite(probabilidad, impacto);

                                            return (
                                                <Box
                                                    key={probabilidad}
                                                    onClick={() => handleCellClick(probabilidad, impacto, tipo)}
                                                    sx={{
                                                        width: 85,
                                                        minHeight: 85,
                                                        border: '2px solid',
                                                        borderColor: '#000',
                                                        backgroundColor: `${cellColor}20`,
                                                        borderLeftColor: cellColor,
                                                        borderLeftWidth: 3,
                                                        // Bordes rojos muy gruesos y entrecortados para celdas de límite (muy notorios)
                                                        ...(bordesLimite.top && {
                                                            borderTopColor: '#d32f2f',
                                                            borderTopWidth: '10px',
                                                            borderTopStyle: 'dashed',
                                                        }),
                                                        // Solo aplicar borde derecho rojo si explícitamente es true
                                                        ...(bordesLimite.right === true ? {
                                                            borderRightColor: '#d32f2f',
                                                            borderRightWidth: '10px',
                                                            borderRightStyle: 'dashed',
                                                        } : {
                                                            // Mantener borde derecho normal (negro) si no es una celda de límite derecha
                                                            borderRightColor: '#000',
                                                            borderRightWidth: '2px',
                                                            borderRightStyle: 'solid',
                                                        }),
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                        cursor: cellRiesgos.length > 0 ? 'pointer' : 'default',
                                                        transition: 'all 0.2s',
                                                        p: 0.75,
                                                        position: 'relative',
                                                        '&:hover': {
                                                            backgroundColor: `${cellColor}40`,
                                                            transform: cellRiesgos.length > 0 ? 'scale(1.05)' : 'none',
                                                        },
                                                        ml: 0.5,
                                                    }}
                                                >
                                                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                                                        {cellLabel}
                                                    </Typography>
                                                    <Chip
                                                        label={cellRiesgos.length}
                                                        size="small"
                                                        sx={{
                                                            mb: 0.5,
                                                            backgroundColor: cellColor,
                                                            color: '#fff',
                                                            fontWeight: 700,
                                                            fontSize: '0.7rem',
                                                            height: 20,
                                                            '& .MuiChip-label': {
                                                                px: 0.75,
                                                            },
                                                        }}
                                                    />
                                                    {/* IDs de riesgos */}
                                                    {cellRiesgos.length > 0 && (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 0.25,
                                                                width: '100%',
                                                                maxHeight: 45,
                                                                overflowY: 'auto',
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            {cellRiesgos.map((punto: PuntoMapa) => (
                                                                <Chip
                                                                    key={punto.riesgoId}
                                                                    label={generarIdRiesgo(punto)}
                                                                    size="small"
                                                                    onClick={(e) => handleIdRiesgoClick(e, punto)}
                                                                    sx={{
                                                                        fontSize: '0.65rem',
                                                                        height: 18,
                                                                        backgroundColor: '#fff',
                                                                        border: `1px solid ${cellColor}`,
                                                                        color: cellColor,
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            backgroundColor: `${cellColor}15`,
                                                                            transform: 'scale(1.05)',
                                                                        },
                                                                        '& .MuiChip-label': {
                                                                            px: 0.5,
                                                                        },
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                );
                            })}

                            {/* X-axis values con etiquetas */}
                            <Box display="flex" mt={0.75}>
                                <Box sx={{ width: 75 }} />
                                {[1, 2, 3, 4, 5].map((prob) => {
                                    const etiquetasProbabilidad: Record<number, string> = {
                                        1: 'Muy Bajo',
                                        2: 'Bajo',
                                        3: 'Moderada',
                                        4: 'Alta',
                                        5: 'Muy Alta',
                                    };
                                    const etiquetaProb = etiquetasProbabilidad[prob] || '';

                                    return (
                                        <Box
                                            key={prob}
                                            sx={{
                                                width: 85,
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
                                            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                                                {prob}
                                            </Typography>
                                            <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                                {etiquetaProb}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>

                            {/* X-axis label */}
                            <Box display="flex" justifyContent="center" mt={1.5}>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                                    FRECUENCIA/PROBABILIDAD
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    };

    const handleVerEvaluacion = (punto: PuntoMapa) => {
        const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
        if (riesgo) {
            iniciarVer(riesgo);
            navigate(ROUTES.EVALUACION);
            setSummaryDialogOpen(false);
            setDetalleRiesgoDialogOpen(false);
        }
    };

    // Manejar clic en ID del riesgo individual
    const handleIdRiesgoClick = (e: React.MouseEvent, punto: PuntoMapa) => {
        e.stopPropagation(); // Evitar que se active el click de la celda
        const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
        if (riesgo) {
            setRiesgoSeleccionadoDetalle(riesgo);
            setPuntoSeleccionadoDetalle(punto);
            setDetalleRiesgoDialogOpen(true);
        }
    };

    // Obtener evaluación del riesgo seleccionado para el diálogo de detalles
    const { data: evaluacionesRiesgo = [] } = useGetEvaluacionesByRiesgoQuery(
        riesgoSeleccionadoDetalle?.id || '',
        { skip: !riesgoSeleccionadoDetalle }
    );
    const evaluacionRiesgo = evaluacionesRiesgo[0] || null;

    // Supervisor puede ver el mapa sin seleccionar proceso específico
    if (!esSupervisorRiesgos && !procesoSeleccionado) {
        return (
            <Box>
                <Alert severity="warning">
                    Por favor seleccione un proceso desde el Dashboard
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        Mapas de Calor de Riesgos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Matriz 5x5 de Probabilidad vs Impacto - Consecuencias Negativas
                    </Typography>
                </Box>
                <Button
                    variant={mostrarFueraApetito ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setRiesgosFueraApetitoDialogOpen(true)}
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
                                {esSupervisorRiesgos && procesosSupervisor.length > 0 && (
                                    <>
                                        <Autocomplete
                                            options={['all', ...Array.from(new Set(procesosSupervisor.map(p => p.areaId).filter(Boolean)))]}
                                            getOptionLabel={(option) => {
                                                if (option === 'all') return 'Todas las áreas';
                                                const proceso = procesosSupervisor.find(p => p.areaId === option);
                                                return proceso?.areaNombre || `Área ${option}`;
                                            }}
                                            value={filtroArea || 'all'}
                                            onChange={(_e, newValue) => {
                                                setFiltroArea(newValue || 'all');
                                                setFiltroProceso('all');
                                            }}
                                            renderInput={(params) => <TextField {...params} label="Filtrar por Área" />}
                                            sx={{ minWidth: 200 }}
                                            disableClearable
                                        />
                                        <Autocomplete
                                            options={['all', ...procesosSupervisor
                                                .filter(p => !filtroArea || filtroArea === 'all' || p.areaId === filtroArea)
                                                .map(p => p.id)]}
                                            getOptionLabel={(option) => {
                                                if (option === 'all') return 'Todos los procesos';
                                                const proceso = procesosSupervisor.find(p => p.id === option);
                                                return proceso?.nombre || `Proceso ${option}`;
                                            }}
                                            value={filtroProceso || 'all'}
                                            onChange={(_e, newValue) => setFiltroProceso(newValue || 'all')}
                                            renderInput={(params) => <TextField {...params} label="Filtrar por Proceso" />}
                                            sx={{ minWidth: 200 }}
                                            disableClearable
                                        />
                                    </>
                                )}
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Clasificación</InputLabel>
                                    <Select
                                        value={clasificacion}
                                        onChange={(e) => setClasificacion(e.target.value)}
                                        label="Clasificación"
                                        disabled={modoProceso === 'visualizar'}
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
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: colors.risk.critical.main,
                                            borderRadius: 1,
                                        }}
                                    />
                                    <Typography variant="body2">Crítico (=20)</Typography>
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
                                    <Typography variant="body2">Bajo (=4)</Typography>
                                </Box>
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

                    {/* Resumen Comparativo en Tabla Profesional */}
                    {estadisticasComparativas && (
                        <Grid2 xs={12} sx={{ mb: 3 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                                        Resumen Comparativo: Riesgo Inherente vs Residual
                                    </Typography>

                                    <TableContainer component={Paper} elevation={2}>
                                        <Table sx={{ minWidth: 650 }} size="small">
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        Nivel de Riesgo
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        Inherente
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        Residual
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        Cambio
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        Estado
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                                                        %
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[
                                                    { nivel: 'Crítico', key: 'critico', color: colors.risk.critical.main },
                                                    { nivel: 'Alto', key: 'alto', color: colors.risk.high.main },
                                                    { nivel: 'Medio', key: 'medio', color: colors.risk.medium.main },
                                                    { nivel: 'Bajo', key: 'bajo', color: colors.risk.low.main },
                                                ].map(({ nivel, key, color }) => {
                                                    const inherente = estadisticasComparativas.inherente.porNivel[key as keyof typeof estadisticasComparativas.inherente.porNivel];
                                                    const residual = estadisticasComparativas.residual.porNivel[key as keyof typeof estadisticasComparativas.residual.porNivel];
                                                    const cambio = residual - inherente;
                                                    const porcentaje = inherente > 0 ? Math.round((cambio / inherente) * 100) : 0;
                                                    const estado = cambio < 0 ? 'Bajó' : cambio > 0 ? 'Subió' : 'Se mantuvo';
                                                    const estadoColor = cambio < 0 ? 'success.main' : cambio > 0 ? 'error.main' : 'primary.main';

                                                    return (
                                                        <TableRow
                                                            key={key}
                                                            sx={{
                                                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                                                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 16,
                                                                            height: 16,
                                                                            backgroundColor: color,
                                                                            borderRadius: 1,
                                                                        }}
                                                                    />
                                                                    <Typography variant="body2" fontWeight={600}>
                                                                        {nivel}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" fontWeight={700} sx={{ color }}>
                                                                    {inherente}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" fontWeight={700} sx={{ color }}>
                                                                    {residual}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={700}
                                                                    sx={{
                                                                        color: cambio < 0 ? 'success.main' : cambio > 0 ? 'error.main' : 'text.primary',
                                                                    }}
                                                                >
                                                                    {cambio > 0 ? '+' : ''}{cambio}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Chip
                                                                    label={estado}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor:
                                                                            cambio < 0
                                                                                ? 'success.main'
                                                                                : cambio > 0
                                                                                    ? 'error.main'
                                                                                    : 'primary.main',
                                                                        color: 'white',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.75rem',
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={600}
                                                                    sx={{
                                                                        color: cambio < 0 ? 'success.main' : cambio > 0 ? 'error.main' : 'text.primary',
                                                                    }}
                                                                >
                                                                    {porcentaje > 0 ? '+' : ''}{porcentaje}%
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {/* Fila de Total */}
                                                <TableRow
                                                    sx={{
                                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                                        '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'primary.main' },
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            TOTAL
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                                            {estadisticasComparativas.inherente.total}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#9c27b0' }}>
                                                            {estadisticasComparativas.residual.total}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {estadisticasComparativas.residual.total - estadisticasComparativas.inherente.total > 0 ? '+' : ''}
                                                            {estadisticasComparativas.residual.total - estadisticasComparativas.inherente.total}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={`Bajaron: ${estadisticasComparativas.resumen.bajaron}`}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'success.main',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                }}
                                                            />
                                                            <Chip
                                                                label={`Mantuvieron: ${estadisticasComparativas.resumen.seMantuvieron}`}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'primary.main',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                }}
                                                            />
                                                            <Chip
                                                                label={`Subieron: ${estadisticasComparativas.resumen.subieron}`}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: 'error.main',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem',
                                                                }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={700}>
                                                            -
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid2>
                    )}
                </Grid2>
            </Grid2>

            {/* Diálogo de Resumen */}
            <Dialog
                open={summaryDialogOpen}
                onClose={() => setSummaryDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Riesgos en la Celda ({selectedCell?.probabilidad}, {selectedCell?.impacto})
                </DialogTitle>
                <DialogContent>
                    {riesgosCeldaSeleccionada.length === 0 ? (
                        <Alert severity="info">No hay riesgos en esta celda.</Alert>
                    ) : (
                        <List>
                            {riesgosCeldaSeleccionada.map((punto) => {
                                const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                                return (
                                    <Card key={punto.riesgoId} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box>
                                                    <Typography variant="h6" gutterBottom>
                                                        ID: {generarIdRiesgo(punto)}
                                                    </Typography>
                                                    <Chip
                                                        label={punto.nivelRiesgo}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getCellColor(punto.probabilidad, punto.impacto),
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
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleVerEvaluacion(punto)}
                                                >
                                                    Ver Evaluación
                                                </Button>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                <strong>Descripción:</strong> {punto.descripcion}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                <Typography variant="body2">
                                                    <strong>Probabilidad:</strong> {punto.probabilidad}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Impacto:</strong> {punto.impacto}
                                                </Typography>
                                                {riesgo && (
                                                    <>
                                                        <Typography variant="body2">
                                                            <strong>Zona:</strong> {riesgo.zona}
                                                        </Typography>
                                                        {riesgo.tipologiaNivelI && (
                                                            <Typography variant="body2">
                                                                <strong>Tipología:</strong> {riesgo.tipologiaNivelI}
                                                            </Typography>
                                                        )}
                                                    </>
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
                    <Button onClick={() => setSummaryDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de Detalles del Riesgo Individual */}
            <Dialog
                open={detalleRiesgoDialogOpen}
                onClose={() => setDetalleRiesgoDialogOpen(false)}
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
                                                backgroundColor: getCellColor(puntoSeleccionadoDetalle.probabilidad, puntoSeleccionadoDetalle.impacto),
                                                color: '#fff',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <Chip
                                            label={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                                            size="small"
                                            color={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                                        />
                                        <Chip
                                            label={`Zona: ${riesgoSeleccionadoDetalle.zona}`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        <strong>Descripción:</strong> {riesgoSeleccionadoDetalle.descripcion}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Probabilidad:</strong> {puntoSeleccionadoDetalle.probabilidad}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Impacto:</strong> {puntoSeleccionadoDetalle.impacto}
                                        </Typography>
                                        {riesgoSeleccionadoDetalle.tipologiaNivelI && (
                                            <Typography variant="body2">
                                                <strong>Tipología:</strong> {riesgoSeleccionadoDetalle.tipologiaNivelI}
                                            </Typography>
                                        )}
                                    </Box>

                                    {/* Información del Proceso y Responsable */}
                                    {riesgoSeleccionadoDetalle.procesoId && (() => {
                                        const procesoRiesgo = procesos.find(p => p.id === riesgoSeleccionadoDetalle.procesoId);
                                        return procesoRiesgo ? (
                                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                    Información del Proceso
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    <Typography variant="body2">
                                                        <strong>Proceso:</strong> {procesoRiesgo.nombre}
                                                    </Typography>
                                                    {procesoRiesgo.responsableNombre && (
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
                                                    {procesoRiesgo.areaNombre && (
                                                        <Typography variant="body2">
                                                            <strong>Área:</strong> {procesoRiesgo.areaNombre}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        ) : null;
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
                                                        backgroundColor: getCellColor(evaluacionRiesgo.probabilidad, evaluacionRiesgo.impactoMaximo),
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
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetalleRiesgoDialogOpen(false)}>
                        Cerrar
                    </Button>
                    {puntoSeleccionadoDetalle && (
                        <Button
                            variant="contained"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleVerEvaluacion(puntoSeleccionadoDetalle)}
                        >
                            Más Detalles
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Diálogo de Riesgos Fuera del Apetito */}
            <Dialog
                open={riesgosFueraApetitoDialogOpen}
                onClose={() => setRiesgosFueraApetitoDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600} color="error">
                            Riesgos Fuera del Apetito
                        </Typography>
                        <Chip
                            label={`${riesgosFueraApetito.length} riesgo${riesgosFueraApetito.length !== 1 ? 's' : ''}`}
                            color="error"
                            size="small"
                        />
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Los siguientes riesgos tienen un valor de riesgo = 15 y requieren atención inmediata.
                    </Alert>
                    {riesgosFueraApetito.length === 0 ? (
                        <Alert severity="success">
                            No hay riesgos fuera del apetito. Todos los riesgos están dentro del nivel aceptable.
                        </Alert>
                    ) : (
                        <List>
                            {riesgosFueraApetito.map(({ punto, riesgo, valorRiesgo }) => (
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
                                                        setDetalleRiesgoDialogOpen(true);
                                                        setRiesgosFueraApetitoDialogOpen(false);
                                                    }
                                                }}
                                            >
                                                Ver Detalle
                                            </Button>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            <strong>Descripción:</strong> {punto.descripcion || riesgo?.descripcion || 'Sin descripción'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Probabilidad:</strong> {punto.probabilidad}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Impacto:</strong> {punto.impacto}
                                            </Typography>
                                            {riesgo?.zona && (
                                                <Typography variant="body2">
                                                    <strong>Zona:</strong> {riesgo.zona}
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
                    <Button onClick={() => setRiesgosFueraApetitoDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}


