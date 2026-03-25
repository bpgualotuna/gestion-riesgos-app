/**
 * Ficha Page - Modern Design
 * Configuración inicial del proceso según análisis Excel
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  Chip,
  Container,
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
  Dialog,
  DialogTitle,
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon, Edit as EditIcon, Visibility as VisibilityIcon, ExpandMore as ExpandMoreIcon, Add as AddIcon, People as PeopleIcon, Event as EventIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProcesoMutation, useGetGerenciasQuery, useGetAsistentesProcesoQuery, useAsignarAsistentesProcesoMutation, useGetReunionesQuery, useCrearReunionMutation, useActualizarReunionMutation, useEliminarReunionMutation, useGetAsistenciasQuery, useActualizarAsistenciasMutation, useGetUsuariosQuery } from '../../api/services/riesgosApi';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../../utils/constants';
import { useEffect } from 'react';
import { useProcesosFiltradosPorArea } from '../../hooks/useAsignaciones';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';interface FichaData {
  vicepresidencia: string;
  gerencia: string;
  sigla: string; // Sigla del proceso para identificar riesgos (ej: "PF" para Planificación Financiera)
  area: string;
  responsable: string;
  encargado: string; // Quién está a cargo del proceso
  fechaCreacion: string;
  objetivoProceso: string;
}

interface Asistente {
  id: number;
  nombre: string;
  email: string;
  rol: 'dueño_procesos' | 'supervisor_riesgos';
}

interface Reunion {
  id: number;
  procesoId: number;
  fecha: string;
  descripcion: string;
  estado: 'programada' | 'realizada' | 'cancelada';
  createdAt: string;
  updatedAt: string;
}

interface AsistenciaReunion {
  id: number;
  reunionId: number;
  usuarioId: number;
  asistio: boolean;
  observaciones?: string;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export default function FichaPage() {
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirm();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, iniciarModoVisualizar, isLoading: isLoadingProceso } = useProceso();
  const { user, esAdmin, esDueñoProcesos, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso } = useAuth();
  const [updateProceso] = useUpdateProcesoMutation();
  const { setScreenContext } = useCoraIAContext();
  
  const {
    procesosVisibles: procesosDisponibles,
    areasDisponibles,
    procesosFiltrados,
    procesosFiltradosUnicos,
    filtroArea,
    setFiltroArea,
  } = useProcesosFiltradosPorArea('all');
  const { data: gerencias = [] } = useGetGerenciasQuery();
  const { procesoId } = useParams<{ procesoId?: string }>();

  // Obtener proceso del parámetro de ruta o del contexto
  const procesoActual = procesoId
    ? procesosDisponibles.find((p: any) => String(p.id) === String(procesoId))
    : procesoSeleccionado;
  
  // Hooks de API para reuniones y asistentes
  const { data: asistentesData = [], refetch: refetchAsistentes, error: errorAsistentes, isLoading: loadingAsistentes } = useGetAsistentesProcesoQuery(
    procesoActual?.id ? String(procesoActual.id) : '',
    { skip: !procesoActual?.id }
  );
  const [asignarAsistentes] = useAsignarAsistentesProcesoMutation();
  const { data: reunionesData = [], refetch: refetchReuniones, error: errorReuniones, isLoading: loadingReuniones } = useGetReunionesQuery(
    procesoActual?.id ? String(procesoActual.id) : '',
    { skip: !procesoActual?.id }
  );
  const [crearReunionMutation] = useCrearReunionMutation();
  const [actualizarReunionMutation] = useActualizarReunionMutation();
  const [eliminarReunionMutation] = useEliminarReunionMutation();
  const [actualizarAsistenciasMutation] = useActualizarAsistenciasMutation();
  const { data: todosUsuarios = [], isLoading: loadingUsuarios } = useGetUsuariosQuery();
  
  // Log para depuración de usuarios
  useEffect(() => {
    console.log('[FichaPage/Usuarios] Cargando:', loadingUsuarios);
    console.log('[FichaPage/Usuarios] Total usuarios:', todosUsuarios?.length);
    console.log('[FichaPage/Usuarios] Datos:', todosUsuarios);
  }, [todosUsuarios, loadingUsuarios]);
  
  // Log de errores y datos de API para diagnóstico
  useEffect(() => {
    if (procesoActual?.id) {
      console.log('[FichaPage] Proceso actual ID:', procesoActual.id);
      console.log('[FichaPage] Loading asistentes:', loadingAsistentes);
      console.log('[FichaPage] Loading reuniones:', loadingReuniones);
      
      if (errorAsistentes) {
        console.error('[FichaPage/Asistentes] Error:', errorAsistentes);
      } else if (!loadingAsistentes) {
        console.log('[FichaPage/Asistentes] Datos cargados:', asistentesData);
      }
      
      if (errorReuniones) {
        console.error('[FichaPage/Reuniones] Error:', errorReuniones);
      } else if (!loadingReuniones) {
        console.log('[FichaPage/Reuniones] Datos cargados:', reunionesData);
      }
    }
  }, [procesoActual?.id, errorAsistentes, errorReuniones, loadingAsistentes, loadingReuniones, asistentesData, reunionesData]);

  // Memoizar gerencia map para evitar recalcular constantemente
  const gerenciaMap = useMemo(() => {
    return new Map(gerencias.map(g => [g.id, g.nombre]));
  }, [gerencias]);

  // Helper function para obtener el nombre de gerencia desde ID o nombre
  const getGerenciaNombre = useCallback((gerenciaValue: string | number | null | undefined): string => {
    if (!gerenciaValue) return '';
    
    // Si es un número, buscar en la lista de gerencias
    if (typeof gerenciaValue === 'number' || !isNaN(Number(gerenciaValue))) {
      const numValue = Number(gerenciaValue);
      const gerenciaNombre = gerenciaMap.get(numValue);
      return gerenciaNombre || String(gerenciaValue);
    }
    
    // Si es un string, devolverlo directamente
    return String(gerenciaValue);
  }, [gerenciaMap]);

  // Skeleton mientras carga el proceso
  if (isLoadingProceso) {
    return (
      <AppPageLayout
        title="Ficha del Proceso"
        description="Formulario de diligenciamiento obligatorio con información básica del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  // Dueño de Proceso: si no tiene proceso seleccionado (ni por URL ni por header), mostrar solo mensaje
  if (esDueñoProcesos && !procesoActual?.id) {
    return (
      <AppPageLayout
        title="Ficha del Proceso"
        description="Formulario de diligenciamiento obligatorio con información básica del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined">
            No hay un proceso seleccionado. Por favor selecciona un proceso de la lista en la parte superior para ver su ficha.
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }

  const [filtroProceso, setFiltroProceso] = useState<string>('all');

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

  // NO mostrar filtros para Dueño de Proceso ni Gerente General (Proceso)
  // Solo mostrar para Supervisor y Gerente General Director
  const mostrarFiltrosProceso =
    (esSupervisorRiesgos || esGerenteGeneralDirector) &&
    !esGerenteGeneralProceso &&
    user?.role !== 'dueño_procesos';

  // La ficha es del proceso, solo depende del modo del proceso
  const isReadOnly = modoProceso === 'visualizar';
  const isEditMode = modoProceso === 'editar';

  // Solo admin puede editar información organizacional
  const puedeEditarInfoOrganizacional = esAdmin && isEditMode;
  const puedeEditarFechaCreacion = esAdmin && isEditMode;

  // Cargar datos del proceso seleccionado
  const [formData, setFormData] = useState<FichaData>(() => {
    if (procesoActual) {
      return {
        vicepresidencia: procesoActual.vicepresidencia || '',
        gerencia: (procesoActual as any).gerenciaNombre || (procesoActual as any).gerencia?.nombre || '',
        sigla: (procesoActual as any).sigla || '',
        area: procesoActual.areaNombre || (procesoActual as any).area?.nombre || '',
        responsable: (procesoActual as any).responsable?.nombre || '',
        encargado: (procesoActual as any).responsable?.nombre || '',
        fechaCreacion: procesoActual.createdAt ? new Date(procesoActual.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // En backend el campo se llama "objetivo"
        objetivoProceso: (procesoActual as any).objetivo || '',
      };
    }
    return {
      vicepresidencia: '',
      gerencia: '',
      sigla: '',
      area: '',
      responsable: '',
      encargado: '',
      fechaCreacion: new Date().toISOString().split('T')[0],
      objetivoProceso: '',
    };
  });

  // Estado inicial para detectar cambios
  const [initialFormData, setInitialFormData] = useState<FichaData>(formData);

  // Detectar cambios en el formulario
  const hasFormChanges = useFormChanges(initialFormData, formData, {
    ignoreFields: ['area', 'responsable'], // Campos de solo lectura
    deepCompare: false,
  });

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasFormChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en la ficha del proceso.',
    disabled: isReadOnly,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Estados para Asistentes y Reuniones
  const [dialogReunionOpen, setDialogReunionOpen] = useState(false);
  const [dialogAsistenciaOpen, setDialogAsistenciaOpen] = useState(false);
  const [dialogAsistentesExternosOpen, setDialogAsistentesExternosOpen] = useState(false);
  const [reunionEnEdicion, setReunionEnEdicion] = useState<Reunion | null>(null);
  const [reunionParaAsistencia, setReunionParaAsistencia] = useState<Reunion | null>(null);
  const [asistencias, setAsistencias] = useState<AsistenciaReunion[]>([]);
  const [formReunion, setFormReunion] = useState({
    fecha: '',
    descripcion: '',
    estado: 'programada' as 'programada' | 'realizada' | 'cancelada'
  });
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // Usar directamente los datos del backend sin estados intermedios
  const asistentesSeleccionados = useMemo(() => {
    return (asistentesData || []).map((a: any) => a.id);
  }, [asistentesData]);

  const reuniones = useMemo(() => {
    return reunionesData || [];
  }, [reunionesData]);

  // Obtener usuarios asignados al proceso (Dueños y Supervisores)
  const usuariosDisponibles: Asistente[] = useMemo(() => {
    if (!procesoActual) return [];
    
    const usuarios: Asistente[] = [];
    
    // Agregar responsables del proceso (pueden ser dueños o supervisores)
    if ((procesoActual as any).responsablesList) {
      (procesoActual as any).responsablesList.forEach((resp: any) => {
        if (resp.role === 'dueño_procesos' || resp.role === 'supervisor_riesgos') {
          usuarios.push({
            id: resp.id,
            nombre: resp.nombre,
            email: resp.email,
            rol: resp.role
          });
        }
      });
    }
    
    return usuarios;
  }, [procesoActual]);

  // Filtrar usuarios externos (que no están en el proceso pero están seleccionados como asistentes)
  const usuariosExternosSeleccionados = useMemo(() => {
    const idsUsuariosDelProceso = usuariosDisponibles.map(u => u.id);
    return asistentesSeleccionados.filter(id => !idsUsuariosDelProceso.includes(id));
  }, [asistentesSeleccionados, usuariosDisponibles]);

  // Obtener información completa de usuarios externos
  const usuariosExternosInfo = useMemo(() => {
    return usuariosExternosSeleccionados.map(id => {
      const usuario = todosUsuarios.find((u: any) => u.id === id);
      return usuario ? {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.role
      } : null;
    }).filter(Boolean);
  }, [usuariosExternosSeleccionados, todosUsuarios]);

  // Filtrar usuarios para el diálogo de asistentes externos
  const usuariosFiltrados = useMemo(() => {
    console.log('[FichaPage] Filtrando usuarios. Total:', todosUsuarios?.length);
    console.log('[FichaPage] Búsqueda:', busquedaUsuario);
    
    if (!todosUsuarios || !Array.isArray(todosUsuarios)) {
      console.log('[FichaPage] todosUsuarios no es un array válido');
      return [];
    }
    
    if (!busquedaUsuario.trim()) {
      console.log('[FichaPage] Sin búsqueda, retornando todos');
      return todosUsuarios;
    }
    
    const busqueda = busquedaUsuario.toLowerCase();
    const filtrados = todosUsuarios.filter((u: any) => {
      const nombreMatch = u.nombre?.toLowerCase().includes(busqueda);
      const emailMatch = u.email?.toLowerCase().includes(busqueda);
      return nombreMatch || emailMatch;
    });
    
    console.log('[FichaPage] Usuarios filtrados:', filtrados.length);
    return filtrados;
  }, [todosUsuarios, busquedaUsuario]);

  // Actualizar formData cuando cambie el proceso seleccionado
  useEffect(() => {
    if (procesoActual) {
      const newData = {
        vicepresidencia: procesoActual.vicepresidencia || '',
        gerencia: (procesoActual as any).gerenciaNombre || (procesoActual as any).gerencia?.nombre || '',
        sigla: (procesoActual as any).sigla || '',
        area: procesoActual.areaNombre || (procesoActual as any).area?.nombre || '',
        responsable: (procesoActual as any).responsable?.nombre || '',
        encargado: (procesoActual as any).responsable?.nombre || '',
        fechaCreacion: procesoActual.createdAt ? new Date(procesoActual.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        // En backend el campo se llama "objetivo"
        objetivoProceso: (procesoActual as any).objetivo || '',
      };
      
      setFormData(newData);
      setInitialFormData(newData);
    }
  }, [procesoActual, gerencias]);

  // NUEVO: useEffect para capturar contexto de pantalla para CORA IA
  useEffect(() => {
    if (procesoActual && setScreenContext) {
      const context: ScreenContext = {
        module: 'procesos',
        screen: 'ficha',
        action: isReadOnly ? 'view' : 'edit',
        processId: procesoActual.id,
        route: window.location.pathname,
        formData: {
          procesoNombre: procesoActual.nombre,
          vicepresidencia: formData.vicepresidencia,
          gerencia: formData.gerencia,
          sigla: formData.sigla,
          area: formData.area,
          responsable: formData.responsable,
          fechaCreacion: formData.fechaCreacion,
          objetivoProceso: formData.objetivoProceso,
          hasChanges: hasFormChanges,
        }
      };
      setScreenContext(context);
    }
  }, [procesoActual, formData, isReadOnly, hasFormChanges, setScreenContext]);

  const handleChange = (field: keyof FichaData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!procesoActual) {
        showError('Debe seleccionar un proceso');
        return;
      }

      if (!formData.objetivoProceso.trim()) {
        showError('El objetivo del proceso es requerido');
        return;
      }

      setIsSaving(true);

      // Actualizar solo los campos editables
      await updateProceso({
        // Es obligatorio enviar el ID del proceso; si no, el endpoint se llama como /procesos/undefined
        id: String(procesoActual.id),
        // En el DTO del front el campo se llama objetivoProceso (lo mapeamos en backend a "objetivo")
        objetivoProceso: formData.objetivoProceso,
        // Solo admin puede actualizar información organizacional
        ...(puedeEditarInfoOrganizacional && {
          vicepresidencia: formData.vicepresidencia,
          gerencia: formData.gerencia,
          sigla: formData.sigla,
          // Omitimos responsableId por ahora para no enviar nombres donde se espera un ID numérico
        }),
      }).unwrap();

      // Marcar como guardado y actualizar estado inicial
      setInitialFormData(formData);
      markAsSaved();
      
      showSuccess('Ficha del proceso guardada exitosamente');
    } catch (error: any) {
      showError(error?.data?.message || 'Error al guardar la ficha');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para guardar desde el diálogo
  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!isSaving) {
      forceNavigate();
    }
  };

  // Handler para descartar cambios
  const handleDiscardChanges = () => {
    setFormData(initialFormData);
    forceNavigate();
  };

  // Handlers para Asistentes
  const handleToggleAsistente = async (usuarioId: number) => {
    if (!procesoActual?.id) return;
    
    const nuevosAsistentes = asistentesSeleccionados.includes(usuarioId)
      ? asistentesSeleccionados.filter(id => id !== usuarioId)
      : [...asistentesSeleccionados, usuarioId];
    
    try {
      await asignarAsistentes({
        procesoId: String(procesoActual.id),
        usuariosIds: nuevosAsistentes
      }).unwrap();
      
      await refetchAsistentes();
    } catch (error) {
      showError('Error al actualizar asistentes');
    }
  };

  // Handlers para Reuniones
  const handleAbrirDialogReunion = (reunion?: Reunion) => {
    if (reunion) {
      setReunionEnEdicion(reunion);
      setFormReunion({
        fecha: reunion.fecha.split('T')[0], // Formato YYYY-MM-DD para input date
        descripcion: reunion.descripcion,
        estado: reunion.estado
      });
    } else {
      setReunionEnEdicion(null);
      setFormReunion({
        fecha: '',
        descripcion: '',
        estado: 'programada'
      });
    }
    setDialogReunionOpen(true);
  };

  const handleGuardarReunion = async () => {
    if (!formReunion.fecha || !formReunion.descripcion) {
      showError('Fecha y descripción son requeridas');
      return;
    }

    if (!procesoActual?.id) {
      showError('No hay proceso seleccionado');
      return;
    }

    try {
      if (reunionEnEdicion) {
        // Actualizar reunión existente
        await actualizarReunionMutation({
          id: reunionEnEdicion.id,
          fecha: formReunion.fecha,
          descripcion: formReunion.descripcion,
          estado: formReunion.estado
        }).unwrap();
        showSuccess('Reunión actualizada');
      } else {
        // Crear nueva reunión
        await crearReunionMutation({
          procesoId: String(procesoActual.id),
          fecha: formReunion.fecha,
          descripcion: formReunion.descripcion,
          estado: formReunion.estado
        }).unwrap();
        showSuccess('Reunión creada');
      }
      
      await refetchReuniones();
      setDialogReunionOpen(false);
    } catch (error) {
      showError('Error al guardar reunión');
    }
  };

  const handleEliminarReunion = async (reunionId: number) => {
    if (!(await confirmDelete('esta reunión'))) return;
    
    try {
      await eliminarReunionMutation(reunionId).unwrap();
      showSuccess('Reunión eliminada');
      await refetchReuniones();
    } catch (error) {
      showError('Error al eliminar reunión');
    }
  };

  // Handlers para Asistencia
  const handleAbrirDialogAsistencia = async (reunion: Reunion) => {
    console.log('[FichaPage] Abriendo diálogo de asistencia para reunión:', reunion);
    setReunionParaAsistencia(reunion);
    
    // Cargar asistencias de esta reunión desde el backend
    try {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      console.log('[FichaPage] Token presente:', !!token);
      console.log('[FichaPage] URL:', `${API_BASE_URL}/reuniones/${reunion.id}/asistencias`);
      
      const response = await fetch(`${API_BASE_URL}/reuniones/${reunion.id}/asistencias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[FichaPage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[FichaPage] Asistencias cargadas:', data);
        console.log('[FichaPage] Cantidad de asistencias:', data.length);
        setAsistencias(data);
      } else {
        const errorText = await response.text();
        console.error('[FichaPage] Error en respuesta:', errorText);
      }
    } catch (error) {
      console.error('[FichaPage] Error al cargar asistencias:', error);
    }
    
    setDialogAsistenciaOpen(true);
  };

  const handleToggleAsistencia = (asistenciaId: number) => {
    setAsistencias(prev => prev.map(a => 
      a.id === asistenciaId 
        ? { ...a, asistio: !a.asistio }
        : a
    ));
  };

  const handleGuardarAsistencia = async () => {
    if (!reunionParaAsistencia) return;
    
    try {
      await actualizarAsistenciasMutation({
        reunionId: reunionParaAsistencia.id,
        asistencias: asistencias.map(a => ({
          id: a.id,
          asistio: a.asistio
        }))
      }).unwrap();
      
      showSuccess('Asistencia registrada');
      setDialogAsistenciaOpen(false);
    } catch (error) {
      showError('Error al guardar asistencia');
    }
  };

  if (!procesoActual && mostrarFiltrosProceso) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            gutterBottom
            fontWeight={700}
            sx={{ color: '#1976d2' }}
          >
            Ficha del Proceso
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seleccione un proceso para ver su ficha.
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Filtros de Proceso
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={filtroArea}
                  onChange={(e) => {
                    setFiltroArea(e.target.value);
                    setFiltroProceso('all');
                  }}
                  label="Filtrar por Área"
                >
                  <MenuItem value="all">Todas las áreas</MenuItem>
                  {areasDisponibles.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Filtrar por Proceso</InputLabel>
                <Select
                  value={filtroProceso}
                  onChange={(e) => setFiltroProceso(e.target.value)}
                  label="Filtrar por Proceso"
                >
                  <MenuItem value="all">Todos los procesos</MenuItem>
                  {procesosDisponibles
                    .filter((p: any) => filtroArea === 'all' || p.areaId === filtroArea)
                    .map((proceso: any) => (
                      <MenuItem key={proceso.id} value={proceso.id}>
                        {proceso.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Procesos a cargo
            </Typography>
            {procesosPorArea.map((grupo) => (
              <Accordion key={grupo.areaId} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>
                    {grupo.areaNombre} ({grupo.procesos.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {grupo.procesos.map((proceso: any) => (
                      <ListItem
                        key={proceso.id}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                        onClick={() => {
                          setProcesoSeleccionado(proceso);
                          iniciarModoVisualizar();
                          showSuccess(`Proceso "${proceso.nombre}" seleccionado`);
                        }}
                      >
                        <ListItemText
                          primary={proceso.nombre}
                          secondary={proceso.responsableNombre ? `Responsable: ${proceso.responsableNombre}` : undefined}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en la ficha del proceso."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Ficha del Proceso"
      description="Formulario de diligenciamiento obligatorio con información básica del proceso"
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {isEditMode && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {puedeEditarInfoOrganizacional && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Guardar Cambios
            </Button>
          )}
        </Box>
      }
      topContent={<FiltroProcesoSupervisor />}
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Está en modo visualización. Solo puede ver la información. Para editar, seleccione el proceso en modo "Editar" desde el Dashboard.
          </Alert>
        )
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
            Información Organizacional
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete los datos de la estructura organizacional del proceso.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <TextField
              fullWidth
              label="Vicepresidencia / Gerencia Alta"
              value={formData.vicepresidencia}
              onChange={handleChange('vicepresidencia')}
              required
              disabled={!puedeEditarInfoOrganizacional}
              helperText={!puedeEditarInfoOrganizacional ? 'Campo bloqueado por el administrador' : ''}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Gerencia"
              value={formData.gerencia}
              onChange={handleChange('gerencia')}
              required
              disabled={!puedeEditarInfoOrganizacional}
              helperText={!puedeEditarInfoOrganizacional ? 'Campo bloqueado por el administrador' : ''}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Sigla del Proceso"
              value={formData.sigla}
              onChange={handleChange('sigla')}
              required
              disabled={!puedeEditarInfoOrganizacional}
              helperText={puedeEditarInfoOrganizacional ? 'Usada para identificar riesgos (ej: "PF" para Planificación Financiera, "GTH" para Gestión de Talento Humano)' : 'Campo bloqueado por el administrador'}
              inputProps={{ maxLength: 4, style: { textTransform: 'uppercase' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Área"
              value={formData.area}
              disabled={true}
              helperText="Asignada automáticamente"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Responsable del Proceso"
              value={formData.responsable}
              disabled={true}
              helperText="Responsable líder según sistema"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <TextField
              fullWidth
              label="Fecha de Creación"
              type="date"
              value={formData.fechaCreacion}
              onChange={handleChange('fechaCreacion')}
              InputLabelProps={{ shrink: true }}
              disabled={!puedeEditarFechaCreacion}
              helperText={!puedeEditarFechaCreacion ? 'Campo bloqueado' : ''}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
            Gestión y Objetivos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Defina quién está a cargo de la ejecución y el objetivo principal.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ maxWidth: { md: '50%' } }}>
              <TextField
                fullWidth
                label="Quién está a cargo del Proceso (Encargado)"
                value={formData.encargado}
                onChange={handleChange('encargado')}
                required
                disabled={isReadOnly}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            <TextField
              fullWidth
              label="Objetivo del Proceso"
              value={formData.objetivoProceso}
              onChange={handleChange('objetivoProceso')}
              multiline
              rows={4}
              disabled={isReadOnly}
              placeholder="Describa el objetivo principal del proceso..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        </Box>

        <Divider />

        {/* NUEVA SECCIÓN: ASISTENTES Y REUNIONES */}
        <Box>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
            Asistentes y Reuniones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gestione los asistentes del proceso y programe reuniones de seguimiento.
          </Typography>

          {/* Subsección: Asistentes */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" />
                Asistentes del Proceso
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setDialogAsistentesExternosOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Agregar Externos
              </Button>
            </Box>
            
            {usuariosDisponibles.length === 0 && usuariosExternosInfo.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay usuarios asignados a este proceso. Los asistentes deben ser Dueños de Procesos o Supervisores de Riesgos asignados al proceso, o puede agregar asistentes externos.
              </Alert>
            ) : (
              <>
                {/* Asistentes del Proceso */}
                {usuariosDisponibles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                      Usuarios del Proceso
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {usuariosDisponibles.map(usuario => (
                        <Card 
                          key={usuario.id} 
                          sx={{ 
                            cursor: 'pointer',
                            border: asistentesSeleccionados.includes(usuario.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            bgcolor: asistentesSeleccionados.includes(usuario.id) ? 'rgba(25, 118, 210, 0.04)' : 'white',
                            transition: 'all 0.2s',
                            '&:hover': { boxShadow: 2 },
                            maxWidth: 300,
                            flex: '0 1 auto'
                          }}
                          onClick={() => handleToggleAsistente(usuario.id)}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              {asistentesSeleccionados.includes(usuario.id) && (
                                <CheckCircleIcon color="primary" fontSize="small" />
                              )}
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {usuario.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {usuario.rol === 'dueño_procesos' ? 'Dueño' : 'Supervisor'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Asistentes Externos */}
                {usuariosExternosInfo.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                      Asistentes Externos ({usuariosExternosInfo.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {usuariosExternosInfo.map((usuario: any) => (
                        <Card 
                          key={usuario.id} 
                          sx={{ 
                            cursor: 'pointer',
                            border: '2px solid #9c27b0',
                            bgcolor: 'rgba(156, 39, 176, 0.04)',
                            transition: 'all 0.2s',
                            '&:hover': { boxShadow: 2 },
                            maxWidth: 300,
                            flex: '0 1 auto'
                          }}
                          onClick={() => handleToggleAsistente(usuario.id)}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <CheckCircleIcon sx={{ color: '#9c27b0' }} fontSize="small" />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {usuario.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  Externo
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

          {/* Subsección: Reuniones */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                Reuniones Programadas
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleAbrirDialogReunion()}
                disabled={asistentesSeleccionados.length === 0}
                sx={{ borderRadius: 2 }}
              >
                Nueva Reunión
              </Button>
            </Box>

            {asistentesSeleccionados.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Debe seleccionar al menos un asistente antes de crear reuniones.
              </Alert>
            ) : reuniones.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay reuniones programadas. Haga clic en "Nueva Reunión" para crear una.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reuniones.map(reunion => {
                  const asistenciasReunion = asistencias.filter(a => a.reunionId === reunion.id);
                  const totalAsistentes = asistenciasReunion.length;
                  const asistieron = asistenciasReunion.filter(a => a.asistio).length;
                  
                  return (
                    <Card key={reunion.id} sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {new Date(reunion.fecha).toLocaleDateString('es-ES', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                              <Chip 
                                label={reunion.estado.charAt(0).toUpperCase() + reunion.estado.slice(1)}
                                color={
                                  reunion.estado === 'realizada' ? 'success' : 
                                  reunion.estado === 'cancelada' ? 'error' : 
                                  'primary'
                                }
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {reunion.descripcion}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Asistencia: {asistieron} de {totalAsistentes} asistentes
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAbrirDialogAsistencia(reunion)}
                            >
                              Registrar Asistencia
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAbrirDialogReunion(reunion)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleEliminarReunion(reunion.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>

        {!isReadOnly && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => {
                if (procesoActual) {
                  setFormData({
                    vicepresidencia: procesoActual.vicepresidencia || '',
                    gerencia: procesoActual.gerencia || '',
                    sigla: (procesoActual as any).sigla || '',
                    area: procesoActual.areaNombre || '',
                    responsable: procesoActual.responsableNombre || procesoActual.responsable || '',
                    encargado: procesoActual.responsableNombre || procesoActual.responsable || '',
                    fechaCreacion: procesoActual.createdAt ? new Date(procesoActual.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    objetivoProceso: procesoActual.objetivoProceso || '',
                  });
                }
              }}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Restaurar
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || !hasFormChanges}
              sx={{
                borderRadius: 2,
                px: 5,
                background: '#1976d2',
                '&:hover': {
                  background: '#1565c0',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {isSaving ? 'Guardando...' : 'Guardar Ficha'}
            </Button>
          </Box>
        )}
      </Box>
    </AppPageLayout>

      {/* Dialog para Crear/Editar Reunión */}
      <Dialog 
        open={dialogReunionOpen} 
        onClose={() => setDialogReunionOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>
          {reunionEnEdicion ? 'Editar Reunión' : 'Nueva Reunión'}
        </DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Fecha de la Reunión"
              type="date"
              value={formReunion.fecha}
              onChange={(e) => setFormReunion(prev => ({ ...prev, fecha: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            
            <TextField
              label="Descripción / Agenda"
              value={formReunion.descripcion}
              onChange={(e) => setFormReunion(prev => ({ ...prev, descripcion: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Ej: Revisión mensual de riesgos y controles"
            />

            <Alert severity="info" sx={{ mt: 1 }}>
              Esta reunión incluirá a los {asistentesSeleccionados.length} asistentes seleccionados.
            </Alert>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setDialogReunionOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleGuardarReunion}
              disabled={!formReunion.fecha || !formReunion.descripcion}
            >
              {reunionEnEdicion ? 'Actualizar' : 'Crear Reunión'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog para Registrar Asistencia */}
      <Dialog 
        open={dialogAsistenciaOpen} 
        onClose={() => setDialogAsistenciaOpen(false)}
        maxWidth="xs"
      >
        <DialogTitle>
          Registro de Asistencia
        </DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          {reunionParaAsistencia && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Reunión: {new Date(reunionParaAsistencia.fecha).toLocaleDateString('es-ES')} - {reunionParaAsistencia.descripcion}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(() => {
                  console.log('[FichaPage] Estado asistencias completo:', asistencias);
                  console.log('[FichaPage] Reunión para asistencia ID:', reunionParaAsistencia.id);
                  
                  const asistenciasFiltradas = asistencias.filter(a => {
                    console.log('[FichaPage] Comparando:', a.reunionId, '===', reunionParaAsistencia.id);
                    return a.reunionId === reunionParaAsistencia.id;
                  });
                  
                  console.log('[FichaPage] Asistencias filtradas:', asistenciasFiltradas);
                  console.log('[FichaPage] Cantidad filtrada:', asistenciasFiltradas.length);
                  
                  if (asistenciasFiltradas.length === 0) {
                    return (
                      <Alert severity="warning">
                        No se encontraron asistentes para esta reunión. 
                        Asegúrese de haber seleccionado asistentes en la sección "Asistentes".
                      </Alert>
                    );
                  }
                  
                  return asistenciasFiltradas.map(asistencia => (
                    <Card 
                      key={asistencia.id}
                      sx={{ 
                        cursor: 'pointer',
                        border: asistencia.asistio ? '2px solid #4caf50' : '1px solid #e0e0e0',
                        bgcolor: asistencia.asistio ? 'rgba(76, 175, 80, 0.04)' : 'white'
                      }}
                      onClick={() => handleToggleAsistencia(asistencia.id)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {asistencia.asistio ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <CancelIcon color="disabled" />
                            )}
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {asistencia.usuario?.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asistencia.usuario?.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            label={asistencia.asistio ? 'Asistió' : 'No Asistió'}
                            color={asistencia.asistio ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                Haga clic en cada asistente para marcar/desmarcar su asistencia.
              </Alert>
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setDialogAsistenciaOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleGuardarAsistencia}
            >
              Guardar Asistencia
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog para Agregar Asistentes Externos */}
      <Dialog 
        open={dialogAsistentesExternosOpen} 
        onClose={() => {
          setDialogAsistentesExternosOpen(false);
          setBusquedaUsuario('');
        }}
        maxWidth="xs"
      >
        <DialogTitle>
          Agregar Asistentes Externos
        </DialogTitle>
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Seleccione usuarios externos al proceso para agregarlos como asistentes a las reuniones.
          </Typography>

          {/* Buscador */}
          <TextField
            fullWidth
            placeholder="Buscar por nombre o email..."
            value={busquedaUsuario}
            onChange={(e) => setBusquedaUsuario(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
          />
          {/* Lista de usuarios */}
          <Box sx={{ 
            maxHeight: 400, 
            overflowY: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 1
          }}>
            {loadingUsuarios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">Cargando usuarios...</Typography>
              </Box>
            ) : !todosUsuarios || todosUsuarios.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                <Typography color="text.secondary">No hay usuarios disponibles</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Verifique la consola del navegador para más detalles
                </Typography>
              </Box>
            ) : usuariosFiltrados.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">
                  No se encontraron usuarios con "{busquedaUsuario}"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {usuariosFiltrados.map((usuario: any) => {
                  const estaSeleccionado = asistentesSeleccionados.includes(usuario.id);
                  const esDelProceso = usuariosDisponibles.some(u => u.id === usuario.id);
                  
                  return (
                    <Card 
                      key={usuario.id}
                      sx={{ 
                        cursor: 'pointer',
                        border: estaSeleccionado ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        bgcolor: estaSeleccionado ? 'rgba(25, 118, 210, 0.04)' : 'white',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => handleToggleAsistente(usuario.id)}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {estaSeleccionado && (
                              <CheckCircleIcon color="primary" />
                            )}
                            <Box>
                              <Typography variant="body1" fontWeight={600}>
                                {usuario.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {usuario.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {esDelProceso && (
                              <Chip 
                                label="Del Proceso" 
                                size="small" 
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            <Chip 
                              label={
                                usuario.roleRelacion?.codigo === 'dueño_procesos' ? 'Dueño' : 
                                usuario.roleRelacion?.codigo === 'supervisor_riesgos' ? 'Supervisor' : 
                                usuario.roleRelacion?.nombre || usuario.roleRelacion?.codigo || 'Sin rol'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Los usuarios seleccionados serán incluidos automáticamente en todas las reuniones del proceso.
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {asistentesSeleccionados.length} asistente(s) seleccionado(s)
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                setDialogAsistentesExternosOpen(false);
                setBusquedaUsuario('');
                showSuccess('Asistentes actualizados');
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}

