import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Button,
    Grid,
    Skeleton,
    Tooltip,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    GridView as InherentIcon,
    GetApp as ResidualIcon,
    LinearScale as ToleranceIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import {
    useGetMapaConfigQuery,
    useUpdateMapaConfigMutation,
    useGetNivelesRiesgoQuery,
    useGetClasificacionesRiesgoQuery,
    useGetEjesMapaQuery
} from '../../api/services/riesgosApi';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import LoadingActionButton from '../../components/ui/LoadingActionButton';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import { MAPA_POSITIVO_COLORES } from '../../utils/mapaPositivoPalette';


// Tipos para la configuración
type MapaConfigType = 'inherente' | 'residual';
type MapaTabType = MapaConfigType | 'tolerancia';

const PALETA_POSITIVA = [
    { label: 'EXTREMO', color: MAPA_POSITIVO_COLORES.extremo },
    { label: 'ALTO', color: MAPA_POSITIVO_COLORES.alto },
    { label: 'MEDIO', color: MAPA_POSITIVO_COLORES.medio },
    { label: 'BAJO', color: MAPA_POSITIVO_COLORES.bajo },
] as const;
type ItemLeyenda = { id?: string; nombre?: string; label?: string; color: string };

interface MapaGridProps {
    type: MapaConfigType | 'tolerancia';
    config: Record<string, string> | string[];
    niveles: any[];
    onUpdate: (newConfig: any) => void;
}
interface NivelRiesgoBase {
    id: string;
    nombre: string;
    color: string;
    [key: string]: unknown;
}

