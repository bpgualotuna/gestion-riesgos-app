/**
 * Página de Administración - Usuario Root
 * Control total del sistema: usuarios, roles, permisos, configuraciones completas
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Functions as FunctionsIcon,
  ViewList as ViewListIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Task as TaskIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useGetProcesosQuery,
  useUpdateProcesoMutation,
  useGetPasosProcesoQuery,
  useCreatePasoProcesoMutation,
  useUpdatePasoProcesoMutation,
  useDeletePasoProcesoMutation,
  useGetEncuestasQuery,
  useCreateEncuestaMutation,
  useUpdateEncuestaMutation,
  useGetPreguntasEncuestaQuery,
  useGetListasValoresQuery,
  useUpdateListaValoresMutation,
  useGetParametrosValoracionQuery,
  useUpdateParametroValoracionMutation,
  useGetTipologiasQuery,
  useCreateTipologiaMutation,
  useUpdateTipologiaMutation,
  useGetFormulasQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useDeleteFormulaMutation,
  useGetConfiguracionesQuery,
  useUpdateConfiguracionMutation,
  useGetTiposRiesgosQuery,
  useUpdateTiposRiesgosMutation,
  useGetObjetivosQuery,
  useUpdateObjetivosMutation,
  useGetFrecuenciasQuery,
  useUpdateFrecuenciasMutation,
  useGetFuentesQuery,
  useUpdateFuentesMutation,
  useGetImpactosQuery,
  useUpdateImpactosMutation,
} from '../../gestion-riesgos/api/riesgosApi';
import { useNotification } from '../../../shared/hooks/useNotification';
import type { Proceso } from '../../gestion-riesgos/types';
import type { UserRole } from '../../../contexts/AuthContext';


// Tipos para configuración
interface Usuario {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  position: string;
  phone?: string;
  activo: boolean;
  createdAt: string;
  password?: string; // Solo para creación/edición
}

interface Rol {
  id: string;
  nombre: string;
  codigo: UserRole | string;
  descripcion: string;
  permisos: Permiso[];
  activo: boolean;
  esSistema: boolean;
}

interface Permiso {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  categoria: string;
}

interface PermisoProceso {
  procesoId: string;
  procesoNombre: string;
  rolesPermitidos: UserRole[];
  usuariosPermitidos: string[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeAprobar: boolean;
}

interface FormulaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  formula: string;
  activa: boolean;
  categoria: string;
  variables: string[];
}

interface TareaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  estados: string[];
  prioridades: string[];
  tiempoMaximoResolucion: number; // días
  recordatorios: {
    activo: boolean;
    diasAntes: number[];
  };
}

interface NotificacionConfig {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string;
  plantilla: string;
  activa: boolean;
  crearTareaAutomatica: boolean;
  rolesDestinatarios: UserRole[];
}

export default function AdminPage() {
  const { user, esAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { data: procesos = [] } = useGetProcesosQuery();
  const [updateProceso] = useUpdateProcesoMutation();
  
  // Nuevas APIs
  const { data: pasosProceso = [] } = useGetPasosProcesoQuery();
  const [createPasoProceso] = useCreatePasoProcesoMutation();
  const [updatePasoProceso] = useUpdatePasoProcesoMutation();
  const [deletePasoProceso] = useDeletePasoProcesoMutation();
  
  const { data: encuestas = [] } = useGetEncuestasQuery();
  const [createEncuesta] = useCreateEncuestaMutation();
  const [updateEncuesta] = useUpdateEncuestaMutation();
  
  const { data: listasValores = [] } = useGetListasValoresQuery();
  const [updateListaValores] = useUpdateListaValoresMutation();
  
  const { data: parametrosValoracion = [] } = useGetParametrosValoracionQuery();
  const [updateParametroValoracion] = useUpdateParametroValoracionMutation();
  
  const { data: tipologias = [] } = useGetTipologiasQuery();
  const [createTipologia] = useCreateTipologiaMutation();
  const [updateTipologia] = useUpdateTipologiaMutation();
  
  const { data: formulas = [] } = useGetFormulasQuery();
  const [createFormula] = useCreateFormulaMutation();
  const [updateFormula] = useUpdateFormulaMutation();
  const [deleteFormula] = useDeleteFormulaMutation();
  
  const { data: configuraciones = [] } = useGetConfiguracionesQuery();
  const [updateConfiguracion] = useUpdateConfiguracionMutation();
  const [activeSection, setActiveSection] = useState<string>(() => {
    return localStorage.getItem('adminSection') || 'usuarios';
  });
  
  // Estados para diálogos
  const [openUsuarioDialog, setOpenUsuarioDialog] = useState(false);
  const [openRolDialog, setOpenRolDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openPermisoProcesoDialog, setOpenPermisoProcesoDialog] = useState(false);
  const [openFormulaDialog, setOpenFormulaDialog] = useState(false);
  const [openTareaConfigDialog, setOpenTareaConfigDialog] = useState(false);
  const [openNotificacionConfigDialog, setOpenNotificacionConfigDialog] = useState(false);
  const [openAsignacionDialog, setOpenAsignacionDialog] = useState(false);
  const [openAreaGerenteDialog, setOpenAreaGerenteDialog] = useState(false);
  const [openNuevaAreaDialog, setOpenNuevaAreaDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [selectedPasswordUsuario, setSelectedPasswordUsuario] = useState<Usuario | null>(null);
  const [selectedGerente, setSelectedGerente] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estados para formularios
  const [usuarioForm, setUsuarioForm] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'analyst' as UserRole,
    department: '',
    position: '',
    phone: '',
    password: '',
    activo: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    nuevaPassword: '',
    confirmarPassword: '',
  });

  const [rolForm, setRolForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    permisos: [] as string[],
  });

  const [permisoProcesoForm, setPermisoProcesoForm] = useState<PermisoProceso>({
    procesoId: '',
    procesoNombre: '',
    rolesPermitidos: [],
    usuariosPermitidos: [],
    puedeEditar: false,
    puedeEliminar: false,
    puedeAprobar: false,
  });

  const [asignacionForm, setAsignacionForm] = useState({
    areaId: '',
    responsableId: '',
    responsableNombre: '',
    directorId: '',
    directorNombre: '',
  });

  // Áreas del sistema con persistencia
  interface Area {
    id: string;
    nombre: string;
    gerentesIds: string[];
    activa: boolean;
  }

  const [areas, setAreas] = useState<Area[]>(() => {
    const stored = localStorage.getItem('admin_areas');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { id: '1', nombre: 'Talento Humano', gerentesIds: [], activa: true },
      { id: '2', nombre: 'Gestión Financiera y Administrativa', gerentesIds: [], activa: true },
      { id: '3', nombre: 'Operaciones', gerentesIds: [], activa: true },
      { id: '4', nombre: 'Tecnología', gerentesIds: [], activa: true },
    ];
  });

  // Persistir áreas
  useEffect(() => {
    localStorage.setItem('admin_areas', JSON.stringify(areas));
  }, [areas]);

  const [areaGerenteForm, setAreaGerenteForm] = useState({
    areaId: '',
    areaNombre: '',
    gerentesIds: [] as string[],
  });

  const [nuevaAreaForm, setNuevaAreaForm] = useState({
    nombre: '',
  });

  const [formulaForm, setFormulaForm] = useState<{
    id?: string;
    nombre: string;
    descripcion: string;
    formula: string;
    categoria: string;
    variables: string[];
    activa: boolean;
  }>({
    id: undefined,
    nombre: '',
    descripcion: '',
    formula: '',
    categoria: 'riesgo',
    variables: [],
    activa: true,
  });

  // Datos mock
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      username: 'dueño_procesos',
      email: 'katherine.chavez@comware.com',
      fullName: 'Katherine Chávez',
      role: 'dueño_procesos',
      department: 'Gestión de Procesos',
      position: 'Dueño del Proceso',
      phone: '+57 300 123 4567',
      activo: true,
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      username: 'manager',
      email: 'maria.gonzalez@comware.com',
      fullName: 'María González',
      role: 'manager',
      department: 'Talento Humano',
      position: 'Gerente de Riesgos',
      phone: '+57 301 234 5678',
      activo: true,
      createdAt: '2024-01-16',
    },
    {
      id: '3',
      username: 'analyst',
      email: 'juan.perez@comware.com',
      fullName: 'Juan Pérez',
      role: 'analyst',
      department: 'Talento Humano',
      position: 'Analista de Riesgos',
      phone: '+57 302 345 6789',
      activo: true,
      createdAt: '2024-01-17',
    },
    {
      id: '5',
      username: 'director',
      email: 'carlos.rodriguez@comware.com',
      fullName: 'Carlos Rodríguez',
      role: 'director_procesos',
      department: 'Gestión Financiera y Administrativa',
      position: 'Director de Procesos',
      phone: '+57 304 567 8901',
      activo: true,
      createdAt: '2024-01-18',
    },
  ]);

  // Solo 3 roles fijos del sistema - NO se pueden añadir más
  const [roles, setRoles] = useState<Rol[]>(() => {
    const stored = localStorage.getItem('admin_roles');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        id: '1',
        nombre: 'Dueño de Proceso',
        codigo: 'dueño_procesos',
        descripcion: 'Gestión completa de procesos asignados',
        permisos: [],
        activo: true,
        esSistema: true,
      },
      {
        id: '2',
        nombre: 'Gerente de Procesos',
        codigo: 'manager',
        descripcion: 'Revisión y aprobación de procesos',
        permisos: [],
        activo: true,
        esSistema: true,
      },
      {
        id: '3',
        nombre: 'Director General',
        codigo: 'director_procesos',
        descripcion: 'Supervisión de procesos por área',
        permisos: [],
        activo: true,
        esSistema: true,
      },
    ];
  });

  // Persistir roles en localStorage
  useEffect(() => {
    localStorage.setItem('admin_roles', JSON.stringify(roles));
  }, [roles]);

  const permisosDisponibles: Permiso[] = [
    { id: '1', nombre: 'Ver Dashboard', codigo: 'dashboard.view', descripcion: 'Ver el dashboard principal', categoria: 'Dashboard' },
    { id: '2', nombre: 'Crear Procesos', codigo: 'procesos.create', descripcion: 'Crear nuevos procesos', categoria: 'Procesos' },
    { id: '3', nombre: 'Editar Procesos', codigo: 'procesos.edit', descripcion: 'Editar procesos existentes', categoria: 'Procesos' },
    { id: '4', nombre: 'Eliminar Procesos', codigo: 'procesos.delete', descripcion: 'Eliminar procesos', categoria: 'Procesos' },
    { id: '5', nombre: 'Revisar Procesos', codigo: 'procesos.review', descripcion: 'Revisar y aprobar procesos', categoria: 'Procesos' },
    { id: '6', nombre: 'Gestionar Usuarios', codigo: 'usuarios.manage', descripcion: 'Crear y gestionar usuarios', categoria: 'Administración' },
    { id: '7', nombre: 'Gestionar Roles', codigo: 'roles.manage', descripcion: 'Crear y gestionar roles', categoria: 'Administración' },
    { id: '8', nombre: 'Configurar Sistema', codigo: 'sistema.config', descripcion: 'Configurar sistema y fórmulas', categoria: 'Administración' },
  ];

  // Fórmulas ahora vienen de la API, no de mock
  // const [formulas, setFormulas] = useState<FormulaConfig[]>([]);

  const [tareaConfig, setTareaConfig] = useState<TareaConfig>({
    id: '1',
    nombre: 'Configuración General de Tareas',
    descripcion: 'Configuración global para el sistema de tareas',
    estados: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    prioridades: ['baja', 'media', 'alta', 'critica'],
    tiempoMaximoResolucion: 30,
    recordatorios: {
      activo: true,
      diasAntes: [7, 3, 1],
    },
  });

  const [notificacionesConfig, setNotificacionesConfig] = useState<NotificacionConfig[]>([
    {
      id: '1',
      tipo: 'proceso_enviado_revision',
      nombre: 'Proceso Enviado a Revisión',
      descripcion: 'Notificación cuando un proceso es enviado a revisión',
      plantilla: 'El proceso "{proceso}" ha sido enviado a revisión por {usuario}',
      activa: true,
      crearTareaAutomatica: true,
      rolesDestinatarios: ['manager', 'director_procesos'],
    },
    {
      id: '2',
      tipo: 'proceso_aprobado',
      nombre: 'Proceso Aprobado',
      descripcion: 'Notificación cuando un proceso es aprobado',
      plantilla: 'El proceso "{proceso}" ha sido aprobado por {usuario}',
      activa: true,
      crearTareaAutomatica: false,
      rolesDestinatarios: ['dueño_procesos'],
    },
    {
      id: '3',
      tipo: 'proceso_rechazado',
      nombre: 'Proceso Rechazado',
      descripcion: 'Notificación cuando un proceso es rechazado con observaciones',
      plantilla: 'El proceso "{proceso}" ha sido rechazado. Observaciones: {observaciones}',
      activa: true,
      crearTareaAutomatica: true,
      rolesDestinatarios: ['dueño_procesos'],
    },
  ]);

  const [permisosProcesos, setPermisosProcesos] = useState<PermisoProceso[]>([]);

  // Verificar permisos
  if (!esAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo los administradores pueden gestionar el sistema.
        </Alert>
      </Box>
    );
  }

  // Escuchar cambios en la sección desde el sidebar
  useEffect(() => {
    const handleSectionChange = () => {
      const section = localStorage.getItem('adminSection') || 'usuarios';
      setActiveSection(section);
    };
    
    window.addEventListener('adminSectionChange', handleSectionChange);
    return () => {
      window.removeEventListener('adminSectionChange', handleSectionChange);
    };
  }, []);

  // ========== GESTIÓN DE USUARIOS ==========
  const handleCrearUsuario = () => {
    setSelectedUsuario(null);
    setUsuarioForm({
      username: '',
      email: '',
      fullName: '',
      role: 'analyst',
      department: '',
      position: '',
      phone: '',
      password: '',
      activo: true,
    });
    setOpenUsuarioDialog(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setUsuarioForm({
      username: usuario.username,
      email: usuario.email,
      fullName: usuario.fullName,
      role: usuario.role,
      department: usuario.department,
      position: usuario.position,
      phone: usuario.phone || '',
      password: '',
      activo: usuario.activo,
    });
    setOpenUsuarioDialog(true);
  };

  const handleCambiarPassword = (usuario: Usuario) => {
    setSelectedPasswordUsuario(usuario);
    setPasswordForm({
      nuevaPassword: '',
      confirmarPassword: '',
    });
    setOpenPasswordDialog(true);
  };

  const handleGuardarUsuario = () => {
    if (!usuarioForm.username || !usuarioForm.email || !usuarioForm.fullName) {
      showError('Complete todos los campos requeridos');
      return;
    }

    if (selectedUsuario) {
      // Editar
      setUsuarios(prev =>
        prev.map(u =>
          u.id === selectedUsuario.id
            ? { ...u, ...usuarioForm, password: undefined }
            : u
        )
      );
      showSuccess('Usuario actualizado correctamente');
    } else {
      // Crear
      if (!usuarioForm.password) {
        showError('Debe establecer una contraseña para el nuevo usuario');
        return;
      }
      const nuevoUsuario: Usuario = {
        id: `user-${Date.now()}`,
        ...usuarioForm,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsuarios([...usuarios, nuevoUsuario]);
      showSuccess('Usuario creado correctamente');
    }
    setOpenUsuarioDialog(false);
  };

  const handleGuardarPassword = () => {
    if (passwordForm.nuevaPassword !== passwordForm.confirmarPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (passwordForm.nuevaPassword.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    // En producción, aquí se haría la actualización en el backend
    showSuccess('Contraseña actualizada correctamente');
    setOpenPasswordDialog(false);
    setPasswordForm({ nuevaPassword: '', confirmarPassword: '' });
  };

  const handleToggleUsuario = (usuarioId: string) => {
    setUsuarios(prev =>
      prev.map(u => (u.id === usuarioId ? { ...u, activo: !u.activo } : u))
    );
    showSuccess('Estado del usuario actualizado');
  };

  const handleEliminarUsuario = (usuarioId: string) => {
    if (window.confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      setUsuarios(prev => prev.filter(u => u.id !== usuarioId));
      showSuccess('Usuario eliminado correctamente');
    }
  };

  // ========== GESTIÓN DE ROLES ==========
  const handleCrearRol = () => {
    setSelectedRol(null);
    setRolForm({
      nombre: '',
      codigo: '',
      descripcion: '',
      permisos: [],
    });
    setOpenRolDialog(true);
  };

  const handleEditarRol = (rol: Rol) => {
    setSelectedRol(rol);
    setRolForm({
      nombre: rol.nombre,
      codigo: rol.codigo,
      descripcion: rol.descripcion,
      permisos: rol.permisos.map(p => p.id),
    });
    setOpenRolDialog(true);
  };

  const handleGuardarRol = () => {
    if (!selectedRol) {
      showError('Solo se pueden editar roles existentes del sistema');
      return;
    }
    // Solo permitir editar permisos, no cambiar nombre, código o descripción
    setRoles(prev =>
      prev.map(r =>
        r.id === selectedRol.id
          ? {
              ...r,
              permisos: permisosDisponibles.filter(p => rolForm.permisos.includes(p.id)),
            }
          : r
      )
    );
    showSuccess('Permisos del rol actualizados correctamente');
    setOpenRolDialog(false);
  };

  const handleEliminarRol = (rolId: string) => {
    const rol = roles.find(r => r.id === rolId);
    if (rol?.esSistema) {
      showError('No se pueden eliminar roles del sistema');
      return;
    }
    if (window.confirm('¿Está seguro de eliminar este rol?')) {
      setRoles(prev => prev.filter(r => r.id !== rolId));
      showSuccess('Rol eliminado correctamente');
    }
  };

  // ========== ASIGNACIONES DE PROCESOS ==========
  const handleEditarAsignacion = (proceso: Proceso) => {
    setSelectedProceso(proceso);
    setAsignacionForm({
      areaId: proceso.areaId || '',
      responsableId: proceso.responsableId || '',
      responsableNombre: proceso.responsableNombre || '',
      directorId: proceso.directorId || '',
      directorNombre: proceso.directorNombre || '',
    });
    setOpenAsignacionDialog(true);
  };

  const handleGuardarAsignacion = async () => {
    if (!selectedProceso) return;
    
    try {
      const responsable = usuarios.find(u => u.id === asignacionForm.responsableId);
      const director = usuarios.find(u => u.id === asignacionForm.directorId);
      
      await updateProceso({
        id: selectedProceso.id,
        areaId: asignacionForm.areaId,
        responsableId: asignacionForm.responsableId,
        directorId: asignacionForm.directorId,
      }).unwrap();
      
      showSuccess(`Proceso "${selectedProceso.nombre}" actualizado correctamente`);
      setOpenAsignacionDialog(false);
      setSelectedProceso(null);
    } catch (error) {
      showError('Error al actualizar el proceso');
    }
  };

  // ========== ÁREAS Y GERENTES ==========
  const handleCrearArea = () => {
    setNuevaAreaForm({ nombre: '' });
    setOpenNuevaAreaDialog(true);
  };

  const handleEditarArea = (area: Area) => {
    setSelectedArea(area);
    setNuevaAreaForm({ nombre: area.nombre });
    setOpenNuevaAreaDialog(true);
  };

  const handleEliminarArea = (area: Area) => {
    if (window.confirm(`¿Está seguro de eliminar el área "${area.nombre}"?`)) {
      const nuevasAreas = areas.map(a => 
        a.id === area.id ? { ...a, activa: false } : a
      );
      setAreas(nuevasAreas);
      showSuccess('Área eliminada correctamente');
    }
  };

  const handleGuardarNuevaArea = () => {
    if (!nuevaAreaForm.nombre.trim()) {
      showError('El nombre del área es requerido');
      return;
    }

    if (selectedArea) {
      // Editar área existente
      const nuevasAreas = areas.map(a =>
        a.id === selectedArea.id
          ? { ...a, nombre: nuevaAreaForm.nombre }
          : a
      );
      setAreas(nuevasAreas);
      showSuccess('Área actualizada correctamente');
    } else {
      // Crear nueva área
      const nuevaArea: Area = {
        id: `area-${Date.now()}`,
        nombre: nuevaAreaForm.nombre,
        gerentesIds: [],
        activa: true,
      };
      setAreas([...areas, nuevaArea]);
      showSuccess('Área creada correctamente');
    }

    setOpenNuevaAreaDialog(false);
    setSelectedArea(null);
    setNuevaAreaForm({ nombre: '' });
  };

  const handleEditarAreaGerente = (gerente: Usuario) => {
    setSelectedGerente(gerente);
    setAreaGerenteForm({
      areaId: '',
      areaNombre: gerente.fullName,
      gerentesIds: [gerente.id],
    });
    setOpenAreaGerenteDialog(true);
  };

  const handleGuardarAreaGerente = () => {
    // Actualizar áreas con los gerentes asignados
    if (areaGerenteForm.areaId) {
      const nuevasAreas = areas.map(area => {
        if (area.id === areaGerenteForm.areaId) {
          return { ...area, gerentesIds: areaGerenteForm.gerentesIds };
        }
        return area;
      });
      setAreas(nuevasAreas);
      showSuccess(`Gerentes asignados al área "${areaGerenteForm.areaNombre}" correctamente`);
    } else {
      showError('Debe seleccionar un área');
    }
    setOpenAreaGerenteDialog(false);
    setSelectedArea(null);
  };

  // ========== PERMISOS DE PROCESOS ==========
  const handleConfigurarPermisosProceso = (proceso: Proceso) => {
    setSelectedProceso(proceso);
    const permisoExistente = permisosProcesos.find(p => p.procesoId === proceso.id);
    if (permisoExistente) {
      setPermisoProcesoForm(permisoExistente);
    } else {
      setPermisoProcesoForm({
        procesoId: proceso.id,
        procesoNombre: proceso.nombre,
        rolesPermitidos: [],
        usuariosPermitidos: [],
        puedeEditar: false,
        puedeEliminar: false,
        puedeAprobar: false,
      });
    }
    setOpenPermisoProcesoDialog(true);
  };

  const handleGuardarPermisosProceso = () => {
    const index = permisosProcesos.findIndex(p => p.procesoId === permisoProcesoForm.procesoId);
    if (index >= 0) {
      const nuevos = [...permisosProcesos];
      nuevos[index] = permisoProcesoForm;
      setPermisosProcesos(nuevos);
    } else {
      setPermisosProcesos([...permisosProcesos, permisoProcesoForm]);
    }
    showSuccess('Permisos del proceso actualizados correctamente');
    setOpenPermisoProcesoDialog(false);
  };

  // ========== FÓRMULAS ==========
  const handleCrearFormula = () => {
    setFormulaForm({
      id: undefined,
      nombre: '',
      descripcion: '',
      formula: '',
      categoria: 'riesgo',
      variables: [],
      activa: true,
    });
    setOpenFormulaDialog(true);
  };

  const handleEditarFormula = (formula: any) => {
    setFormulaForm({
      id: formula.id,
      nombre: formula.nombre,
      descripcion: formula.descripcion || '',
      formula: formula.formula,
      categoria: formula.categoria || 'riesgo',
      variables: formula.variables || [],
      activa: formula.activa !== undefined ? formula.activa : true,
    });
    setOpenFormulaDialog(true);
  };

  const handleGuardarFormula = async () => {
    try {
      if (formulaForm.nombre && formulaForm.formula) {
        if (formulaForm.id) {
          // Editar
          await updateFormula({ id: formulaForm.id, ...formulaForm }).unwrap();
          showSuccess('Fórmula actualizada correctamente');
        } else {
          // Crear
          await createFormula(formulaForm).unwrap();
          showSuccess('Fórmula creada correctamente');
        }
        setOpenFormulaDialog(false);
      } else {
        showError('Debe completar nombre y fórmula');
      }
    } catch (error) {
      showError('Error al guardar la fórmula');
    }
  };

  // ========== CONFIGURACIÓN DE TAREAS ==========
  const handleGuardarTareaConfig = () => {
    setTareaConfig({ ...tareaConfig });
    showSuccess('Configuración de tareas actualizada correctamente');
    setOpenTareaConfigDialog(false);
  };

  // ========== CONFIGURACIÓN DE NOTIFICACIONES ==========
  const handleEditarNotificacionConfig = (config: NotificacionConfig) => {
    setOpenNotificacionConfigDialog(true);
  };

  const handleGuardarNotificacionConfig = () => {
    showSuccess('Configuración de notificaciones actualizada correctamente');
    setOpenNotificacionConfigDialog(false);
  };

  // ========== PASOS DEL PROCESO ==========
  const handleCrearPasoProceso = async () => {
    try {
      const nuevoPaso = {
        nombre: 'Nuevo Paso',
        ruta: '/nuevo-paso',
        icono: 'Description',
        orden: pasosProceso.length + 1,
        visible: true,
        requerido: false,
      };
      await createPasoProceso(nuevoPaso).unwrap();
      showSuccess('Paso creado correctamente');
    } catch (error) {
      showError('Error al crear el paso');
    }
  };

  const handleEditarPasoProceso = async (paso: any) => {
    try {
      await updatePasoProceso({ id: paso.id, ...paso }).unwrap();
      showSuccess(`Paso "${paso.nombre}" actualizado correctamente`);
    } catch (error) {
      showError('Error al actualizar el paso');
    }
  };

  const handleEliminarPasoProceso = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este paso?')) {
      try {
        await deletePasoProceso(id).unwrap();
        showSuccess('Paso eliminado correctamente');
      } catch (error) {
        showError('Error al eliminar el paso');
      }
    }
  };

  // ========== ENCUESTAS ==========
  const handleCrearEncuesta = async () => {
    try {
      const nuevaEncuesta = {
        nombre: 'Nueva Encuesta',
        descripcion: '',
        activa: true,
        procesoId: procesos[0]?.id || '1',
      };
      await createEncuesta(nuevaEncuesta).unwrap();
      showSuccess('Encuesta creada correctamente');
    } catch (error) {
      showError('Error al crear la encuesta');
    }
  };

  const handleEditarEncuesta = async (encuesta: any) => {
    try {
      await updateEncuesta({ id: encuesta.id, ...encuesta }).unwrap();
      showSuccess(`Encuesta "${encuesta.nombre}" actualizada correctamente`);
    } catch (error) {
      showError('Error al actualizar la encuesta');
    }
  };

  const handleVerPreguntas = (encuestaId: string) => {
    // Navegar a página de preguntas o abrir diálogo
    showSuccess(`Ver preguntas de encuesta: ${encuestaId}`);
  };

  // ========== LISTAS DE VALORES ==========
  const handleEditarListaValores = async (lista: any) => {
    try {
      await updateListaValores({ id: lista.id, ...lista }).unwrap();
      showSuccess(`Lista "${lista.nombre}" actualizada correctamente`);
    } catch (error) {
      showError('Error al actualizar la lista');
    }
  };

  // ========== PARÁMETROS ==========
  const handleEditarParametro = async (parametro: any) => {
    try {
      await updateParametroValoracion({ id: parametro.id, ...parametro }).unwrap();
      showSuccess(`Parámetro "${parametro.nombre}" actualizado correctamente`);
    } catch (error) {
      showError('Error al actualizar el parámetro');
    }
  };

  // ========== TIPOLOGÍAS ==========
  const handleCrearTipologia = async () => {
    try {
      const nuevaTipologia = {
        nombre: 'Nueva Tipología',
        nivel: 'I',
        categorias: [],
        activa: true,
      };
      await createTipologia(nuevaTipologia).unwrap();
      showSuccess('Tipología creada correctamente');
    } catch (error) {
      showError('Error al crear la tipología');
    }
  };

  const handleEditarTipologia = async (tipologia: any) => {
    try {
      await updateTipologia({ id: tipologia.id, ...tipologia }).unwrap();
      showSuccess(`Tipología "${tipologia.nombre}" actualizada correctamente`);
    } catch (error) {
      showError('Error al actualizar la tipología');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon color="primary" />
          Panel de Administración - Usuario Root
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Control total del sistema: usuarios, roles, permisos, configuraciones y fórmulas
        </Typography>
      </Box>

      <Card>
        {/* Sección: Usuarios */}
        {activeSection === 'usuarios' && (
          <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Gestión de Usuarios</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCrearUsuario}>
              Nuevo Usuario
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre Completo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.username}</TableCell>
                    <TableCell>{usuario.fullName}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Chip label={usuario.role} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{usuario.department}</TableCell>
                    <TableCell>
                      <Chip
                        icon={usuario.activo ? <CheckCircleIcon /> : <BlockIcon />}
                        label={usuario.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={usuario.activo ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleEditarUsuario(usuario)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handleCambiarPassword(usuario)}
                        title="Cambiar contraseña"
                      >
                        <LockIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleUsuario(usuario.id)}
                        color={usuario.activo ? 'default' : 'success'}
                      >
                        {usuario.activo ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleEliminarUsuario(usuario.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        )}

        {/* Sección: Roles y Permisos */}
        {activeSection === 'roles' && (
          <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Gestión de Roles y Permisos</Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              Los roles del sistema son fijos y no se pueden añadir ni eliminar. Solo puede modificar los permisos de cada rol.
            </Alert>
          </Box>
          <Grid2 container spacing={2}>
            {roles.map((rol) => (
              <Grid2 xs={12} md={6} key={rol.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">
                          {rol.nombre}
                          {rol.esSistema && (
                            <Chip label="Sistema" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rol.descripcion}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Código: {rol.codigo}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" color="primary" onClick={() => handleEditarRol(rol)} title="Editar permisos">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Permisos ({rol.permisos.length})
                    </Typography>
                    {rol.permisos.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Sin permisos asignados
                      </Typography>
                    ) : (
                      <List dense>
                        {rol.permisos.map((permiso) => (
                          <ListItem key={permiso.id}>
                            <ListItemText primary={permiso.nombre} secondary={permiso.descripcion} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
          </Box>
        )}

        {/* Sección: Asignaciones */}
        {activeSection === 'asignaciones' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Asignación de Procesos</Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                Asigne responsables (dueños de procesos) y directores a cada proceso del sistema.
              </Alert>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proceso</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Director</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {procesos.map((proceso) => (
                    <TableRow key={proceso.id}>
                      <TableCell>{proceso.nombre}</TableCell>
                      <TableCell>
                        {proceso.responsableNombre ? (
                          <Chip label={proceso.responsableNombre} size="small" color="primary" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin asignar
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {proceso.directorNombre ? (
                          <Chip label={proceso.directorNombre} size="small" color="info" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sin asignar
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={proceso.estado}
                          size="small"
                          color={
                            proceso.estado === 'aprobado'
                              ? 'success'
                              : proceso.estado === 'en_revision'
                              ? 'info'
                              : proceso.estado === 'con_observaciones'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditarAsignacion(proceso)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Sección: Áreas y Gerentes */}
        {activeSection === 'areas-gerentes' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Configuración de Áreas y Gerentes</Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Cree áreas y asigne gerentes a cada área. Los gerentes solo podrán ver y gestionar los procesos de sus áreas asignadas.
                </Alert>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCrearArea}>
                Nueva Área
              </Button>
            </Box>
            <Grid2 container spacing={2}>
              <Grid2 xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Áreas del Sistema
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Área</TableCell>
                            <TableCell>Gerentes Asignados</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {areas.filter(a => a.activa).map((area) => {
                            const gerentesAsignados = usuarios.filter(u => 
                              u.role === 'manager' && area.gerentesIds.includes(u.id)
                            );
                            return (
                              <TableRow key={area.id}>
                                <TableCell>
                                  <Typography variant="body1" fontWeight={500}>
                                    {area.nombre}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {gerentesAsignados.length > 0 ? (
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                      {gerentesAsignados.map(gerente => (
                                        <Chip key={gerente.id} label={gerente.fullName} size="small" color="primary" />
                                      ))}
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Sin gerentes asignados
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={() => {
                                        setSelectedArea(area);
                                        setAreaGerenteForm({
                                          areaId: area.id,
                                          areaNombre: area.nombre,
                                          gerentesIds: area.gerentesIds,
                                        });
                                        setOpenAreaGerenteDialog(true);
                                      }}
                                      title="Asignar Gerentes"
                                    >
                                      <PeopleIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="primary" onClick={() => handleEditarArea(area)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleEliminarArea(area)}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          </Box>
        )}


        {/* Sección: Pasos del Proceso */}
        {activeSection === 'pasos-proceso' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Gestión de Pasos/Pestañas del Proceso</Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Configure los pasos o pestañas que aparecen en el flujo de cada proceso. Puede agregar nuevos pasos, reordenar, activar/desactivar y configurar su visibilidad.
                </Alert>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCrearPasoProceso()}>
                Nuevo Paso
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50">Orden</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Ruta</TableCell>
                    <TableCell>Icono</TableCell>
                    <TableCell>Visible</TableCell>
                    <TableCell>Requerido</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { id: '1', nombre: 'Ficha del Proceso', ruta: '/ficha', icono: 'Description', orden: 1, visible: true, requerido: true },
                    { id: '2', nombre: 'Análisis de Proceso', ruta: '/analisis-proceso', icono: 'AccountTree', orden: 2, visible: true, requerido: false },
                    { id: '3', nombre: 'Normatividad', ruta: '/normatividad', icono: 'Description', orden: 3, visible: true, requerido: false },
                    { id: '4', nombre: 'Contexto Externo', ruta: '/contexto-externo', icono: 'Public', orden: 4, visible: true, requerido: false },
                    { id: '5', nombre: 'Contexto Interno', ruta: '/contexto-interno', icono: 'Business', orden: 5, visible: true, requerido: false },
                    { id: '6', nombre: 'DOFA', ruta: '/dofa', icono: 'Analytics', orden: 6, visible: true, requerido: false },
                    { id: '7', nombre: 'Benchmarking', ruta: '/benchmarking', icono: 'CompareArrows', orden: 7, visible: true, requerido: false },
                    { id: '8', nombre: 'Identificación', ruta: '/identificacion', icono: 'Search', orden: 8, visible: true, requerido: true },
                    { id: '9', nombre: 'Evaluación', ruta: '/evaluacion', icono: 'Assessment', orden: 9, visible: true, requerido: true },
                    { id: '10', nombre: 'Mapa de Riesgos', ruta: '/mapa', icono: 'Map', orden: 10, visible: true, requerido: true },
                    { id: '11', nombre: 'Priorización', ruta: '/priorizacion', icono: 'PriorityHigh', orden: 11, visible: true, requerido: true },
                    { id: '12', nombre: 'Plan de Acción', ruta: '/plan-accion', icono: 'Task', orden: 12, visible: true, requerido: true },
                  ].map((paso) => (
                    <TableRow key={paso.id}>
                      <TableCell>{paso.orden}</TableCell>
                      <TableCell>{paso.nombre}</TableCell>
                      <TableCell>
                        <Chip label={paso.ruta} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{paso.icono}</TableCell>
                      <TableCell>
                        <Chip
                          label={paso.visible ? 'Sí' : 'No'}
                          size="small"
                          color={paso.visible ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={paso.requerido ? 'Sí' : 'No'}
                          size="small"
                          color={paso.requerido ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => handleEditarPasoProceso(paso)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleEliminarPasoProceso(paso.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Sección: Encuestas */}
        {activeSection === 'encuestas' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Gestión de Encuestas</Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Cree y configure encuestas para la identificación de riesgos. Agregue preguntas, configure tipos de campos, validaciones y lógica condicional.
                </Alert>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCrearEncuesta()}>
                Nueva Encuesta
              </Button>
            </Box>
            <Grid2 container spacing={2}>
              {encuestas.map((encuesta) => {
                const preguntasCount = 0; // TODO: obtener de preguntasEncuesta
                return (
                  <Grid2 xs={12} md={6} key={encuesta.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6">{encuesta.nombre}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {encuesta.descripcion}
                            </Typography>
                            <Chip
                              label={`${preguntasCount} preguntas`}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                          <Chip
                            label={encuesta.activa ? 'Activa' : 'Inactiva'}
                            size="small"
                            color={encuesta.activa ? 'success' : 'default'}
                          />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditarEncuesta(encuesta)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewListIcon />}
                            onClick={() => handleVerPreguntas(encuesta.id)}
                          >
                            Ver Preguntas
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid2>
                );
              })}
            </Grid2>
          </Box>
        )}

        {/* Sección: Listas de Valores */}
        {activeSection === 'listas-valores' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Gestión de Listas de Valores</Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                Configure las listas desplegables utilizadas en los formularios del sistema (Vicepresidencias, Gerencias, Zonas, Procesos, etc.).
              </Alert>
            </Box>
            <Grid2 container spacing={2}>
              {listasValores.map((lista) => (
                <Grid2 xs={12} md={6} key={lista.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{lista.nombre}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {lista.descripcion}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Código: {lista.codigo} | {lista.valores?.length || 0} valores
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditarListaValores(lista)}
                      >
                        Editar Valores
                      </Button>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        )}

        {/* Sección: Parámetros de Valoración */}
        {activeSection === 'parametros' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Gestión de Parámetros de Valoración</Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                Configure los parámetros utilizados para la valoración de controles: Aplicabilidad, Cobertura, Facilidad de uso, Segregación, Naturaleza, Desviaciones, y sus respectivos pesos y rangos.
              </Alert>
            </Box>
            <Grid2 container spacing={2}>
              {parametrosValoracion.map((parametro) => (
                <Grid2 xs={12} md={6} key={parametro.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{parametro.nombre}</Typography>
                          <Chip label={`Peso: ${parametro.peso}`} size="small" sx={{ mt: 1 }} />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Valores ({parametro.valores?.length || 0})
                      </Typography>
                      <List dense>
                        {parametro.valores?.map((valor: string | { nombre: string; peso: number }, idx: number) => (
                          <ListItem key={idx}>
                            <ListItemText 
                              primary={typeof valor === 'string' ? valor : valor.nombre}
                              secondary={typeof valor === 'object' ? `Peso: ${valor.peso}` : ''}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditarParametro(parametro)}
                        sx={{ mt: 2 }}
                      >
                        Editar Parámetro
                      </Button>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        )}

        {/* Sección: Tipologías */}
        {activeSection === 'tipologias' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">Gestión de Tipologías de Riesgos</Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Configure las tipologías de riesgos por nivel (Nivel I, Nivel II, Nivel III-IV SO y Ambiental, Nivel III Seg. Información).
                </Alert>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCrearTipologia()}>
                Nueva Tipología
              </Button>
            </Box>
            <Grid2 container spacing={2}>
              {tipologias.map((tipologia) => (
                <Grid2 xs={12} md={6} key={tipologia.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6">{tipologia.nombre}</Typography>
                          <Chip label={`Nivel ${tipologia.nivel}`} size="small" sx={{ mt: 1 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {tipologia.categorias?.length || 0} categorías
                          </Typography>
                        </Box>
                        <Chip
                          label={tipologia.activa ? 'Activa' : 'Inactiva'}
                          size="small"
                          color={tipologia.activa ? 'success' : 'default'}
                        />
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditarTipologia(tipologia)}
                      >
                        Editar Tipología
                      </Button>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        )}

        {/* Sección: Fórmulas */}
        {activeSection === 'formulas' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Configuración de Fórmulas</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCrearFormula}>
                Nueva Fórmula
              </Button>
            </Box>
          <Grid2 container spacing={2}>
            {formulas.map((formula) => (
              <Grid2 xs={12} md={6} key={formula.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6">{formula.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {formula.descripcion}
                        </Typography>
                        <Chip label={formula.categoria} size="small" sx={{ mt: 1 }} />
                      </Box>
                      <Chip
                        label={formula.activa ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={formula.activa ? 'success' : 'default'}
                      />
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <TextField
                      fullWidth
                      label="Fórmula"
                      value={formula.formula}
                      multiline
                      rows={3}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{ readOnly: true }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditarFormula(formula)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            await updateFormula({ id: formula.id, activa: !formula.activa }).unwrap();
                            showSuccess('Estado de fórmula actualizado');
                          } catch (error) {
                            showError('Error al actualizar el estado');
                          }
                        }}
                      >
                        {formula.activa ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={async () => {
                          if (window.confirm('¿Está seguro de eliminar esta fórmula?')) {
                            try {
                              await deleteFormula(formula.id).unwrap();
                              showSuccess('Fórmula eliminada correctamente');
                            } catch (error) {
                              showError('Error al eliminar la fórmula');
                            }
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid2>
            ))}
          </Grid2>
          </Box>
        )}

        {/* Sección: Configuración de Tareas */}
        {activeSection === 'tareas' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Configuración de Tareas</Typography>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setOpenTareaConfigDialog(true)}>
                Editar Configuración
              </Button>
            </Box>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Estados Disponibles
                  </Typography>
                  <List>
                    {tareaConfig.estados.map((estado) => (
                      <ListItem key={estado}>
                        <ListItemText primary={estado} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Prioridades
                  </Typography>
                  <List>
                    {tareaConfig.prioridades.map((prioridad) => (
                      <ListItem key={prioridad}>
                        <ListItemText primary={prioridad} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuración General
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tiempo máximo de resolución: {tareaConfig.tiempoMaximoResolucion} días
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Recordatorios: {tareaConfig.recordatorios.activo ? 'Activos' : 'Inactivos'}
                  </Typography>
                  {tareaConfig.recordatorios.activo && (
                    <Typography variant="body2" color="text.secondary">
                      Días antes: {tareaConfig.recordatorios.diasAntes.join(', ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid2>
            </Grid2>
          </Box>
        )}

        {/* Sección: Configuración de Identificación y Calificación */}
        {activeSection === 'config-identificacion' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Configuración de Identificación y Calificación</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Gestione los tipos de riesgo, objetivos, frecuencias, fuentes e impactos utilizados en la página de Identificación y Calificación
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Los cambios realizados aquí afectarán directamente los desplegables disponibles en la página de Identificación y Calificación.
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              Esta funcionalidad está en desarrollo. Próximamente podrá gestionar todos los datos de configuración desde esta sección.
            </Typography>
          </Box>
        )}

        {/* Sección: Configuración de Notificaciones */}
        {activeSection === 'notificaciones' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Configuración de Notificaciones</Typography>
            </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Plantilla</TableCell>
                  <TableCell>Crear Tarea</TableCell>
                  <TableCell>Roles Destinatarios</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notificacionesConfig.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>{config.nombre}</TableCell>
                    <TableCell>
                      <Chip label={config.tipo} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {config.plantilla}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.crearTareaAutomatica ? 'Sí' : 'No'}
                        size="small"
                        color={config.crearTareaAutomatica ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {config.rolesDestinatarios.map((rol) => (
                          <Chip key={rol} label={rol} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.activa ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={config.activa ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditarNotificacionConfig(config)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        )}

        {/* Sección: Configuración del Sistema */}
        {activeSection === 'config-sistema' && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">Configuración General del Sistema</Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                Configure parámetros generales del sistema, límites, validaciones globales y configuraciones de comportamiento.
              </Alert>
            </Box>
            <Grid2 container spacing={2}>
              <Grid2 xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Límites y Validaciones
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Validar campos requeridos antes de guardar"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Permitir edición de procesos aprobados"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Requerir aprobación para cambios críticos"
                    />
                    <Divider sx={{ my: 2 }} />
                    <TextField
                      fullWidth
                      label="Límite máximo de riesgos por proceso"
                      type="number"
                      defaultValue={100}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Días para recordatorio de tareas pendientes"
                      type="number"
                      defaultValue={7}
                    />
                  </CardContent>
                </Card>
              </Grid2>
              <Grid2 xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Configuración de Exportación
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Permitir exportación a Excel"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Permitir exportación a PDF"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Incluir fórmulas en exportación"
                    />
                    <Divider sx={{ my: 2 }} />
                    <TextField
                      fullWidth
                      label="Formato de fecha por defecto"
                      defaultValue="DD/MM/YYYY"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Zona horaria"
                      defaultValue="America/Bogota"
                    />
                  </CardContent>
                </Card>
              </Grid2>
              <Grid2 xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Configuración de Seguridad
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Requerir cambio de contraseña cada 90 días"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Bloquear cuenta después de 5 intentos fallidos"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Requerir autenticación de dos factores para administradores"
                    />
                    <Divider sx={{ my: 2 }} />
                    <TextField
                      fullWidth
                      label="Tiempo de sesión inactiva (minutos)"
                      type="number"
                      defaultValue={30}
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={() => showSuccess('Configuración guardada')}>
                      Guardar Configuración
                    </Button>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          </Box>
        )}
      </Card>

      {/* Dialog: Usuario */}
      <Dialog open={openUsuarioDialog} onClose={() => setOpenUsuarioDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Usuario *"
              value={usuarioForm.username}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, username: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Nombre Completo *"
              value={usuarioForm.fullName}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, fullName: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={usuarioForm.email}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, email: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Rol *</InputLabel>
              <Select
                value={usuarioForm.role}
                label="Rol *"
                onChange={(e) => setUsuarioForm({ ...usuarioForm, role: e.target.value as UserRole })}
              >
                {roles.filter(r => r.activo).map((rol) => (
                  <MenuItem key={rol.id} value={rol.codigo}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Departamento"
              value={usuarioForm.department}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, department: e.target.value })}
            />
            <TextField
              fullWidth
              label="Cargo"
              value={usuarioForm.position}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, position: e.target.value })}
            />
            <TextField
              fullWidth
              label="Teléfono"
              value={usuarioForm.phone}
              onChange={(e) => setUsuarioForm({ ...usuarioForm, phone: e.target.value })}
            />
            {!selectedUsuario && (
              <TextField
                fullWidth
                label="Contraseña *"
                type="password"
                value={usuarioForm.password}
                onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })}
                required
                helperText="Mínimo 6 caracteres"
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={usuarioForm.activo}
                  onChange={(e) => setUsuarioForm({ ...usuarioForm, activo: e.target.checked })}
                />
              }
              label="Usuario activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsuarioDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarUsuario} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cambiar Contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Cambiar Contraseña - {selectedPasswordUsuario?.fullName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.nuevaPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, nuevaPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
              helperText="Mínimo 6 caracteres"
            />
            <TextField
              fullWidth
              label="Confirmar Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmarPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmarPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarPassword} variant="contained" startIcon={<SaveIcon />}>
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Rol */}
      <Dialog open={openRolDialog} onClose={() => setOpenRolDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRol ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Rol *"
              value={rolForm.nombre}
              onChange={(e) => setRolForm({ ...rolForm, nombre: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Código (único) *"
              value={rolForm.codigo}
              onChange={(e) => setRolForm({ ...rolForm, codigo: e.target.value })}
              helperText="Código único para identificar el rol (ej: 'auditor', 'consultor')"
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={2}
              value={rolForm.descripcion}
              onChange={(e) => setRolForm({ ...rolForm, descripcion: e.target.value })}
            />
            <Divider />
            <Typography variant="subtitle1" gutterBottom>
              Permisos
            </Typography>
            <FormGroup>
              {permisosDisponibles.map((permiso) => (
                <FormControlLabel
                  key={permiso.id}
                  control={
                    <Checkbox
                      checked={rolForm.permisos.includes(permiso.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRolForm({ ...rolForm, permisos: [...rolForm.permisos, permiso.id] });
                        } else {
                          setRolForm({ ...rolForm, permisos: rolForm.permisos.filter(p => p !== permiso.id) });
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{permiso.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {permiso.descripcion}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRolDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarRol} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Permisos de Proceso */}
      <Dialog open={openPermisoProcesoDialog} onClose={() => setOpenPermisoProcesoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configurar Permisos - {permisoProcesoForm.procesoNombre}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Roles Permitidos</InputLabel>
              <Select
                multiple
                value={permisoProcesoForm.rolesPermitidos}
                label="Roles Permitidos"
                onChange={(e) =>
                  setPermisoProcesoForm({
                    ...permisoProcesoForm,
                    rolesPermitidos: e.target.value as UserRole[],
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {roles.filter(r => r.activo).map((rol) => (
                  <MenuItem key={rol.id} value={rol.codigo}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Usuarios Permitidos</InputLabel>
              <Select
                multiple
                value={permisoProcesoForm.usuariosPermitidos}
                label="Usuarios Permitidos"
                onChange={(e) =>
                  setPermisoProcesoForm({
                    ...permisoProcesoForm,
                    usuariosPermitidos: e.target.value as string[],
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const usuario = usuarios.find(u => u.id === value);
                      return <Chip key={value} label={usuario?.fullName || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {usuarios.filter(u => u.activo).map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.fullName} ({usuario.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider />
            <Typography variant="subtitle2">Permisos Específicos</Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={permisoProcesoForm.puedeEditar}
                    onChange={(e) =>
                      setPermisoProcesoForm({ ...permisoProcesoForm, puedeEditar: e.target.checked })
                    }
                  />
                }
                label="Puede Editar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={permisoProcesoForm.puedeEliminar}
                    onChange={(e) =>
                      setPermisoProcesoForm({ ...permisoProcesoForm, puedeEliminar: e.target.checked })
                    }
                  />
                }
                label="Puede Eliminar"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={permisoProcesoForm.puedeAprobar}
                    onChange={(e) =>
                      setPermisoProcesoForm({ ...permisoProcesoForm, puedeAprobar: e.target.checked })
                    }
                  />
                }
                label="Puede Aprobar"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermisoProcesoDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarPermisosProceso} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Fórmula */}
      <Dialog open={openFormulaDialog} onClose={() => setOpenFormulaDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva/Editar Fórmula</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre *"
              value={formulaForm.nombre}
              onChange={(e) => setFormulaForm({ ...formulaForm, nombre: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={2}
              value={formulaForm.descripcion}
              onChange={(e) => setFormulaForm({ ...formulaForm, descripcion: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formulaForm.categoria}
                label="Categoría"
                onChange={(e) => setFormulaForm({ ...formulaForm, categoria: e.target.value })}
              >
                <MenuItem value="riesgo">Riesgo</MenuItem>
                <MenuItem value="impacto">Impacto</MenuItem>
                <MenuItem value="probabilidad">Probabilidad</MenuItem>
                <MenuItem value="control">Control</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Fórmula *"
              multiline
              rows={4}
              value={formulaForm.formula}
              onChange={(e) => setFormulaForm({ ...formulaForm, formula: e.target.value })}
              required
              helperText="Use variables como: impacto, probabilidad, personas, legal, etc."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formulaForm.activa}
                  onChange={(e) => setFormulaForm({ ...formulaForm, activa: e.target.checked })}
                />
              }
              label="Fórmula activa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFormulaDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarFormula} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Configuración de Tareas */}
      <Dialog open={openTareaConfigDialog} onClose={() => setOpenTareaConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configuración de Tareas</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Tiempo Máximo de Resolución (días)
              </Typography>
              <Slider
                value={tareaConfig.tiempoMaximoResolucion}
                onChange={(_, value) =>
                  setTareaConfig({ ...tareaConfig, tiempoMaximoResolucion: value as number })
                }
                min={1}
                max={90}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Recordatorios
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={tareaConfig.recordatorios.activo}
                    onChange={(e) =>
                      setTareaConfig({
                        ...tareaConfig,
                        recordatorios: { ...tareaConfig.recordatorios, activo: e.target.checked },
                      })
                    }
                  />
                }
                label="Activar recordatorios automáticos"
              />
              {tareaConfig.recordatorios.activo && (
                <TextField
                  fullWidth
                  label="Días antes del vencimiento (separados por comas)"
                  value={tareaConfig.recordatorios.diasAntes.join(', ')}
                  onChange={(e) => {
                    const dias = e.target.value
                      .split(',')
                      .map(d => parseInt(d.trim()))
                      .filter(d => !isNaN(d));
                    setTareaConfig({
                      ...tareaConfig,
                      recordatorios: { ...tareaConfig.recordatorios, diasAntes: dias },
                    });
                  }}
                  sx={{ mt: 2 }}
                  helperText="Ejemplo: 7, 3, 1"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTareaConfigDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarTareaConfig} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Asignación de Proceso */}
      <Dialog open={openAsignacionDialog} onClose={() => setOpenAsignacionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Asignación de Proceso</DialogTitle>
        <DialogContent>
          {selectedProceso && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedProceso.nombre}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Responsable (Dueño de Proceso)</InputLabel>
                <Select
                  value={asignacionForm.responsableId}
                  label="Responsable (Dueño de Proceso)"
                  onChange={(e) => {
                    const usuario = usuarios.find((u) => u.id === e.target.value);
                    setAsignacionForm({
                      ...asignacionForm,
                      responsableId: e.target.value,
                      responsableNombre: usuario?.fullName || '',
                    });
                  }}
                >
                  <MenuItem value="">
                    <em>Sin asignar</em>
                  </MenuItem>
                  {usuarios
                    .filter((u) => u.role === 'dueño_procesos' && u.activo)
                    .map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id}>
                        {usuario.fullName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Director de Procesos</InputLabel>
                <Select
                  value={asignacionForm.directorId}
                  label="Director de Procesos"
                  onChange={(e) => {
                    const usuario = usuarios.find((u) => u.id === e.target.value);
                    setAsignacionForm({
                      ...asignacionForm,
                      directorId: e.target.value,
                      directorNombre: usuario?.fullName || '',
                    });
                  }}
                >
                  <MenuItem value="">
                    <em>Sin asignar</em>
                  </MenuItem>
                  {usuarios
                    .filter((u) => u.role === 'director_procesos' && u.activo)
                    .map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id}>
                        {usuario.fullName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAsignacionDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarAsignacion} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Nueva Área */}
      <Dialog 
        open={openNuevaAreaDialog} 
        onClose={() => {
          setOpenNuevaAreaDialog(false);
          setSelectedArea(null);
          setNuevaAreaForm({ nombre: '' });
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>{selectedArea ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre del Área"
              value={nuevaAreaForm.nombre}
              onChange={(e) => setNuevaAreaForm({ nombre: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenNuevaAreaDialog(false);
            setSelectedArea(null);
            setNuevaAreaForm({ nombre: '' });
          }}>Cancelar</Button>
          <Button onClick={handleGuardarNuevaArea} variant="contained" startIcon={<SaveIcon />}>
            {selectedArea ? 'Guardar Cambios' : 'Crear Área'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Configurar Gerentes del Área */}
      <Dialog open={openAreaGerenteDialog} onClose={() => setOpenAreaGerenteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Asignar Gerentes - {areaGerenteForm.areaNombre}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Seleccione los gerentes que pueden ver y gestionar esta área.
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Gerentes</InputLabel>
              <Select
                multiple
                value={areaGerenteForm.gerentesIds}
                label="Gerentes"
                onChange={(e) =>
                  setAreaGerenteForm({
                    ...areaGerenteForm,
                    gerentesIds: e.target.value as string[],
                  })
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const gerente = usuarios.find((u) => u.id === value);
                      return <Chip key={value} label={gerente?.fullName || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {usuarios
                  .filter((u) => u.role === 'manager' && u.activo)
                  .map((gerente) => (
                    <MenuItem key={gerente.id} value={gerente.id}>
                      {gerente.fullName} ({gerente.email})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAreaGerenteDialog(false)}>Cancelar</Button>
          <Button onClick={handleGuardarAreaGerente} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Configuración de Notificaciones */}
      <Dialog open={openNotificacionConfigDialog} onClose={() => setOpenNotificacionConfigDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configuración de Notificaciones</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info">
              La configuración de notificaciones permite personalizar plantillas y reglas de envío.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotificacionConfigDialog(false)}>Cerrar</Button>
          <Button onClick={handleGuardarNotificacionConfig} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
