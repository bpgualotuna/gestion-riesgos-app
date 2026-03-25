import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Badge,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { PlanAccionCard } from '../../components/plan-accion/PlanAccionCard';
import { ConversionDialog } from '../../components/plan-accion/ConversionDialog';
import { TrazabilidadTimeline } from '../../components/plan-accion/TrazabilidadTimeline';
import { PlanDetalleDialog } from '../../components/plan-accion/PlanDetalleDialog';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { EstadoPlan, ControlFromPlanData } from '../../types/planAccion.types';
import {
  useObtenerPlanesAccionQuery,
  useCambiarEstadoPlanMutation,
  useConvertirPlanAControlMutation,
  PlanAccionAPI,
} from '../../api/services/planTrazabilidadApi';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`planes-tabpanel-${index}`}
      aria-labelledby={`planes-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const PlanesAccionPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [conversionDialogOpen, setConversionDialogOpen] = useState(false);
  const [planToConvert, setPlanToConvert] = useState<PlanAccionAPI | null>(null);
  const [selectedPlanForTimeline, setSelectedPlanForTimeline] = useState<number | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  const [planParaDetalle, setPlanParaDetalle] = useState<PlanAccionAPI | null>(null);

  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado } = useProceso();
  const { esDuenoProcesos } = useAuth();

  // Obtener planes desde el backend, filtrados por proceso si hay uno seleccionado
  const { data, isLoading, error, refetch } = useObtenerPlanesAccionQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id } : undefined
  );
  const [cambiarEstado, { isLoading: cambiandoEstado }] = useCambiarEstadoPlanMutation();
  const [convertirAControl, { isLoading: convirtiendoAControl }] = useConvertirPlanAControlMutation();

  const planes = data?.planes || [];
  const stats = data?.stats || {
    total: 0,
    pendientes: 0,
    enRevision: 0,
    revisados: 0,
  };

  // Filtrar planes por búsqueda
  const planesFiltrados = planes.filter((plan) =>
    plan.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.responsable && plan.responsable.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener planes por estado
  const planesPendientes = planesFiltrados.filter((p) => p.estado === 'pendiente');
  const planesEnRevision = planesFiltrados.filter((p) => p.estado === 'en_revision');
  const planesRevisados = planesFiltrados.filter((p) => p.estado === 'revisado');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEstadoChange = async (planId: number, nuevoEstado: EstadoPlan) => {
    try {
      console.log('🔄 Cambiando estado:', { planId, nuevoEstado });
      
      // Mapear estado del frontend al backend
      const estadoMap: Record<EstadoPlan, string> = {
        'pendiente': 'pendiente',
        'en_revision': 'en_revision',
        'revisado': 'revisado'
      };

      const estadoBackend = estadoMap[nuevoEstado] || 'en_revision';
      console.log('📤 Enviando al backend:', { estadoBackend });

      await cambiarEstado({
        causaId: planId,
        data: { estado: estadoBackend as any }
      }).unwrap();

      console.log('✅ Estado cambiado, haciendo refetch...');
      const result = await refetch();
      
      // Buscar el plan actualizado
      const planActualizado = result.data?.planes.find(p => p.id === planId);
      console.log('📥 Plan después del refetch:', {
        planId,
        estadoRecibido: planActualizado?.estado,
        descripcion: planActualizado?.descripcion
      });

      showSuccess('Estado del plan actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      showError('Error al cambiar el estado del plan');
    }
  };

  const handleConvertirAControl = (planId: number) => {
    const plan = planes.find((p) => p.id === planId);
    if (plan) {
      setPlanToConvert(plan);
      setConversionDialogOpen(true);
    }
  };

  const handleConfirmConversion = async (controlData: ControlFromPlanData) => {
    if (!planToConvert) return;

    try {
      await convertirAControl({
        causaId: planToConvert.causaRiesgoId,
        data: {
          tipoControl: controlData.tipoControl,
          observaciones: controlData.observaciones
        }
      }).unwrap();

      showSuccess('Plan convertido a control exitosamente');
      setPlanToConvert(null);
      refetch();
    } catch (error) {
      console.error('Error al convertir plan:', error);
      showError('Error al convertir el plan a control');
    }
  };

  const handleVerTrazabilidad = (planId: number) => {
    setSelectedPlanForTimeline(planId);
  };

  const handleVerDetalle = (planId: number) => {
    const plan = planes.find((p) => p.id === planId);
    if (plan) {
      setPlanParaDetalle(plan);
      setDetalleDialogOpen(true);
    }
  };

  const renderPlanes = (planesAMostrar: PlanAccionAPI[]) => {
    if (planesAMostrar.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box component="span" sx={{ color: 'text.secondary' }}>
            No hay planes de acción en esta categoría
          </Box>
        </Box>
      );
    }

    return planesAMostrar.map((plan) => (
      <Box key={plan.id}>
        <PlanAccionCard
          plan={{
            ...plan,
            nombre: plan.descripcion,
            fechaProgramada: plan.fechaProgramada || undefined,
            fechaEjecucion: plan.fechaFin || undefined,
          } as any}
          onEstadoChange={handleEstadoChange}
          onConvertirAControl={handleConvertirAControl}
          onVerDetalle={handleVerDetalle}
          showConversionButton={false}
          disableEstadoChange={esDuenoProcesos}
        />
        {selectedPlanForTimeline === plan.id && (
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box component="h6" sx={{ fontSize: '1.25rem', fontWeight: 500, mb: 2 }}>
              Trazabilidad del Plan
            </Box>
            <TrazabilidadTimeline
              planId={plan.id}
              controlId={plan.controlDerivadoId || undefined}
              eventos={[]} // TODO: Obtener eventos reales
            />
          </Paper>
        )}
      </Box>
    ));
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <AppPageLayout
        title="Gestión de Planes de Acción"
        description="Administra y da seguimiento a los planes de acción del sistema"
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </AppPageLayout>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <AppPageLayout
        title="Gestión de Planes de Acción"
        description="Administra y da seguimiento a los planes de acción del sistema"
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar los planes de acción. Por favor, intenta de nuevo.
        </Alert>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout
      title="Gestión de Planes de Acción"
      description="Administra y da seguimiento a los planes de acción del sistema"
      topContent={<FiltroProcesoSupervisor />}
    >
      <Box>
        {/* Barra de búsqueda */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por descripción o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Tabs de filtrado */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={
                <Badge badgeContent={stats.total} color="primary">
                  Todos
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={stats.pendientes} color="warning">
                  Pendientes
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={stats.enRevision} color="primary">
                  Revisados
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={stats.revisados} color="success">
                  Aprobados
                </Badge>
              }
            />
          </Tabs>
        </Paper>

        {/* Contenido de tabs */}
        <TabPanel value={tabValue} index={0}>
          {renderPlanes(planesFiltrados)}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderPlanes(planesPendientes)}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {renderPlanes(planesEnRevision)}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {renderPlanes(planesRevisados)}
        </TabPanel>
      </Box>

      {/* Diálogo de conversión */}
      <ConversionDialog
        open={conversionDialogOpen}
        plan={planToConvert}
        onClose={() => {
          setConversionDialogOpen(false);
          setPlanToConvert(null);
        }}
        onConfirm={handleConfirmConversion}
      />

      {/* Diálogo de detalles */}
      <PlanDetalleDialog
        open={detalleDialogOpen}
        plan={planParaDetalle}
        onClose={() => {
          setDetalleDialogOpen(false);
          setPlanParaDetalle(null);
        }}
      />
    </AppPageLayout>
  );
};


export default PlanesAccionPage;
