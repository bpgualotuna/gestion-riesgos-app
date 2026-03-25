/**
 * DOFA Page
 * Matriz FODA (Fortalezas, Oportunidades, Debilidades, Amenazas)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import { useProcesosFiltradosPorArea, useIsReadOnlyProceso } from '../../hooks/useAsignaciones';
import { Alert, Chip } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges, useArrayChanges } from '../../hooks/useUnsavedChanges';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';
import {
  aplicarSincronizacionDofaAContextoItems,
  describeOrigenItemDofaMatriz,
  normalizeDofaTipoToCanonical,
  type DofaTipoCuadrante,
} from '../../utils/contextoDofaSync';



interface DofaItem {
  id: string;
  descripcion: string;
}

const TOOLTIP_TAB_MATRIZ =
  'Vista conjunta. Fortalezas y Debilidades provienen del Contexto interno; Oportunidades y Amenazas del Contexto externo.';
const TOOLTIP_TAB_OPORTUNIDADES =
  'Oportunidades = factor externo positivo. Edítalo en Contexto externo (pestaña Positivo). En esta pantalla solo puedes eliminar.';
const TOOLTIP_TAB_AMENAZAS =
  'Amenazas = factor externo negativo. Edítalo en Contexto externo (pestaña Negativo). En esta pantalla solo puedes eliminar.';
const TOOLTIP_TAB_FORTALEZAS =
  'Fortalezas = factor interno positivo. Edítalo en Contexto interno (pestaña Positivo). En esta pantalla solo puedes eliminar.';
const TOOLTIP_TAB_DEBILIDADES =
  'Debilidades = factor interno negativo. Edítalo en Contexto interno (pestaña Negativo). En esta pantalla solo puedes eliminar.';

export default function DofaPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const { esSupervisorRiesgos, esGerenteGeneralDirector, esDueñoProcesos } = useAuth();
  const {
    procesosVisibles,
    areasDisponibles: areasVisibles,
    procesosFiltrados: procesosFiltradosPorArea,
    filtroArea,
    setFiltroArea,
  } = useProcesosFiltradosPorArea('all');
  const isReadOnly = useIsReadOnlyProceso();
  const { setScreenContext } = useCoraIAContext(); // NUEVO: Hook de CORA IA

  // Mostrar skeleton de carga mientras los procesos cargan
  if (isLoadingProceso) {
    return (
      <AppPageLayout
        title="Matriz DOFA"
        description="Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  // Dueño de Proceso: si no tiene proceso seleccionado en el header, mostrar solo mensaje
  if (esDueñoProcesos && !procesoSeleccionado?.id) {
    return (
      <AppPageLayout
        title="Matriz DOFA"
        description="Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined">
            No hay un proceso seleccionado. Por favor selecciona un proceso de la lista en la parte superior para ver su matriz DOFA.
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DofaItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // Fetch process details directly
  const { data: procesoData, refetch: refetchProceso } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  // Estados para los cuadrantes DOFA (DEBEN estar ANTES de los useEffect)
  const [oportunidades, setOportunidades] = useState<DofaItem[]>([]);
  const [amenazas, setAmenazas] = useState<DofaItem[]>([]);
  const [fortalezas, setFortalezas] = useState<DofaItem[]>([]);
  const [debilidades, setDebilidades] = useState<DofaItem[]>([]);

  const [initialOportunidades, setInitialOportunidades] = useState<DofaItem[]>([]);
  const [initialAmenazas, setInitialAmenazas] = useState<DofaItem[]>([]);
  const [initialFortalezas, setInitialFortalezas] = useState<DofaItem[]>([]);
  const [initialDebilidades, setInitialDebilidades] = useState<DofaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const hasOportunidadesChanges = useArrayChanges(initialOportunidades, oportunidades);
  const hasAmenazasChanges = useArrayChanges(initialAmenazas, amenazas);
  const hasFortalezasChanges = useArrayChanges(initialFortalezas, fortalezas);
  const hasDebilidadesChanges = useArrayChanges(initialDebilidades, debilidades);

  const hasAnyChanges =
    hasOportunidadesChanges ||
    hasAmenazasChanges ||
    hasFortalezasChanges ||
    hasDebilidadesChanges;

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasAnyChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en la matriz DOFA.',
    disabled: isReadOnly,
  });

  // Estado para confirmar eliminación
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ tipo: string; id: string } | null>(null);

  const contextoItems = useMemo(() => {
    const raw = (procesoData as { contextoItems?: unknown } | undefined)?.contextoItems;
    return Array.isArray(raw) ? raw : [];
  }, [procesoData]);

  useEffect(() => {
    if (procesoData && Array.isArray(procesoData.dofaItems)) {
      const items = procesoData.dofaItems as Array<{ id?: string; tipo?: string; descripcion?: string }>;
      const toItem = (i: { id?: string; descripcion?: string }) => ({
        id: String(i.id ?? `temp-${Date.now()}-${Math.random()}`),
        descripcion: i.descripcion ?? '',
      });
      const fortalezasData = items.filter((i) => normalizeDofaTipoToCanonical(i.tipo) === 'FORTALEZA').map(toItem);
      const oportunidadesData = items.filter((i) => normalizeDofaTipoToCanonical(i.tipo) === 'OPORTUNIDAD').map(toItem);
      const debilidadesData = items.filter((i) => normalizeDofaTipoToCanonical(i.tipo) === 'DEBILIDAD').map(toItem);
      const amenazasData = items.filter((i) => normalizeDofaTipoToCanonical(i.tipo) === 'AMENAZA').map(toItem);
      
      setFortalezas(fortalezasData);
      setOportunidades(oportunidadesData);
      setDebilidades(debilidadesData);
      setAmenazas(amenazasData);
      
      setInitialFortalezas(fortalezasData);
      setInitialOportunidades(oportunidadesData);
      setInitialDebilidades(debilidadesData);
      setInitialAmenazas(amenazasData);
    }
  }, [procesoData]);

  // NUEVO: Actualizar contexto de pantalla para CORA IA
  useEffect(() => {
    if (procesoSeleccionado && setScreenContext) {
      const cuadrantes = [
        { nombre: 'Fortalezas', items: fortalezas.slice(0, 5), total: fortalezas.length },
        { nombre: 'Oportunidades', items: oportunidades.slice(0, 5), total: oportunidades.length },
        { nombre: 'Debilidades', items: debilidades.slice(0, 5), total: debilidades.length },
        { nombre: 'Amenazas', items: amenazas.slice(0, 5), total: amenazas.length }
      ];

      const context: ScreenContext = {
        module: 'dofa',
        screen: 'matriz',
        action: isReadOnly ? 'view' : 'edit',
        processId: procesoSeleccionado.id,
        route: window.location.pathname,
        formData: {
          cuadrantes: cuadrantes.map(c => ({
            nombre: c.nombre,
            total: c.total,
            items: c.items.map(i => i.descripcion).filter(d => d.trim())
          })),
          totalFortalezas: fortalezas.length,
          totalOportunidades: oportunidades.length,
          totalDebilidades: debilidades.length,
          totalAmenazas: amenazas.length,
          hasChanges: hasAnyChanges
        }
      };
      
      setScreenContext(context);
    }
  }, [procesoSeleccionado, fortalezas, oportunidades, debilidades, amenazas, isReadOnly, hasAnyChanges, setScreenContext]);

  const handleDelete = (
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades',
    id: string
  ) => {
    const filterItems = (items: DofaItem[]) => items.filter((item) => item.id !== id);

    switch (tipo) {
      case 'oportunidades':
        setOportunidades(filterItems(oportunidades));
        break;
      case 'amenazas':
        setAmenazas(filterItems(amenazas));
        break;
      case 'fortalezas':
        setFortalezas(filterItems(fortalezas));
        break;
      case 'debilidades':
        setDebilidades(filterItems(debilidades));
        break;
    }
  };

  const handleSave = async () => {
    if (!procesoSeleccionado) return;

    const allItems = [
      ...oportunidades.map(i => ({ descripcion: i.descripcion, tipo: 'OPORTUNIDAD' })),
      ...amenazas.map(i => ({ descripcion: i.descripcion, tipo: 'AMENAZA' })),
      ...fortalezas.map(i => ({ descripcion: i.descripcion, tipo: 'FORTALEZA' })),
      ...debilidades.map(i => ({ descripcion: i.descripcion, tipo: 'DEBILIDAD' })),
    ];

    const rawCtx = (procesoData as any)?.contextoItems as Array<{ tipo: string; signo: string; descripcion: string }> | undefined;
    const contextosLegacy = (procesoData as any)?.contextos ?? [];
    const contextoItemsActualizados =
      Array.isArray(rawCtx) && rawCtx.length > 0
        ? aplicarSincronizacionDofaAContextoItems(rawCtx, {
            FORTALEZA: fortalezas,
            OPORTUNIDAD: oportunidades,
            DEBILIDAD: debilidades,
            AMENAZA: amenazas,
          })
        : null;

    try {
      setIsSaving(true);
      await updateProceso({
        id: String(procesoSeleccionado.id),
        dofaItems: allItems,
        ...(contextoItemsActualizados
          ? {
              contextos: contextosLegacy,
              contextoItems: contextoItemsActualizados.map((c) => ({
                tipo: c.tipo,
                signo: c.signo,
                descripcion: c.descripcion,
                enviarADofa: c.enviarADofa,
                dofaDimension: c.dofaDimension,
              })),
            }
          : {}),
      } as any).unwrap();

      setInitialOportunidades(oportunidades);
      setInitialAmenazas(amenazas);
      setInitialFortalezas(fortalezas);
      setInitialDebilidades(debilidades);

      markAsSaved();
      await refetchProceso();
      showSuccess('Matriz DOFA guardada exitosamente');
    } catch (error: any) {
      console.error('[DOFA] Error al guardar la matriz', error);
      if (showError) {
        const apiMessage =
          error?.data?.error ||
          error?.error ||
          'Error inesperado al guardar la matriz DOFA.';
        showError(apiMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!isSaving) {
      forceNavigate();
    }
  };

  const handleDiscardChanges = () => {
    setOportunidades(initialOportunidades);
    setAmenazas(initialAmenazas);
    setFortalezas(initialFortalezas);
    setDebilidades(initialDebilidades);
    forceNavigate();
  };

  const [filtroProceso, setFiltroProceso] = useState<string>('all');

  const procesosFiltrados = useMemo(() => {
    if (filtroProceso === 'all') return procesosFiltradosPorArea;
    return procesosFiltradosPorArea.filter((p: any) => p.id === filtroProceso);
  }, [procesosFiltradosPorArea, filtroProceso]);

  const procesosPorArea = useMemo(() => {
    const grouped: Record<string, { areaId: string; areaNombre: string; procesos: any[] }> = {};
    procesosFiltrados.forEach((p: any) => {
      const areaId = p.areaId || 'sin_area';
      const areaNombre = p.areaNombre || 'Sin área asignada';
      if (!grouped[areaId]) {
        grouped[areaId] = { areaId, areaNombre, procesos: [] };
      }
      grouped[areaId].procesos.push(p);
    });
    return Object.values(grouped);
  }, [procesosFiltrados]);

  // Si es supervisor/gerente director, mostrar filtros de proceso
  if ((esSupervisorRiesgos || esGerenteGeneralDirector) && procesosVisibles.length > 0 && !procesoSeleccionado) {
    return (
      <AppPageLayout
        title="Matriz DOFA"
        description="Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas del proceso."
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
            Seleccione un proceso para ver su matriz DOFA. Usted supervisa {procesosVisibles.length} proceso(s).
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }

  // Si es supervisor/gerente director y tiene proceso seleccionado, verificar que sea uno de sus procesos
  if (
    (esSupervisorRiesgos || esGerenteGeneralDirector) &&
    procesoSeleccionado &&
    !procesosVisibles.find((p: any) => String(p.id) === String(procesoSeleccionado.id))
  ) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Este proceso no está asignado a su supervisión. Por favor seleccione uno de sus procesos.
        </Alert>
      </Box>
    );
  }

  // Validación removida - permite cargar sin proceso seleccionado

  const confirmDelete = () => {
    if (itemToDelete) {
      handleDelete(itemToDelete.tipo as any, itemToDelete.id);
      setDeleteConfirmationOpen(false);
      setItemToDelete(null);
      showSuccess('Elemento eliminado correctamente');
    }
  };

  const requestDelete = (tipo: string, id: string) => {
    setItemToDelete({ tipo, id });
    setDeleteConfirmationOpen(true);
  };

  const renderDofaSection = (
    title: string,
    items: DofaItem[],
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades',
    cuadrante: DofaTipoCuadrante
  ) => (
    <Box>
      <FiltroProcesoSupervisor />
      <Box sx={{ mt: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        El texto se edita en Contexto interno o Contexto externo. Aquí solo puedes eliminar ítems de la matriz (pulsa Guardar DOFA para aplicar).
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, index) => (
          <Box key={item.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Tooltip
              title={describeOrigenItemDofaMatriz(item.descripcion, cuadrante, contextoItems)}
              placement="top"
              enterDelay={400}
              slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
            >
              <Paper
                component="div"
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 2,
                  minHeight: 88,
                  borderRadius: 2,
                  backgroundColor: '#fafafa',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {title} {index + 1}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                    color: '#424242',
                  }}
                >
                  {item.descripcion?.trim() ? item.descripcion : 'Sin descripción'}
                </Typography>
              </Paper>
            </Tooltip>
            {!isReadOnly && (
              <IconButton
                color="error"
                onClick={() => requestDelete(tipo, item.id)}
                title="Eliminar de la matriz DOFA"
                sx={{ mt: 0.5 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hay elementos. Añádelos desde Contexto interno o Contexto externo.
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en la matriz DOFA."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Matriz DOFA"
      description="Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas del proceso."
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {!isReadOnly && (
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                background: '#1976d2',
                color: '#fff',
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
              }}
            >
              Guardar DOFA
            </Button>
          )}
        </Box>
      }
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ mb: 0, borderRadius: 2 }}>
            Está en modo visualización. Solo puede ver la información. Para editar, seleccione el proceso en modo "Editar" desde el Dashboard.
          </Alert>
        )
      }
    >
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Está en modo visualización. Solo puede ver la información.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
              zIndex: 10,
              pb: 2,
              mb: 3,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ mb: 2, color: '#1976d2' }}>
              Matriz DOFA
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 0,
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  borderRight: '1px solid #e0e0e0',
                  pr: 2,
                  mr: 0,
                }}
              >
                <Tabs
                  value={tabValue === 0 ? 0 : false}
                  onChange={(_, newValue) => {
                    if (newValue === 0) setTabValue(0);
                  }}
                  sx={{
                    minHeight: 'auto',
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      padding: '12px 16px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      color: '#1976d2',
                    },
                  }}
                >
                  <Tab
                    icon={<FactCheckIcon />}
                    iconPosition="start"
                    label="MATRIZ DOFA"
                    title={TOOLTIP_TAB_MATRIZ}
                  />
                </Tabs>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f5f5f5',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#1976d2',
                    borderRadius: '4px',
                    '&:hover': {
                      background: '#1565c0',
                    },
                  },
                }}
              >
                <Tabs
                  value={tabValue === 0 ? false : tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 'auto',
                    '& .MuiTabs-scrollButtons': {
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    },
                    '& .MuiTab-root': {
                      minHeight: '48px',
                      padding: '12px 16px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    },
                    '& .Mui-selected': {
                      color: '#1976d2',
                    },
                  }}
                >
                  <Tab
                    icon={<CheckCircleIcon />}
                    iconPosition="start"
                    label="Fortalezas"
                    value={1}
                    title={TOOLTIP_TAB_FORTALEZAS}
                  />
                  <Tab
                    icon={<TrendingUpIcon />}
                    iconPosition="start"
                    label="Oportunidades"
                    value={2}
                    title={TOOLTIP_TAB_OPORTUNIDADES}
                  />
                  <Tab
                    icon={<CancelIcon />}
                    iconPosition="start"
                    label="Debilidades"
                    value={3}
                    title={TOOLTIP_TAB_DEBILIDADES}
                  />
                  <Tab
                    icon={<WarningIcon />}
                    iconPosition="start"
                    label="Amenazas"
                    value={4}
                    title={TOOLTIP_TAB_AMENAZAS}
                  />
                </Tabs>
              </Box>
            </Box>
          </Box>

          {tabValue === 0 && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom fontWeight={700} sx={{ color: '#1976d2', mb: 1 }}>
                  Matriz DOFA Completa
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Haz clic en cualquier cuadrante para ver los detalles. Para añadir o editar texto, usa Contexto interno o Contexto externo; aquí solo puedes eliminar ítems.
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                  gap: 2,
                  mb: 3,
                }}
              >
                {/* Fortalezas */}
                <Paper
                  elevation={4}
                  onClick={() => setTabValue(1)}
                  sx={{
                    p: 0,
                    backgroundColor: '#fff',
                    minHeight: 350,
                    maxHeight: 450,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #00c853 0%, #4caf50 50%, #66bb6a 100%)',
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                        <Typography variant="h5" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          FORTALEZAS
                        </Typography>
                      </Box>
                      <Chip
                        label={fortalezas.length}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 3,
                      pb: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      maxHeight: 320,
                      overflowY: 'auto',
                      pr: 1.5,
                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f5f5f5',
                        borderRadius: '5px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#4caf50',
                        borderRadius: '5px',
                        '&:hover': {
                          background: '#00c853',
                        },
                      },
                    }}
                  >
                    {fortalezas.length > 0 ? (
                      fortalezas.map((item, index) => (
                        <Tooltip
                          key={item.id}
                          title={describeOrigenItemDofaMatriz(item.descripcion, 'FORTALEZA', contextoItems)}
                          placement="top"
                          enterDelay={400}
                          slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Fortalezas');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 2,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#e8f5e9',
                                borderColor: '#4caf50',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: '#4caf50',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                                flex: 1,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        </Box>
                        </Tooltip>
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#fafafa',
                          borderRadius: 2,
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                          No hay fortalezas registradas
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Oportunidades */}
                <Paper
                  elevation={4}
                  onClick={() => setTabValue(2)}
                  sx={{
                    p: 0,
                    backgroundColor: '#fff',
                    minHeight: 350,
                    maxHeight: 450,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #0277bd 0%, #0288d1 50%, #03a9f4 100%)',
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TrendingUpIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                        <Typography variant="h5" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          OPORTUNIDADES
                        </Typography>
                      </Box>
                      <Chip
                        label={oportunidades.length}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 3,
                      pb: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      maxHeight: 320,
                      overflowY: 'auto',
                      pr: 1.5,
                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f5f5f5',
                        borderRadius: '5px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#03a9f4',
                        borderRadius: '5px',
                        '&:hover': {
                          background: '#0288d1',
                        },
                      },
                    }}
                  >
                    {oportunidades.length > 0 ? (
                      oportunidades.map((item, index) => (
                        <Tooltip
                          key={item.id}
                          title={describeOrigenItemDofaMatriz(item.descripcion, 'OPORTUNIDAD', contextoItems)}
                          placement="top"
                          enterDelay={400}
                          slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Oportunidades');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 2,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                                borderColor: '#03a9f4',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: '#03a9f4',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                                flex: 1,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        </Box>
                        </Tooltip>
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#fafafa',
                          borderRadius: 2,
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                          No hay oportunidades registradas
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Debilidades */}
                <Paper
                  elevation={4}
                  onClick={() => setTabValue(3)}
                  sx={{
                    p: 0,
                    backgroundColor: '#fff',
                    minHeight: 350,
                    maxHeight: 450,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)',
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CancelIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                        <Typography variant="h5" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          DEBILIDADES
                        </Typography>
                      </Box>
                      <Chip
                        label={debilidades.length}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 3,
                      pb: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      maxHeight: 320,
                      overflowY: 'auto',
                      pr: 1.5,
                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f5f5f5',
                        borderRadius: '5px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#ff9800',
                        borderRadius: '5px',
                        '&:hover': {
                          background: '#f57c00',
                        },
                      },
                    }}
                  >
                    {debilidades.length > 0 ? (
                      debilidades.map((item, index) => (
                        <Tooltip
                          key={item.id}
                          title={describeOrigenItemDofaMatriz(item.descripcion, 'DEBILIDAD', contextoItems)}
                          placement="top"
                          enterDelay={400}
                          slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Debilidades');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 2,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#fff3e0',
                                borderColor: '#ff9800',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: '#ff9800',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                                flex: 1,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        </Box>
                        </Tooltip>
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#fafafa',
                          borderRadius: 2,
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                          No hay debilidades registradas
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>

                {/* Amenazas */}
                <Paper
                  elevation={4}
                  onClick={() => setTabValue(4)}
                  sx={{
                    p: 0,
                    backgroundColor: '#fff',
                    minHeight: 350,
                    maxHeight: 450,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, #c62828 0%, #d32f2f 50%, #f44336 100%)',
                      color: '#fff',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <WarningIcon sx={{ fontSize: 32, opacity: 0.9 }} />
                        <Typography variant="h5" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          AMENAZAS
                        </Typography>
                      </Box>
                      <Chip
                        label={amenazas.length}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 3,
                      pb: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      maxHeight: 320,
                      overflowY: 'auto',
                      pr: 1.5,
                      '&::-webkit-scrollbar': {
                        width: '10px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f5f5f5',
                        borderRadius: '5px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#f44336',
                        borderRadius: '5px',
                        '&:hover': {
                          background: '#d32f2f',
                        },
                      },
                    }}
                  >
                    {amenazas.length > 0 ? (
                      amenazas.map((item, index) => (
                        <Tooltip
                          key={item.id}
                          title={describeOrigenItemDofaMatriz(item.descripcion, 'AMENAZA', contextoItems)}
                          placement="top"
                          enterDelay={400}
                          slotProps={{ tooltip: { sx: { maxWidth: 420 } } }}
                        >
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Amenazas');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 2,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#ffebee',
                                borderColor: '#f44336',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: '#f44336',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.6,
                                flex: 1,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        </Box>
                        </Tooltip>
                      ))
                    ) : (
                      <Box
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          backgroundColor: '#fafafa',
                          borderRadius: 2,
                          border: '2px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                          No hay amenazas registradas
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
          {tabValue === 1 && renderDofaSection('Fortalezas', fortalezas, 'fortalezas', 'FORTALEZA')}
          {tabValue === 2 && renderDofaSection('Oportunidades', oportunidades, 'oportunidades', 'OPORTUNIDAD')}
          {tabValue === 3 && renderDofaSection('Debilidades', debilidades, 'debilidades', 'DEBILIDAD')}
          {tabValue === 4 && renderDofaSection('Amenazas', amenazas, 'amenazas', 'AMENAZA')}
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 640,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedCategory === 'Fortalezas' && (
              <CheckCircleIcon sx={{ fontSize: 32, color: '#4caf50' }} />
            )}
            {selectedCategory === 'Oportunidades' && (
              <TrendingUpIcon sx={{ fontSize: 32, color: '#03a9f4' }} />
            )}
            {selectedCategory === 'Debilidades' && (
              <CancelIcon sx={{ fontSize: 32, color: '#ff9800' }} />
            )}
            {selectedCategory === 'Amenazas' && (
              <WarningIcon sx={{ fontSize: 32, color: '#f44336' }} />
            )}
            <Typography variant="h6" fontWeight={700}>
              {selectedCategory}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{
              color: '#757575',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box
            sx={{
              p: 3,
              backgroundColor: '#fafafa',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.8,
                color: '#424242',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {selectedItem?.descripcion || 'Sin descripción disponible'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: 1,
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </AppPageLayout>
    </>
  );
}

