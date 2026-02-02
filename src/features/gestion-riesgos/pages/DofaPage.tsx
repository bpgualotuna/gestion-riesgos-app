/**
 * DOFA Page
 * Matriz FODA (Fortalezas, Oportunidades, Debilidades, Amenazas)
 */

import { useState, useMemo } from 'react';
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
} from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useGetProcesosQuery } from '../api/riesgosApi';
import { Alert, Chip } from '@mui/material';

interface DofaItem {
  id: string;
  descripcion: string;
}

export default function DofaPage() {
  const { showSuccess } = useNotification();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { esDirectorProcesos, user } = useAuth();
  const { data: procesos = [] } = useGetProcesosQuery();
  
  // Si es director, obtener todos los procesos que supervisa
  const procesosDirector = procesos.filter((p) => p.directorId === user?.id);
  
  // Director siempre en modo solo lectura
  const isReadOnly = modoProceso === 'visualizar' || esDirectorProcesos;
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DofaItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [itemSeleccionado, setItemSeleccionado] = useState<{ item: DofaItem; tipo: string; titulo: string } | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  
  const [oportunidades, setOportunidades] = useState<DofaItem[]>([
    {
      id: '1',
      descripcion: 'Tendencia del mercado hacia modalidades de trabajo flexibles y remoto...',
    },
    {
      id: '2',
      descripcion: 'Avances tecnológicos y plataformas digitales para gestión de talento...',
    },
  ]);

  const [amenazas, setAmenazas] = useState<DofaItem[]>([
    {
      id: '1',
      descripcion: 'Alta demanda del mercado por perfiles especializados en tecnologías emergentes...',
    },
    {
      id: '2',
      descripcion: 'Rigidez del marco laboral ecuatoriano que limita la flexibilidad...',
    },
  ]);

  const [fortalezas, setFortalezas] = useState<DofaItem[]>([]);
  const [debilidades, setDebilidades] = useState<DofaItem[]>([]);
  const [estrategiasFO, setEstrategiasFO] = useState<DofaItem[]>([]);
  const [estrategiasFA, setEstrategiasFA] = useState<DofaItem[]>([]);
  const [estrategiasDO, setEstrategiasDO] = useState<DofaItem[]>([]);
  const [estrategiasDA, setEstrategiasDA] = useState<DofaItem[]>([]);

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

  const handleSave = () => {
    const dofaData = {
      oportunidades,
      amenazas,
      fortalezas,
      debilidades,
      estrategiasFO,
      estrategiasFA,
      estrategiasDO,
      estrategiasDA,
    };
    localStorage.setItem('dofa', JSON.stringify(dofaData));
    showSuccess('Matriz DOFA guardada exitosamente');
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

  // Obtener áreas únicas de los procesos del director
  const areasDirector = useMemo(() => {
    const areasUnicas = new Set<string>();
    procesosDirector.forEach(p => {
      if (p.areaId) areasUnicas.add(p.areaId);
    });
    return Array.from(areasUnicas);
  }, [procesosDirector]);

  // Estados para filtros (solo para director)
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');

  // Procesos filtrados por área
  const procesosFiltradosPorArea = useMemo(() => {
    if (filtroArea === 'all') return procesosDirector;
    return procesosDirector.filter(p => p.areaId === filtroArea);
  }, [procesosDirector, filtroArea]);

  // Si es director, mostrar selector con filtros
  if (esDirectorProcesos && procesosDirector.length > 0 && !procesoSeleccionado) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Matriz DOFA
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleccione un proceso para ver su matriz DOFA. Usted supervisa {procesosDirector.length} proceso(s).
        </Alert>
        
        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={filtroArea}
                  onChange={(e) => {
                    setFiltroArea(e.target.value);
                    setFiltroProceso('all'); // Reset proceso cuando cambia área
                  }}
                  label="Filtrar por Área"
                >
                  <MenuItem value="all">Todas las áreas</MenuItem>
                  {areasDirector.map(areaId => {
                    const proceso = procesosDirector.find(p => p.areaId === areaId);
                    return (
                      <MenuItem key={areaId} value={areaId}>
                        {proceso?.areaNombre || `Área ${areaId}`}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>Filtrar por Proceso</InputLabel>
                <Select
                  value={filtroProceso}
                  onChange={(e) => setFiltroProceso(e.target.value)}
                  label="Filtrar por Proceso"
                  disabled={filtroArea === 'all' && procesosFiltradosPorArea.length === 0}
                >
                  <MenuItem value="all">Todos los procesos</MenuItem>
                  {procesosFiltradosPorArea.map((proceso) => (
                    <MenuItem key={proceso.id} value={proceso.id}>
                      {proceso.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        {/* Lista de Procesos */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Procesos que Supervisa {filtroArea !== 'all' && `(${procesosFiltradosPorArea.length})`}
            </Typography>
            <List>
              {procesosFiltradosPorArea.map((proceso) => (
                <ListItem
                  key={proceso.id}
                  selected={filtroProceso === proceso.id}
                  onClick={() => {
                    setProcesoSeleccionado(proceso);
                    iniciarModoVisualizar();
                  }}
                >
                  <ListItemText
                    primary={proceso.nombre}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {proceso.areaNombre || 'Sin área asignada'}
                        </Typography>
                        {proceso.responsableNombre && (
                          <Typography variant="caption" color="text.secondary">
                            Responsable: {proceso.responsableNombre}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  // Si es director y tiene proceso seleccionado, verificar que sea uno de sus procesos
  if (esDirectorProcesos && procesoSeleccionado && !procesosDirector.find(p => p.id === procesoSeleccionado.id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Este proceso no está asignado a su supervisión. Por favor seleccione uno de sus procesos.
        </Alert>
      </Box>
    );
  }

  // Otros usuarios necesitan seleccionar proceso
  if (!esDirectorProcesos && !procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  const renderDofaSection = (
    title: string,
    items: DofaItem[],
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades' | 'estrategiasFO' | 'estrategiasFA' | 'estrategiasDO' | 'estrategiasDA'
  ) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
          <TextField
            key={item.id}
            fullWidth
            label={`${title} ${index + 1}`}
            value={item.descripcion}
            onChange={(e) => handleChange(tipo, item.id, e.target.value)}
            disabled={isReadOnly}
            multiline
            rows={3}
            variant="outlined"
          />
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas
          </Typography>
        </Box>
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
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            background: '#1976d2',
            color: '#fff',
          }}
        >
          Guardar DOFA
        </Button>
          )}
      </Box>
      </Box>
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
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ mb: 2 }}>
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
                      textTransform: 'none',
                      fontWeight: tabValue === 0 ? 600 : 400,
                    },
                    '& .Mui-selected': {
                      color: '#1976d2',
                    },
                  }}
                >
                  <Tab label="Matriz DOFA" />
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
                      textTransform: 'none',
                    },
                    '& .Mui-selected': {
                      color: '#1976d2',
                    },
                  }}
                >
                  <Tab label="Oportunidades" value={1} />
                  <Tab label="Amenazas" value={2} />
                  <Tab label="Fortalezas" value={3} />
                  <Tab label="Debilidades" value={4} />
                  <Tab label="Estrategias FO" value={5} />
                  <Tab label="Estrategias FA" value={6} />
                  <Tab label="Estrategias DO" value={7} />
                  <Tab label="Estrategias DA" value={8} />
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
    </Box>
  );
}
