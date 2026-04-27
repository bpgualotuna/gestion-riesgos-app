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
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, Visibility as VisibilityIcon, ExpandMore as ExpandMoreIcon, Add as AddIcon, Event as EventIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProcesoMutation, useGetGerenciasQuery, useGetAsistentesProcesoQuery, useAsignarAsistentesProcesoMutation, useGetReunionesQuery, useCrearReunionMutation, useActualizarReunionMutation, useEliminarReunionMutation, useActualizarAsistenciasMutation, useGetUsuariosQuery } from '../../api/services/riesgosApi';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../../utils/constants';
import { useEffect } from 'react';
import { useProcesosFiltradosPorArea } from '../../hooks/useAsignaciones';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import LoadingActionButton from '../../components/ui/LoadingActionButton';
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

const parseFlexibleDate = (value: any): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const d = new Date(`${s}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split('/');
      const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    const nested = (value as any).$date ?? (value as any).date ?? (value as any).fecha;
    if (nested != null) return parseFlexibleDate(nested);
    return null;
  }
  return null;
};

const getDateParts = (value: any): { year: number; month: number; day: number } | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const isoLike = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoLike) {
      return {
        year: Number(isoLike[1]),
        month: Number(isoLike[2]),
        day: Number(isoLike[3]),
      };
    }
    const slashLike = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashLike) {
      return {
        year: Number(slashLike[3]),
        month: Number(slashLike[2]),
        day: Number(slashLike[1]),
      };
    }
  }
  const parsed = parseFlexibleDate(value);
  if (!parsed) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
};

const toDateInputValue = (value?: any): string => {
  const parts = getDateParts(value);
  if (!parts) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

const formatDisplayDate = (value?: any): string => {
  const parts = getDateParts(value);
  if (!parts) return 'Fecha no definida';
  const parsed = new Date(parts.year, parts.month - 1, parts.day);
  return parsed.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getReunionFechaValue = (reunion: any): string | Date | null =>
  reunion?.fecha ?? reunion?.fechaReunion ?? reunion?.date ?? reunion?.createdAt ?? reunion?.updatedAt ?? null;

const sanitizeVisibleText = (value: unknown): string =>
  String(value ?? '')
    .replace(/[\u200B\u200E\u200F\uFEFF]/g, '')
    .trim();

const getUserDisplayName = (user: any): string =>
  sanitizeVisibleText(user?.nombre || user?.fullName || user?.name || user?.usuarioNombre) || 'Usuario sin nombre';

const getUserDisplayEmail = (user: any): string =>
  sanitizeVisibleText(user?.email || user?.correo || user?.mail) || 'Sin correo';

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
        fechaCreacion: toDateInputValue(procesoActual.createdAt),
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
      fechaCreacion: toDateInputValue(),
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
  const [dialogDetalleReunionOpen, setDialogDetalleReunionOpen] = useState(false);
  const [reunionEnEdicion, setReunionEnEdicion] = useState<Reunion | null>(null);
  const [reunionDetalle, setReunionDetalle] = useState<Reunion | null>(null);
  const [reunionDetalleFecha, setReunionDetalleFecha] = useState('');
  const [asistenciaDetalle, setAsistenciaDetalle] = useState<Array<{ usuarioId: number; asistio: boolean; nombre: string; email: string }>>([]);
  const [savingReunion, setSavingReunion] = useState(false);
  const [reunionAsistenciaUsuarioIds, setReunionAsistenciaUsuarioIds] = useState<string[]>([]);
  const [reunionAsistentesTab, setReunionAsistentesTab] = useState<'internos' | 'externos'>('internos');
  const [reunionBusquedaUsuario, setReunionBusquedaUsuario] = useState('');
  const [formReunion, setFormReunion] = useState({
    fecha: '',
    descripcion: '',
    estado: 'programada' as 'programada' | 'realizada' | 'cancelada'
  });

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

  const usuariosExternosDisponibles = useMemo(() => {
    const internos = new Set(usuariosDisponibles.map((u) => String(u.id)));
    return (todosUsuarios as any[]).filter((u) => {
      const id = u?.id ?? u?.usuarioId ?? u?._id;
      return !internos.has(String(id));
    });
  }, [todosUsuarios, usuariosDisponibles]);

  const usuariosExternosUi = useMemo(() => {
    return usuariosExternosDisponibles.map((u: any, idx: number) => {
      const rawId = u?.id ?? u?.usuarioId ?? u?._id;
      const idAsString = String(rawId);
      return {
        raw: u,
        id: rawId == null ? `sin-id-${idx}` : idAsString,
        canSelect: rawId != null && idAsString.trim() !== '',
        displayName: getUserDisplayName(u),
        displayEmail: getUserDisplayEmail(u),
      };
    });
  }, [usuariosExternosDisponibles]);

  const usuariosExternosFiltradosReunion = useMemo(() => {
    const filtro = reunionBusquedaUsuario.trim().toLowerCase();
    if (!filtro) return usuariosExternosUi;
    return usuariosExternosUi.filter((u) =>
      u.displayName.toLowerCase().includes(filtro) ||
      u.displayEmail.toLowerCase().includes(filtro)
    );
  }, [usuariosExternosUi, reunionBusquedaUsuario]);

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
        fechaCreacion: toDateInputValue(procesoActual.createdAt),
        // En backend el campo se llama "objetivo"
        objetivoProceso: (procesoActual as any).objetivo || '',
      };

      setFormData((prev) => {
        const same =
          prev.vicepresidencia === newData.vicepresidencia &&
          prev.gerencia === newData.gerencia &&
          prev.sigla === newData.sigla &&
          prev.area === newData.area &&
          prev.responsable === newData.responsable &&
          prev.encargado === newData.encargado &&
          prev.fechaCreacion === newData.fechaCreacion &&
          prev.objetivoProceso === newData.objetivoProceso;
        return same ? prev : newData;
      });

      setInitialFormData((prev) => {
        const same =
          prev.vicepresidencia === newData.vicepresidencia &&
          prev.gerencia === newData.gerencia &&
          prev.sigla === newData.sigla &&
          prev.area === newData.area &&
          prev.responsable === newData.responsable &&
          prev.encargado === newData.encargado &&
          prev.fechaCreacion === newData.fechaCreacion &&
          prev.objetivoProceso === newData.objetivoProceso;
        return same ? prev : newData;
      });
    }
  }, [procesoActual]);

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
  const fetchAsistenciasReunion = async (reunionId: number | string): Promise<AsistenciaReunion[]> => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/reuniones/${reunionId}/asistencias`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  };

  const handleAbrirDialogReunion = async (reunion?: Reunion) => {
    setReunionAsistentesTab('internos');
    setReunionBusquedaUsuario('');
    if (reunion) {
      setReunionEnEdicion(reunion);
      setFormReunion({
        fecha: toDateInputValue(getReunionFechaValue(reunion)), // Formato YYYY-MM-DD para input date
        descripcion: reunion.descripcion,
        estado: reunion.estado
      });
      const asistenciasReunion = await fetchAsistenciasReunion(reunion.id);
      const asistentesAsistieron = asistenciasReunion
        .filter((a: any) => a?.asistio)
        .map((a: any) => String(a?.usuarioId))
        .filter((id: string) => id && id !== 'undefined' && id !== 'null');
      setReunionAsistenciaUsuarioIds(asistentesAsistieron);
    } else {
      setReunionEnEdicion(null);
      setFormReunion({
        fecha: '',
        descripcion: '',
        estado: 'programada'
      });
      setReunionAsistenciaUsuarioIds([]);
    }
    setDialogReunionOpen(true);
  };

  const handleGuardarReunion = async () => {
    if (!formReunion.fecha || !formReunion.descripcion) {
      showError('Fecha y descripción son requeridas');
      return;
    }
    if (reunionAsistenciaUsuarioIds.length === 0) {
      showError('Seleccione al menos un asistente (interno o externo) para la reunión');
      return;
    }

    if (!procesoActual?.id) {
      showError('No hay proceso seleccionado');
      return;
    }

    try {
      setSavingReunion(true);
      const asistentesProcesoActuales = asistentesSeleccionados.map((id) => String(id));
      const asistentesNecesariosStrings = Array.from(new Set([...asistentesProcesoActuales, ...reunionAsistenciaUsuarioIds]));
      const asistentesNecesarios = asistentesNecesariosStrings
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));

      await asignarAsistentes({
        procesoId: String(procesoActual.id),
        usuariosIds: asistentesNecesarios,
      }).unwrap();

      let reunionId: number | null = null;
      if (reunionEnEdicion) {
        // Actualizar reunión existente
        await actualizarReunionMutation({
          id: reunionEnEdicion.id,
          fecha: formReunion.fecha,
          descripcion: formReunion.descripcion,
          estado: formReunion.estado
        }).unwrap();
        reunionId = reunionEnEdicion.id;
        showSuccess('Reunión actualizada');
      } else {
        // Crear nueva reunión
        const creada = await crearReunionMutation({
          procesoId: String(procesoActual.id),
          fecha: formReunion.fecha,
          descripcion: formReunion.descripcion,
          estado: formReunion.estado
        }).unwrap();
        reunionId = Number((creada as any)?.id);
        showSuccess('Reunión creada');
      }

      if (reunionId && !Number.isNaN(reunionId)) {
        const asistenciasReunion = await fetchAsistenciasReunion(reunionId);
        if (asistenciasReunion.length > 0) {
          await actualizarAsistenciasMutation({
            reunionId,
            asistencias: asistenciasReunion.map((a: any) => ({
              id: a.id,
              asistio: reunionAsistenciaUsuarioIds.includes(String(a?.usuarioId)),
            })),
          }).unwrap();
        }
      }
      
      await refetchReuniones();
      await refetchAsistentes();
      setDialogReunionOpen(false);
    } catch (error) {
      showError('Error al guardar reunión');
    } finally {
      setSavingReunion(false);
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

  const toggleAsistenciaUsuario = (userId: string) => {
    setReunionAsistenciaUsuarioIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAbrirDetalleReunion = async (reunion: Reunion) => {
    setReunionDetalle(reunion);
    setReunionDetalleFecha(toDateInputValue(getReunionFechaValue(reunion)));
    const internosIds = new Set(usuariosDisponibles.map((u) => Number(u.id)));
    const asistenciasReunion = await fetchAsistenciasReunion(reunion.id);
    const detalle = asistenciasReunion.map((a: any) => {
      const user = (todosUsuarios as any[]).find((u) => Number(u?.id ?? u?.usuarioId ?? u?._id) === Number(a?.usuarioId));
      return {
        usuarioId: Number(a?.usuarioId),
        asistio: !!a?.asistio,
        nombre: getUserDisplayName(user || a?.usuario),
        email: getUserDisplayEmail(user || a?.usuario),
        tipo: internosIds.has(Number(a?.usuarioId)) ? 'Interno' : 'Externo',
      };
    });
    setAsistenciaDetalle(detalle);
    setDialogDetalleReunionOpen(true);
  };

  // Mantener todos los hooks en el mismo orden antes de retornar UI condicional.
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

  if (esDueñoProcesos && !procesoActual?.id) {
    return (
      <AppPageLayout
        title="Ficha del Proceso"
        description="Formulario de diligenciamiento obligatorio con información básica del proceso."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined">
            No hay proceso seleccionado.
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }

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
                sx={{ borderRadius: 2 }}
              >
                Nueva Reunión
              </Button>
            </Box>

            {asistentesSeleccionados.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Debe seleccionar al menos un asistente dentro del modal de reunión.
              </Alert>
            ) : reuniones.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay reuniones programadas.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reuniones.map(reunion => {
                  return (
                    <Card
                      key={reunion.id}
                      sx={{ borderRadius: 2, cursor: 'pointer' }}
                      onClick={() => handleAbrirDetalleReunion(reunion)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {formatDisplayDate(getReunionFechaValue(reunion))}
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
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirDialogReunion(reunion);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarReunion(reunion.id);
                              }}
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
                    fechaCreacion: toDateInputValue(procesoActual.createdAt),
                    objetivoProceso: procesoActual.objetivoProceso || '',
                  });
                }
              }}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Restaurar
            </Button>
            <LoadingActionButton
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!hasFormChanges}
              loading={isSaving}
              loadingText="Guardando..."
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
              Guardar Ficha
            </LoadingActionButton>
          </Box>
        )}
      </Box>
    </AppPageLayout>

      {/* Dialog para Crear/Editar Reunión */}
      <Dialog 
        open={dialogReunionOpen} 
        onClose={() => {
          if (savingReunion) return;
          setDialogReunionOpen(false);
        }}
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
              Seleccione asistentes para esta reunión desde Internos o Externos.
            </Alert>

            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Tabs
                value={reunionAsistentesTab}
                onChange={(_e, v) => setReunionAsistentesTab(v)}
                sx={{ px: 1, pt: 1 }}
              >
                <Tab label={`Internos (${usuariosDisponibles.length})`} value="internos" />
                <Tab label={`Externos (${usuariosExternosUi.length})`} value="externos" />
              </Tabs>

              {reunionAsistentesTab === 'internos' ? (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 220, overflowY: 'auto' }}>
                  {usuariosDisponibles.length === 0 ? (
                    <Alert severity="warning">No hay usuarios internos disponibles para este proceso.</Alert>
                  ) : (
                    usuariosDisponibles.map((usuario) => {
                      const selected = reunionAsistenciaUsuarioIds.includes(String(usuario.id));
                      return (
                        <Card
                          key={`interno-${usuario.id}`}
                          sx={{
                            cursor: 'pointer',
                            border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            bgcolor: selected ? 'rgba(25, 118, 210, 0.04)' : 'white',
                          }}
                          onClick={() => toggleAsistenciaUsuario(String(usuario.id))}
                        >
                          <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={600}>{usuario.nombre}</Typography>
                              <Chip size="small" label={selected ? 'Seleccionado' : 'No seleccionado'} color={selected ? 'primary' : 'default'} />
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Box>
              ) : (
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar externo por nombre o email..."
                    value={reunionBusquedaUsuario}
                    onChange={(e) => setReunionBusquedaUsuario(e.target.value)}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 180, overflowY: 'auto' }}>
                    {usuariosExternosFiltradosReunion.length === 0 ? (
                      <Alert severity="info">No hay usuarios externos para el filtro actual.</Alert>
                    ) : (
                      usuariosExternosFiltradosReunion.map((usuario) => {
                        const selected = usuario.canSelect
                          ? reunionAsistenciaUsuarioIds.map((id) => String(id)).includes(usuario.id)
                          : false;
                        return (
                          <Card
                            key={`externo-${usuario.id}`}
                            sx={{
                              cursor: usuario.canSelect ? 'pointer' : 'default',
                              border: selected ? '2px solid #9c27b0' : '1px solid #e0e0e0',
                              bgcolor: selected ? 'rgba(156, 39, 176, 0.05)' : 'white',
                              minHeight: 68,
                            }}
                            onClick={() => {
                              if (!usuario.canSelect) return;
                              toggleAsistenciaUsuario(String(usuario.id));
                            }}
                          >
                            <CardContent sx={{ py: 1.2, px: 1.5, '&:last-child': { pb: 1.2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" fontWeight={700} sx={{ color: '#111827' }}>
                                    {usuario.displayName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    {usuario.displayEmail}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={!usuario.canSelect ? 'Sin ID' : selected ? 'Seleccionado' : 'No seleccionado'}
                                  color={selected ? 'secondary' : 'default'}
                                  variant={selected ? 'filled' : 'outlined'}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setDialogReunionOpen(false)} disabled={savingReunion}>
              Cancelar
            </Button>
            <LoadingActionButton
              variant="contained"
              onClick={handleGuardarReunion}
              loading={savingReunion}
              loadingText="Guardando..."
              disabled={!formReunion.fecha || !formReunion.descripcion || reunionAsistenciaUsuarioIds.length === 0}
            >
              {reunionEnEdicion ? 'Actualizar' : 'Crear Reunión'}
            </LoadingActionButton>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={dialogDetalleReunionOpen}
        onClose={() => setDialogDetalleReunionOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxWidth: 840 } }}
      >
        <DialogTitle>Detalle de Reunión</DialogTitle>
        <DialogContent dividers>
          {reunionDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {formatDisplayDate(reunionDetalleFecha)}
              </Typography>
              <Typography variant="body1">{reunionDetalle.descripcion}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {(['Interno', 'Externo'] as const).map((tipo) => {
                  const lista = asistenciaDetalle.filter((a) => a.tipo === tipo);
                  return (
                    <Box key={tipo} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {tipo === 'Interno' ? 'Asistentes Internos' : 'Asistentes Externos'}
                      </Typography>
                      {lista.length === 0 ? (
                        <Alert severity="info">No hay {tipo.toLowerCase()}s en esta reunión.</Alert>
                      ) : (
                        lista.map((a) => (
                          <Card key={`detalle-${tipo}-${a.usuarioId}`} variant="outlined">
                            <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{a.nombre}</Typography>
                                  <Typography variant="caption" color="text.secondary">{a.email}</Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={a.asistio ? 'Asistió' : 'No asistió'}
                                  color={a.asistio ? 'success' : 'default'}
                                  variant={a.asistio ? 'filled' : 'outlined'}
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalleReunionOpen(false)}>Cerrar</Button>
          {reunionDetalle && (
            <Button
              variant="contained"
              onClick={() => {
                setDialogDetalleReunionOpen(false);
                void handleAbrirDialogReunion(reunionDetalle);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </>
  );
}