const MapaGrid: React.FC<MapaGridProps> = ({ type, config, niveles, onUpdate }) => {
    const { data: ejes } = useGetEjesMapaQuery();
    const probabilidades = ejes?.probabilidad.map(p => p.valor) || [1, 2, 3, 4, 5];
    // Impacto Y-axis descending (5 to 1)
    const impactos = ejes?.impacto.map(i => i.valor).sort((a, b) => b - a) || [5, 4, 3, 2, 1];

    const isToleranceMode = type === 'tolerancia';
    const isPositiveMode = type === 'residual';
    const toleranceList = isToleranceMode ? (config as string[]) : [];
    const colorConfig = !isToleranceMode ? (config as Record<string, string>) : {};
    const coloresPositivosPermitidos = PALETA_POSITIVA.map((p) => p.color.toLowerCase());

    const colorPositivoPorRiesgo = (prob: number, imp: number): string => {
        let riesgo = prob * imp;
        if (prob === 2 && imp === 2) riesgo = 3.99;
        if (riesgo >= 15 && riesgo <= 25) return PALETA_POSITIVA[0].color;
        if (riesgo >= 10 && riesgo <= 14) return PALETA_POSITIVA[1].color;
        if (riesgo >= 4 && riesgo <= 9) return PALETA_POSITIVA[2].color;
        return PALETA_POSITIVA[3].color;
    };

    const handleCellClick = (prob: number, imp: number) => {
        const key = `${prob}-${imp}`;

        if (isToleranceMode) {
            // Toggle tolerance
            const exists = toleranceList.includes(key);
            const newList = exists
                ? toleranceList.filter(k => k !== key)
                : [...toleranceList, key];
            onUpdate(newList);
            return;
        }

        // Color Mode
        let newConfig: Record<string, string>;
        if (isPositiveMode) {
            const currentColorRaw = colorConfig[key] || colorPositivoPorRiesgo(prob, imp);
            const currentColor = String(currentColorRaw).toLowerCase();
            const colorActualNormalizado = coloresPositivosPermitidos.includes(currentColor)
                ? currentColor
                : colorPositivoPorRiesgo(prob, imp).toLowerCase();
            const currentIndex = Math.max(
                0,
                PALETA_POSITIVA.findIndex((p) => p.color.toLowerCase() === colorActualNormalizado)
            );
            const nextIndex = (currentIndex + 1) % PALETA_POSITIVA.length;
            newConfig = {
                ...colorConfig,
                [key]: PALETA_POSITIVA[nextIndex].color,
            };
        } else {
            const currentLevelId = colorConfig[key] || '5';
            const currentIndex = niveles.findIndex(n => n.id === currentLevelId);
            const nextIndex = (currentIndex + 1) % niveles.length;
            const nextLevel = niveles[nextIndex];
            newConfig = {
                ...colorConfig,
                [key]: nextLevel.id
            };
        }
        onUpdate(newConfig);
    };

    const getCellColor = (prob: number, imp: number) => {
        const key = `${prob}-${imp}`;

        if (isToleranceMode) {
            // In tolerance mode, show grey background if not selected, or light green if selected?
            // User wants to see the "Line". 
            // Only way to visualize line is borders.
            // Let's color the "Accepted" zone in Light Blue and "Rejected" in Light Red for clarity in this mode
            return toleranceList.includes(key) ? '#e3f2fd' : '#ffebee';
        }

        const levelId = colorConfig[key];
        if (isPositiveMode) {
            if (typeof levelId === 'string' && levelId.startsWith('#')) {
                const colorHex = levelId.toLowerCase();
                if (coloresPositivosPermitidos.includes(colorHex)) return levelId;
            }
            if (levelId) {
                const level = niveles.find(n => n.id === levelId);
                if (level?.color) {
                    const colorNivel = String(level.color).toLowerCase();
                    if (coloresPositivosPermitidos.includes(colorNivel)) return level.color;
                }
            }
            return colorPositivoPorRiesgo(prob, imp);
        }
        const level = niveles.find(n => n.id === levelId);
        return level ? level.color : '#e0e0e0';
    };

    const getCellBorder = (prob: number, imp: number) => {
        if (!isToleranceMode) return '1px solid #fff';

        const key = `${prob}-${imp}`;
        const isAccepted = toleranceList.includes(key);

        // If this cell is accepted, but neighbor is NOT, draw thick red border
        // Neighbors: Top (p+1), Right (i+1)

        let borderTop = '1px solid #fff';
        let borderRight = '1px solid #fff';
        let borderBottom = '1px solid #fff';
        let borderLeft = '1px solid #fff';

        const style = '3px dashed #d32f2f';

        // Check Top (prob + 1)
        if (prob < 5) {
            const topKey = `${prob + 1}-${imp}`;
            const topAccepted = toleranceList.includes(topKey);
            if (isAccepted !== topAccepted) borderTop = style;
        }

        // Check Right (imp + 1)
        if (imp < 5) {
            const rightKey = `${prob}-${imp + 1}`;
            const rightAccepted = toleranceList.includes(rightKey);
            if (isAccepted !== rightAccepted) borderRight = style;
        }

        // Check Bottom (prob - 1)
        if (prob > 1) {
            const bottomKey = `${prob - 1}-${imp}`;
            const bottomAccepted = toleranceList.includes(bottomKey);
            if (isAccepted !== bottomAccepted) borderBottom = style;
        }

        // Check Left (imp - 1)
        if (imp > 1) {
            const leftKey = `${prob}-${imp - 1}`;
            const leftAccepted = toleranceList.includes(leftKey);
            if (isAccepted !== leftAccepted) borderLeft = style;
        }

        return `${borderTop} ${borderRight} ${borderBottom} ${borderLeft}`; // This syntax is invalid for border shorthand like this, need separate properties
        // Actually sx border prop doesn't support separate sides easily in one string.
        // We will return an object
    };

    const getBorderStyle = (prob: number, imp: number) => {
        if (!isToleranceMode) return { border: '1px solid #fff' };

        const key = `${prob}-${imp}`;
        const isAccepted = toleranceList.includes(key);
        const style = '4px dashed #d32f2f';
        const normal = '1px solid #fff';

        const borders: any = {
            borderTop: normal,
            borderRight: normal,
            borderBottom: normal,
            borderLeft: normal
        };

        // Logic: Draw border if neighbor has different status
        const checkNeighbor = (p: number, i: number) => {
            // Out of bounds is considered "Rejected" zone? Or same as current boundary?
            // Usually boundary is only between cells. 
            if (p > 5 || p < 1 || i > 5 || i < 1) return isAccepted; // If out of bounds, treat as same so no border? 
            // Actually if out of bounds, we usually don't draw border unless it's the edge of matrix.
            // Let's imply strict 5x5.
            const nKey = `${p}-${i}`;
            return toleranceList.includes(nKey);
        };

        if (isAccepted !== checkNeighbor(prob, imp + 1) && imp < 5) borders.borderTop = style;    // Top Neighbor is (prob, imp+1)
        if (isAccepted !== checkNeighbor(prob + 1, imp) && prob < 5) borders.borderRight = style; // Right Neighbor is (prob+1, imp)
        if (isAccepted !== checkNeighbor(prob, imp - 1) && imp > 1) borders.borderBottom = style; // Bottom Neighbor is (prob, imp-1)
        if (isAccepted !== checkNeighbor(prob - 1, imp) && prob > 1) borders.borderLeft = style;  // Left Neighbor is (prob-1, imp)

        return borders;
    };

    const getCellLabel = (prob: number, imp: number) => {
        const key = `${prob}-${imp}`;

        if (isToleranceMode) {
            return toleranceList.includes(key) ? 'TOLERABLE' : 'NO TOLERABLE';
        }

        const levelId = colorConfig[key];
        if (isPositiveMode) {
            const color = getCellColor(prob, imp).toLowerCase();
            const encontrado = PALETA_POSITIVA.find((p) => p.color.toLowerCase() === color);
            return encontrado?.label || '?';
        }
        const level = niveles.find(n => n.id === levelId);
        return level ? level.nombre : '?';
    };

    const getCellTextColor = (prob: number, imp: number) => {
        if (isToleranceMode) {
            const key = `${prob}-${imp}`;
            return toleranceList.includes(key) ? '#1565c0' : '#c62828';
        }
        return '#fff';
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex' }}>
                {/* Eje Y Label */}
                <Box sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', mr: 2, textAlign: 'center', fontWeight: 'bold' }}>
                    IMPACTO
                </Box>

                <Box>
                    {impactos.map((imp) => {
                        const labelImp = ejes?.impacto.find(i => i.valor === imp)?.nombre || imp;
                        return (
                            <Box key={`row-${imp}`} sx={{ display: 'flex', mb: 0.5 }}>
                                {/* Row Label (Impact) */}
                                <Box sx={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', mr: 1, border: '1px solid #eee', bgcolor: '#f5f5f5', p: 0.5 }}>
                                    <Typography variant="body2">{imp}</Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', textAlign: 'center', lineHeight: 1 }}>{labelImp}</Typography>
                                </Box>

                                {probabilidades.map((prob) => { // Inner: Probability
                                    const labelProb = ejes?.probabilidad.find(p => p.valor === prob)?.nombre || prob;
                                    const clave = `${prob}-${imp}`; // Key stays prob-imp

                                    return (
                                        <Tooltip key={`${prob}-${imp}`} title={`Prob: ${prob} (${labelProb}), Imp: ${imp} (${labelImp})`}>
                                            <Box
                                                onClick={() => handleCellClick(prob, imp)}
                                                sx={{
                                                    width: 80,
                                                    height: 60,
                                                    bgcolor: getCellColor(prob, imp),
                                                    ...getBorderStyle(prob, imp), // Apply dynamic borders
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: getCellTextColor(prob, imp),
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem',
                                                    mr: 0.5,
                                                    borderRadius: 1,
                                                    transition: 'all 0.2s',
                                                    userSelect: 'none',
                                                    '&:hover': {
                                                        opacity: 0.8,
                                                        transform: 'scale(1.05)',
                                                        zIndex: 1
                                                    },
                                                    textShadow: !isToleranceMode ? '0px 1px 2px rgba(0,0,0,0.5)' : 'none'
                                                }}
                                            >
                                                {getCellLabel(prob, imp)}
                                            </Box>
                                        </Tooltip>
                                    )
                                })}
                            </Box>
                        )
                    })}

                    {/* Eje X Labels (Probability) */}
                    <Box sx={{ display: 'flex', mt: 1, ml: 11 }}> {/* Indent for Y-axis label width */}
                        {probabilidades.map((prob) => {
                            const labelProb = ejes?.probabilidad.find(p => p.valor === prob)?.nombre || prob;
                            return (
                                <Box key={`head-${prob}`} sx={{ width: 80, textAlign: 'center', mr: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">{prob}</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1 }}>{labelProb}</Typography>
                                </Box>
                            )
                        })}
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 1, ml: 11, fontWeight: 'bold' }}>
                        FRECUENCIA / PROBABILIDAD
                    </Box>
                </Box>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {!isToleranceMode && (isPositiveMode ? PALETA_POSITIVA : niveles).map((nivel: ItemLeyenda) => (
                    <Box key={nivel.id || nivel.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: nivel.color, borderRadius: 0.5 }} />
                        <Typography variant="caption">{nivel.nombre || nivel.label}</Typography>
                    </Box>
                ))}
                {isToleranceMode && (
                    <Typography variant="caption" color="text.secondary">
                        La línea discontinua roja indica el límite de la tolerancia al riesgo.
                        Los riesgos en la zona azul son "Tolerables", los de la zona roja son "No Tolerables".
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default function MapasConfigPage({ embedded = false }: { embedded?: boolean }) {
    const { puedeEditar } = useAuth();
    const canEdit = puedeEditar !== false;
    const [tabValue, setTabValue] = useState<MapaTabType>('inherente');
    const [searchTerm, setSearchTerm] = useState('');
    const { data: configDataRaw, isLoading: isLoadingConfig } = useGetMapaConfigQuery();
    const { data: nivelesData, isLoading: isLoadingNiveles } = useGetNivelesRiesgoQuery();
    const nivelesPositivos = useMemo(() => {
        if (!nivelesData) return [];
        const porNombre: Record<string, { nombre: string; color: string }> = {
            critico: { nombre: 'EXTREMO', color: MAPA_POSITIVO_COLORES.extremo },
            alto: { nombre: 'ALTO', color: MAPA_POSITIVO_COLORES.alto },
            medio: { nombre: 'MEDIO', color: MAPA_POSITIVO_COLORES.medio },
            bajo: { nombre: 'BAJO', color: MAPA_POSITIVO_COLORES.bajo },
            'muy alto': { nombre: 'EXTREMO', color: MAPA_POSITIVO_COLORES.extremo },
            'muy bajo': { nombre: 'BAJO', color: MAPA_POSITIVO_COLORES.bajo },
        };

        return (nivelesData as NivelRiesgoBase[]).map((nivel) => {
            const clave = String(nivel?.nombre || '').trim().toLowerCase();
            const mapeado = porNombre[clave];
            return mapeado
                ? { ...nivel, nombre: mapeado.nombre, color: mapeado.color }
                : nivel;
        });
    }, [nivelesData]);

    const [updateMapaConfig, { isLoading: isUpdating }] = useUpdateMapaConfigMutation();

    // Simplify type handling
    const configData: any = configDataRaw;

    // We need to access the root config for maxRiesgosVisible 
    // but localConfig only holds the tab-specific data.
    // We'll read maxRiesgosVisible directly from configDataRaw where needed.

    const { showSuccess, showError } = useNotification();
    const [localConfig, setLocalConfig] = useState<any>(null);

    useEffect(() => {
        if (configData) setLocalConfig(configData[tabValue]);
    }, [configData, tabValue]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: MapaTabType) => {
        setTabValue(newValue);
        setLocalConfig(null);
    };

    const handleUpdateConfig = (newConfig: any) => {
        setLocalConfig(newConfig);
    };

    const handleSave = async () => {
        if (!localConfig) return;
        try {
            await updateMapaConfig({ type: tabValue as any, data: localConfig }).unwrap();
            showSuccess('Guardado correctamente');
        } catch (error) {
            showError('Error al guardar configuración');
        }
    };

    if (isLoadingConfig || isLoadingNiveles) {
        return (
            <AppPageLayout title="Configuración del Mapa de Riesgos">
                <PageLoadingSkeleton variant="table" tableRows={5} />
            </AppPageLayout>
        );
    }

    const mainContent = (
        <>
            <Box sx={{ mt: embedded ? 0 : -2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: '#f9f9f9',
                        '& .MuiTab-root': {
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            padding: '12px 16px',
                            flex: 1,
                            textTransform: 'none',
                            fontSize: '14px'
                        },
                        '& .MuiTabs-indicator': {
                            height: 3
                        }
                    }}
                >
                    <Tab
                        icon={<InherentIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Mapa Negativos"
                        value="inherente"
                    />
                    <Tab
                        icon={<ResidualIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Mapa Positivos"
                        value="residual"
                    />
                    <Tab
                        icon={<ToleranceIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Línea de Tolerancia"
                        value="tolerancia"
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {localConfig && nivelesData ? (
                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 2, minWidth: '300px' }}>
                                <MapaGrid
                                    type={tabValue}
                                    config={localConfig}
                                    niveles={tabValue === 'residual' ? nivelesPositivos : nivelesData}
                                    onUpdate={canEdit ? handleUpdateConfig : () => {}}
                                />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: '250px' }}>
                                <Paper variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>Acciones</Typography>

                                    <LoadingActionButton
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleSave}
                                        disabled={!canEdit}
                                        loading={isUpdating}
                                        loadingText="Guardando..."
                                    >
                                        Guardar Cambios
                                    </LoadingActionButton>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                                        {tabValue === 'tolerancia'
                                            ? 'La línea de tolerancia es una referencia visual importante para los reportes.'
                                            : 'Esta configuración afectará colores y niveles de riesgo en todo el sistema.'}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ py: 2 }}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1, mb: 1 }} />
                            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1 }} />
                        </Box>
                    )}
                </Box>
            </Box>


        </>
    );

    if (embedded) {
        return (
            <Box>
                {mainContent}
            </Box>
        );
    }

    return (
        <AppPageLayout
            title="Configuración de Mapa de Riesgos"
            description="Defina niveles, colores y tolerancia para mapas inherente y residual (negativos y positivos)."
        >
            {mainContent}
        </AppPageLayout>
    );
}
