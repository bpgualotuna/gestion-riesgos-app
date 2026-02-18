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
  TextField,
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
} from '@mui/material';
import {
  Add as AddIcon,
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
import { useGetProcesosQuery, useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import { useAreasProcesosAsignados, esUsuarioResponsableProceso } from '../../hooks/useAsignaciones';
import { Alert, Chip } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';



interface DofaItem {
  id: string;
  descripcion: string;
}

const mapBackendToFrontend: Record<string, string> = {
  'FORTALEZA': 'fortalezas',
  'OPORTUNIDAD': 'oportunidades',
  'DEBILIDAD': 'debilidades',
  'AMENAZA': 'amenazas',
  'FO': 'estrategiasFO',
  'FA': 'estrategiasFA',
  'DO': 'estrategiasDO',
  'DA': 'estrategiasDA'
};

const mapFrontendToBackend: Record<string, string> = {
  'fortalezas': 'FORTALEZA',
  'oportunidades': 'OPORTUNIDAD',
  'debilidades': 'DEBILIDAD',
  'amenazas': 'AMENAZA',
  'estrategiasFO': 'FO',
  'estrategiasFA': 'FA',
  'estrategiasDO': 'DO',
  'estrategiasDA': 'DA'
};

export default function DofaPage() {
  const { showSuccess } = useNotification();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos, user } = useAuth();
  const { data: procesos = [] } = useGetProcesosQuery();
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();

  const procesosVisibles = useMemo(() => {
    if (esGerenteGeneralDirector) return procesos;
    
    // Gerente General Proceso - funciona IGUAL que Dueño de Proceso
    // Ve solo sus procesos como responsable (igual que dueño de proceso)
    if (esGerenteGeneralProceso && user) {
      return procesos.filter((p: any) => esUsuarioResponsableProceso(p, user.id));
    }
    
    // Dueño de Proceso - ve solo sus procesos como responsable
    if (esDueñoProcesos && user) {
      return procesos.filter((p: any) => esUsuarioResponsableProceso(p, user.id));
    }
    
    if (esSupervisorRiesgos && user) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => {
        if (procesosAsignados.includes(p.id)) return true;
        if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
        return false;
      });
    }
    return procesos;
  }, [procesos, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos, areasAsignadas, procesosAsignados, user]);

  // Supervisor/gerente director/gerente proceso siempre en modo solo lectura
  const isReadOnly = modoProceso === 'visualizar' || esSupervisorRiesgos || esGerenteGeneralDirector || esGerenteGeneralProceso;

  // Dueño de Proceso: si no tiene proceso seleccionado en el header, mostrar solo mensaje
  if (esDueñoProcesos && !procesoSeleccionado?.id) {
    return (
      <AppPageLayout
        title="Matriz DOFA"
        description="Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info">Por favor selecciona un proceso en el encabezado para ver su matriz DOFA.</Alert>
        </Box>
      </AppPageLayout>
    );
  }
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DofaItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [itemSeleccionado, setItemSeleccionado] = useState<{ item: DofaItem; tipo: string; titulo: string } | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);

  // Fetch process details directly
  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  useEffect(() => {
    if (procesoData && procesoData.dofaItems) {
      setFortalezas(procesoData.dofaItems.filter((i: any) => i.tipo === 'FORTALEZA').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setOportunidades(procesoData.dofaItems.filter((i: any) => i.tipo === 'OPORTUNIDAD').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setDebilidades(procesoData.dofaItems.filter((i: any) => i.tipo === 'DEBILIDAD').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setAmenazas(procesoData.dofaItems.filter((i: any) => i.tipo === 'AMENAZA').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setEstrategiasFO(procesoData.dofaItems.filter((i: any) => i.tipo === 'FO').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setEstrategiasFA(procesoData.dofaItems.filter((i: any) => i.tipo === 'FA').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setEstrategiasDO(procesoData.dofaItems.filter((i: any) => i.tipo === 'DO').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
      setEstrategiasDA(procesoData.dofaItems.filter((i: any) => i.tipo === 'DA').map((i: any) => ({ id: i.id || `temp-${Date.now()}-${Math.random()}`, descripcion: i.descripcion })));
    }
  }, [procesoData]);

  // Loading and Error states could be handled here

  const [oportunidades, setOportunidades] = useState<DofaItem[]>([]);
  const [amenazas, setAmenazas] = useState<DofaItem[]>([]);
  const [fortalezas, setFortalezas] = useState<DofaItem[]>([]);
  const [debilidades, setDebilidades] = useState<DofaItem[]>([]);
  const [estrategiasFO, setEstrategiasFO] = useState<DofaItem[]>([]);
  const [estrategiasFA, setEstrategiasFA] = useState<DofaItem[]>([]);
  const [estrategiasDO, setEstrategiasDO] = useState<DofaItem[]>([]);
  const [estrategiasDA, setEstrategiasDA] = useState<DofaItem[]>([]);

  // Estado para confirmar eliminación (MOVED TO TOP)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ tipo: string; id: string } | null>(null);

  const handleAdd = (tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades' | 'estrategiasFO' | 'estrategiasFA' | 'estrategiasDO' | 'estrategiasDA') => {
    const newItem: DofaItem = {
      id: Date.now().toString(),
      descripcion: '',
    };

    switch (tipo) {
      case 'oportunidades':
        setOportunidades([...oportunidades, newItem]);
        break;
      case 'amenazas':
        setAmenazas([...amenazas, newItem]);
        break;
      case 'fortalezas':
        setFortalezas([...fortalezas, newItem]);
        break;
      case 'debilidades':
        setDebilidades([...debilidades, newItem]);
        break;
      case 'estrategiasFO':
        setEstrategiasFO([...estrategiasFO, newItem]);
        break;
      case 'estrategiasFA':
        setEstrategiasFA([...estrategiasFA, newItem]);
        break;
      case 'estrategiasDO':
        setEstrategiasDO([...estrategiasDO, newItem]);
        break;
      case 'estrategiasDA':
        setEstrategiasDA([...estrategiasDA, newItem]);
        break;
    }
  };

  const handleChange = (
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades' | 'estrategiasFO' | 'estrategiasFA' | 'estrategiasDO' | 'estrategiasDA',
    id: string,
    value: string
  ) => {
    const updateItem = (items: DofaItem[]) =>
      items.map((item) => (item.id === id ? { ...item, descripcion: value } : item));

    switch (tipo) {
      case 'oportunidades':
        setOportunidades(updateItem(oportunidades));
        break;
      case 'amenazas':
        setAmenazas(updateItem(amenazas));
        break;
      case 'fortalezas':
        setFortalezas(updateItem(fortalezas));
        break;
      case 'debilidades':
        setDebilidades(updateItem(debilidades));
        break;
      case 'estrategiasFO':
        setEstrategiasFO(updateItem(estrategiasFO));
        break;
      case 'estrategiasFA':
        setEstrategiasFA(updateItem(estrategiasFA));
        break;
      case 'estrategiasDO':
        setEstrategiasDO(updateItem(estrategiasDO));
        break;
      case 'estrategiasDA':
        setEstrategiasDA(updateItem(estrategiasDA));
        break;
    }
  };

  const handleDelete = (
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades' | 'estrategiasFO' | 'estrategiasFA' | 'estrategiasDO' | 'estrategiasDA',
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
      case 'estrategiasFO':
        setEstrategiasFO(filterItems(estrategiasFO));
        break;
      case 'estrategiasFA':
        setEstrategiasFA(filterItems(estrategiasFA));
        break;
      case 'estrategiasDO':
        setEstrategiasDO(filterItems(estrategiasDO));
        break;
      case 'estrategiasDA':
        setEstrategiasDA(filterItems(estrategiasDA));
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
      ...estrategiasFO.map(i => ({ descripcion: i.descripcion, tipo: 'FO' })),
      ...estrategiasFA.map(i => ({ descripcion: i.descripcion, tipo: 'FA' })),
      ...estrategiasDO.map(i => ({ descripcion: i.descripcion, tipo: 'DO' })),
      ...estrategiasDA.map(i => ({ descripcion: i.descripcion, tipo: 'DA' })),
    ];

    try {
      await updateProceso({
        id: procesoSeleccionado.id,
        dofaItems: allItems
      }).unwrap();
      showSuccess('Matriz DOFA guardada exitosamente');
    } catch (error) {
      console.error(error);
      // showError('Error al guardar'); // Assuming showError exists or use showSuccess with error msg? 
      // check useNotification hooks. showSuccess available.
    }
  };

  const handleVerDetalle = (
    e: React.MouseEvent,
    item: DofaItem,
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades'
  ) => {
    e.stopPropagation(); // Prevenir que se active el cambio de pestaña
    const titulos: Record<string, string> = {
      oportunidades: 'Oportunidad',
      amenazas: 'Amenaza',
      fortalezas: 'Fortaleza',
      debilidades: 'Debilidad',
    };
    setItemSeleccionado({ item, tipo, titulo: titulos[tipo] });
    setDetalleDialogOpen(true);
  };

  const handleCerrarDetalle = () => {
    setDetalleDialogOpen(false);
    setItemSeleccionado(null);
  };

  // Obtener áreas únicas de los procesos visibles
  const areasVisibles = useMemo(() => {
    const areasUnicas = new Map<string, string>();
    procesosVisibles.forEach((p: any) => {
      if (p.areaId) areasUnicas.set(p.areaId, p.areaNombre || `Área ${p.areaId}`);
    });
    return Array.from(areasUnicas.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [procesosVisibles]);

  // Estados para filtros (solo para director)
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');

  // Procesos filtrados por área
  const procesosFiltradosPorArea = useMemo(() => {
    if (filtroArea === 'all') return procesosVisibles;
    return procesosVisibles.filter((p: any) => p.areaId === filtroArea);
  }, [procesosVisibles, filtroArea]);

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
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Matriz DOFA
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleccione un proceso para ver su matriz DOFA. Usted supervisa {procesosVisibles.length} proceso(s).
        </Alert>
      </Box>
    );
  }

  // Si es supervisor/gerente director y tiene proceso seleccionado, verificar que sea uno de sus procesos
  if ((esSupervisorRiesgos || esGerenteGeneralDirector) && procesoSeleccionado && !procesosVisibles.find((p) => p.id === procesoSeleccionado.id)) {
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
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades' | 'estrategiasFO' | 'estrategiasFA' | 'estrategiasDO' | 'estrategiasDA'
  ) => (
    <Box>
      <FiltroProcesoSupervisor />
      <Box sx={{ mt: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {!isReadOnly && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleAdd(tipo)}
            sx={{
              background: '#1976d2',
              color: '#fff',
            }}
          >
            Agregar
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, index) => (
          <Box key={item.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              fullWidth
              label={`${title} ${index + 1}`}
              value={item.descripcion}
              onChange={(e) => handleChange(tipo, item.id, e.target.value)}
              disabled={isReadOnly}
              multiline
              rows={3}
              variant="outlined"
            />
            {!isReadOnly && (
              <IconButton
                color="error"
                onClick={() => requestDelete(tipo, item.id)}
                title="Eliminar"
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hay elementos registrados. Haz clic en "Agregar" para comenzar.
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
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
                  <Tab icon={<FactCheckIcon />} iconPosition="start" label="MATRIZ DOFA" />
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
                  <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Oportunidades" value={1} />
                  <Tab icon={<WarningIcon />} iconPosition="start" label="Amenazas" value={2} />
                  <Tab icon={<CheckCircleIcon />} iconPosition="start" label="Fortalezas" value={3} />
                  <Tab icon={<CancelIcon />} iconPosition="start" label="Debilidades" value={4} />
                  <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Estrategias FO" value={5} />
                  <Tab icon={<WarningIcon />} iconPosition="start" label="Estrategias FA" value={6} />
                  <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Estrategias DO" value={7} />
                  <Tab icon={<WarningIcon />} iconPosition="start" label="Estrategias DA" value={8} />
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
                  Haz clic en cualquier cuadrante para ver o editar los detalles. Cada sección tiene scroll independiente.
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
                        <Box
                          key={item.id}
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
                        <Box
                          key={item.id}
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
                        <Box
                          key={item.id}
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
                        <Box
                          key={item.id}
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

              {/* Sección de Estrategias */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={700} sx={{ color: '#1976d2', mb: 2 }}>
                  Estrategias DOFA
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 2,
                  }}
                >
                  {/* Estrategias FO */}
                  <Paper
                    elevation={4}
                    onClick={() => setTabValue(5)}
                    sx={{
                      p: 0,
                      backgroundColor: '#fff',
                      minHeight: 300,
                      maxHeight: 400,
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
                        background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #ce93d8 100%)',
                        color: '#fff',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                          <Typography variant="h6" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            ESTRATEGIAS FO
                          </Typography>
                        </Box>
                        <Chip
                          label={estrategiasFO.length}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            height: 28,
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
                        gap: 1.5,
                        maxHeight: 250,
                        overflowY: 'auto',
                        pr: 1.5,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f5f5f5',
                          borderRadius: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#9c27b0',
                          borderRadius: '5px',
                          '&:hover': {
                            background: '#7b1fa2',
                          },
                        },
                      }}
                    >
                      {estrategiasFO.length > 0 ? (
                        estrategiasFO.map((item, index) => (
                          <Box
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Estrategias FO');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 1.5,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1.5,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#f3e5f5',
                                borderColor: '#9c27b0',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.5,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <strong>{index + 1}.</strong> {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: 2,
                            border: '2px dashed #e0e0e0',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                            No hay estrategias FO registradas
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Estrategias FA */}
                  <Paper
                    elevation={4}
                    onClick={() => setTabValue(6)}
                    sx={{
                      p: 0,
                      backgroundColor: '#fff',
                      minHeight: 300,
                      maxHeight: 400,
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
                        background: 'linear-gradient(135deg, #673ab7 0%, #9575cd 50%, #b39ddb 100%)',
                        color: '#fff',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <WarningIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                          <Typography variant="h6" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            ESTRATEGIAS FA
                          </Typography>
                        </Box>
                        <Chip
                          label={estrategiasFA.length}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            height: 28,
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
                        gap: 1.5,
                        maxHeight: 250,
                        overflowY: 'auto',
                        pr: 1.5,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f5f5f5',
                          borderRadius: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#673ab7',
                          borderRadius: '5px',
                          '&:hover': {
                            background: '#512da8',
                          },
                        },
                      }}
                    >
                      {estrategiasFA.length > 0 ? (
                        estrategiasFA.map((item, index) => (
                          <Box
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Estrategias FA');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 1.5,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1.5,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#ede7f6',
                                borderColor: '#673ab7',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.5,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <strong>{index + 1}.</strong> {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: 2,
                            border: '2px dashed #e0e0e0',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                            No hay estrategias FA registradas
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Estrategias DO */}
                  <Paper
                    elevation={4}
                    onClick={() => setTabValue(7)}
                    sx={{
                      p: 0,
                      backgroundColor: '#fff',
                      minHeight: 300,
                      maxHeight: 400,
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
                        background: 'linear-gradient(135deg, #e91e63 0%, #f06292 50%, #f48fb1 100%)',
                        color: '#fff',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <TrendingUpIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                          <Typography variant="h6" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            ESTRATEGIAS DO
                          </Typography>
                        </Box>
                        <Chip
                          label={estrategiasDO.length}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            height: 28,
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
                        gap: 1.5,
                        maxHeight: 250,
                        overflowY: 'auto',
                        pr: 1.5,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f5f5f5',
                          borderRadius: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#e91e63',
                          borderRadius: '5px',
                          '&:hover': {
                            background: '#c2185b',
                          },
                        },
                      }}
                    >
                      {estrategiasDO.length > 0 ? (
                        estrategiasDO.map((item, index) => (
                          <Box
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Estrategias DO');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 1.5,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1.5,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#fce4ec',
                                borderColor: '#e91e63',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.5,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <strong>{index + 1}.</strong> {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: 2,
                            border: '2px dashed #e0e0e0',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                            No hay estrategias DO registradas
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Estrategias DA */}
                  <Paper
                    elevation={4}
                    onClick={() => setTabValue(8)}
                    sx={{
                      p: 0,
                      backgroundColor: '#fff',
                      minHeight: 300,
                      maxHeight: 400,
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
                        background: 'linear-gradient(135deg, #d32f2f 0%, #e57373 50%, #ef9a9a 100%)',
                        color: '#fff',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CancelIcon sx={{ fontSize: 28, opacity: 0.9 }} />
                          <Typography variant="h6" fontWeight={800} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            ESTRATEGIAS DA
                          </Typography>
                        </Box>
                        <Chip
                          label={estrategiasDA.length}
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            height: 28,
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
                        gap: 1.5,
                        maxHeight: 250,
                        overflowY: 'auto',
                        pr: 1.5,
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f5f5f5',
                          borderRadius: '5px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#d32f2f',
                          borderRadius: '5px',
                          '&:hover': {
                            background: '#c62828',
                          },
                        },
                      }}
                    >
                      {estrategiasDA.length > 0 ? (
                        estrategiasDA.map((item, index) => (
                          <Box
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                              setSelectedCategory('Estrategias DA');
                              setDialogOpen(true);
                            }}
                            sx={{
                              p: 1.5,
                              backgroundColor: '#f5f5f5',
                              borderRadius: 1.5,
                              border: '2px solid #e0e0e0',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#ffebee',
                                borderColor: '#d32f2f',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                lineHeight: 1.5,
                                color: '#424242',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <strong>{index + 1}.</strong> {item.descripcion || 'Sin descripción'}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            backgroundColor: '#fafafa',
                            borderRadius: 2,
                            border: '2px dashed #e0e0e0',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#757575' }}>
                            No hay estrategias DA registradas
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Box>
          )}
          {tabValue === 1 && renderDofaSection('Oportunidades', oportunidades, 'oportunidades')}
          {tabValue === 2 && renderDofaSection('Amenazas', amenazas, 'amenazas')}
          {tabValue === 3 && renderDofaSection('Fortalezas', fortalezas, 'fortalezas')}
          {tabValue === 4 && renderDofaSection('Debilidades', debilidades, 'debilidades')}
          {tabValue === 5 && renderDofaSection('Estrategias FO', estrategiasFO, 'estrategiasFO')}
          {tabValue === 6 && renderDofaSection('Estrategias FA', estrategiasFA, 'estrategiasFA')}
          {tabValue === 7 && renderDofaSection('Estrategias DO', estrategiasDO, 'estrategiasDO')}
          {tabValue === 8 && renderDofaSection('Estrategias DA', estrategiasDA, 'estrategiasDA')}
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
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
  );
}

