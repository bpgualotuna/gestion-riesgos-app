/**
 * Página de Administración - Usuario Root
 * Gestión de procesos y asignaciones
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Settings as SettingsIcon,
  Functions as FunctionsIcon,
  Business as BusinessIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth, type User, type UserRole } from '../../../contexts/AuthContext';
import { useGetProcesosQuery, useCreateProcesoMutation, useDeleteProcesoMutation, useUpdateProcesoMutation } from '../../gestion-riesgos/api/riesgosApi';
import { useNotification } from '../../../shared/hooks/useNotification';
import type { Proceso } from '../../gestion-riesgos/types';

export default function AdminPage() {
  const { esAdmin, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { data: procesos = [], isLoading } = useGetProcesosQuery();
  const [createProceso] = useCreateProcesoMutation();
  const [deleteProceso] = useDeleteProcesoMutation();

  const [searchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  
  const [adminSection, setAdminSection] = useState<string>(() => {
    if (sectionFromUrl) {
      localStorage.setItem('adminSection', sectionFromUrl);
      return sectionFromUrl;
    }
    return localStorage.getItem('adminSection') || 'usuarios';
  });

  // Sincronizar con URL cuando cambia
  useEffect(() => {
    if (sectionFromUrl && sectionFromUrl !== adminSection) {
      setAdminSection(sectionFromUrl);
      localStorage.setItem('adminSection', sectionFromUrl);
    }
  }, [sectionFromUrl, adminSection]);

  const [openCrearProcesoDialog, setOpenCrearProcesoDialog] = useState(false);
  const [procesoEditando, setProcesoEditando] = useState<Proceso | null>(null);
  const [formDataProceso, setFormDataProceso] = useState({
    nombre: '',
    descripcion: '',
    tipoProceso: '',
    areaId: '',
    areaNombre: '',
    vicepresidencia: '',
    gerencia: '',
    subdivision: '',
    gestorValor: '',
    versionDocumento: '',
    aprobadorMatriz: '',
    fechaAprobacionMatriz: '',
  });

  // Estados para asignaciones
  const [tabValueAsignaciones, setTabValueAsignaciones] = useState(0);
  
  // Estados para configuración
  const [tabValueConfiguracion, setTabValueConfiguracion] = useState(0);
  const [frecuencias, setFrecuencias] = useState<Array<{ valor: number; etiqueta: string; descripcion: string }>>([]);
  const [impactos, setImpactos] = useState<Array<{ key: string; label: string; peso: number }>>([]);
  const [siglasOrganizacionales, setSiglasOrganizacionales] = useState<Array<{ nombre: string; sigla: string }>>([]);
  const [vicepresidenciasGerencias, setVicepresidenciasGerencias] = useState<Array<{ id: string; vicepresidencia: string; gerencia: string; subdivisiones: string[] }>>([]);
  const [formulaEspecial, setFormulaEspecial] = useState({ valorEspecial: 3.99 });
  const [openFrecuenciaDialog, setOpenFrecuenciaDialog] = useState(false);
  const [openImpactoDialog, setOpenImpactoDialog] = useState(false);
  const [openSiglaDialog, setOpenSiglaDialog] = useState(false);
  const [openVicepresidenciaDialog, setOpenVicepresidenciaDialog] = useState(false);
  const [formDataFrecuencia, setFormDataFrecuencia] = useState({ valor: 0, etiqueta: '', descripcion: '' });
  const [formDataImpacto, setFormDataImpacto] = useState({ key: '', label: '', peso: 0 });
  const [formDataSigla, setFormDataSigla] = useState<{ nombre: string; sigla: string; index?: number }>({ nombre: '', sigla: '' });
  const [formDataVicepresidencia, setFormDataVicepresidencia] = useState<{ id?: string; vicepresidencia: string; gerencia: string; subdivisiones: string[] }>({ vicepresidencia: '', gerencia: '', subdivisiones: [] });
  const [nuevaSubdivision, setNuevaSubdivision] = useState('');
  const [dialogAsignacionOpen, setDialogAsignacionOpen] = useState(false);
  const [dialogAsignacionType, setDialogAsignacionType] = useState<'responsable' | 'supervisor'>('responsable');
  const [formDataAsignacion, setFormDataAsignacion] = useState<any>({});
  const [asignacionesResponsables, setAsignacionesResponsables] = useState<any[]>([]);
  const [asignacionesSupervisores, setAsignacionesSupervisores] = useState<any[]>([]);

  // Mock de usuarios disponibles
  const USUARIOS_DISPONIBLES = [
    { id: '1', nombre: 'Katherine Chávez', email: 'katherine.chavez@comware.com', rol: 'dueño_procesos' },
    { id: '2', nombre: 'María González', email: 'maria.gonzalez@comware.com', rol: 'manager' },
    { id: '3', nombre: 'Juan Pérez', email: 'juan.perez@comware.com', rol: 'analyst' },
    { id: '5', nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@comware.com', rol: 'supervisor_riesgos' },
  ];

  // Mock de áreas disponibles
  const AREAS_DISPONIBLES = [
    { id: 'area-1', nombre: 'Gestión Financiera y Administrativa' },
    { id: 'area-2', nombre: 'Gestión de Talento Humano' },
    { id: 'area-3', nombre: 'Gestión de TI' },
    { id: 'area-4', nombre: 'Gestión Comercial' },
  ];

  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<Array<User & { password?: string; activo?: boolean }>>([]);
  const [openUsuarioDialog, setOpenUsuarioDialog] = useState(false);
  const [openVerUsuarioDialog, setOpenVerUsuarioDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User & { password?: string } | null>(null);
  const [formDataUsuario, setFormDataUsuario] = useState({
    id: '',
    username: '',
    email: '',
    fullName: '',
    role: 'analyst' as UserRole,
    department: '',
    position: '',
    phone: '',
    password: '',
    activo: true,
    vicepresidencia: '',
  });
  const [formDataPassword, setFormDataPassword] = useState({
    password: '',
    confirmPassword: '',
  });

  // Cargar usuarios desde localStorage
  const loadUsuarios = () => {
    const stored = localStorage.getItem('admin_usuarios');
    if (stored) {
      setUsuarios(JSON.parse(stored));
    } else {
      // Usuarios iniciales desde AuthContext
      const usuariosIniciales: Array<User & { password?: string; activo?: boolean }> = [
    {
      id: '1',
      username: 'dueño_procesos',
      email: 'katherine.chavez@comware.com',
      fullName: 'Katherine Chávez',
      role: 'dueño_procesos',
      department: 'Gestión de Procesos',
          position: 'Dueño de Procesos',
      phone: '+57 300 123 4567',
      activo: true,
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
        },
        {
          id: '4',
          username: 'admin',
          email: 'andres.martinez@comware.com',
          fullName: 'Andrés Martínez',
          role: 'admin',
          department: 'TI',
          position: 'Administrador',
          phone: '+57 303 456 7890',
          activo: true,
    },
    {
      id: '5',
          username: 'supervisor',
      email: 'carlos.rodriguez@comware.com',
      fullName: 'Carlos Rodríguez',
          role: 'supervisor_riesgos',
      department: 'Gestión Financiera y Administrativa',
          position: 'Supervisor de Riesgos',
      phone: '+57 304 567 8901',
      activo: true,
        },
        {
          id: '6',
          username: 'gerente_general',
          email: 'gerente.general@comware.com',
          fullName: 'Gerente General',
          role: 'gerente_general',
          department: 'Dirección General',
          position: 'Gerente General',
          phone: '+57 305 678 9012',
        activo: true,
        },
      ];
      setUsuarios(usuariosIniciales);
      localStorage.setItem('admin_usuarios', JSON.stringify(usuariosIniciales));
    }
  };

  // Guardar usuarios en localStorage
  const saveUsuarios = (nuevosUsuarios: Array<User & { password?: string; activo?: boolean }>) => {
    localStorage.setItem('admin_usuarios', JSON.stringify(nuevosUsuarios));
    setUsuarios(nuevosUsuarios);
  };

  // Cargar usuarios al montar
  useEffect(() => {
    loadUsuarios();
  }, []);

  // Escuchar cambios en adminSection desde el sidebar
  useEffect(() => {
    const handleSectionChange = () => {
      const section = localStorage.getItem('adminSection') || 'usuarios';
      setAdminSection(section);
    };
    
    window.addEventListener('adminSectionChange', handleSectionChange);
    return () => {
      window.removeEventListener('adminSectionChange', handleSectionChange);
    };
  }, []);

  // Funciones CRUD para usuarios
  const handleCrearUsuario = () => {
    setFormDataUsuario({
      id: '',
      username: '',
      email: '',
      fullName: '',
      role: 'analyst',
      department: '',
      position: '',
      phone: '',
      password: '',
      activo: true,
      vicepresidencia: '',
    });
    setOpenUsuarioDialog(true);
  };

  const handleEditarUsuario = (usuario: User & { password?: string; activo?: boolean; vicepresidencia?: string }) => {
    setFormDataUsuario({
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      fullName: usuario.fullName,
      role: usuario.role,
      department: usuario.department,
      position: usuario.position,
      phone: usuario.phone || '',
      password: '',
      activo: usuario.activo !== false,
      vicepresidencia: (usuario as any).vicepresidencia || '',
    });
    setOpenUsuarioDialog(true);
  };

  const handleVerUsuario = (usuario: User & { password?: string; activo?: boolean }) => {
    setUsuarioSeleccionado(usuario);
    setOpenVerUsuarioDialog(true);
  };

  const handleCambiarPassword = (usuario: User) => {
    setUsuarioSeleccionado(usuario);
    setFormDataPassword({ password: '', confirmPassword: '' });
    setOpenPasswordDialog(true);
  };

  const handleGuardarUsuario = () => {
    if (!formDataUsuario.username.trim() || !formDataUsuario.email.trim() || !formDataUsuario.fullName.trim()) {
      showError('Los campos Usuario, Email y Nombre Completo son requeridos');
      return;
    }

    if (!formDataUsuario.id && !formDataUsuario.password.trim()) {
      showError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (formDataUsuario.id) {
      // Editar
      const actualizados = usuarios.map((u) =>
        u.id === formDataUsuario.id
          ? {
              ...u,
              username: formDataUsuario.username,
              email: formDataUsuario.email,
              fullName: formDataUsuario.fullName,
              role: formDataUsuario.role,
              department: formDataUsuario.department,
              position: formDataUsuario.position,
              phone: formDataUsuario.phone,
              activo: formDataUsuario.activo,
              vicepresidencia: formDataUsuario.vicepresidencia,
              ...(formDataUsuario.password && { password: formDataUsuario.password }),
            }
          : u
      );
      saveUsuarios(actualizados);
      showSuccess('Usuario actualizado correctamente');
    } else {
      // Crear
      const nuevoUsuario: User & { password?: string; activo?: boolean; vicepresidencia?: string } = {
        id: `user-${Date.now()}`,
        username: formDataUsuario.username,
        email: formDataUsuario.email,
        fullName: formDataUsuario.fullName,
        role: formDataUsuario.role,
        department: formDataUsuario.department,
        position: formDataUsuario.position,
        phone: formDataUsuario.phone,
        password: formDataUsuario.password,
        activo: formDataUsuario.activo,
        vicepresidencia: formDataUsuario.vicepresidencia,
      };
      saveUsuarios([...usuarios, nuevoUsuario]);
      showSuccess('Usuario creado correctamente');
    }
    setOpenUsuarioDialog(false);
  };

  const handleEliminarUsuario = (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }
    const filtrados = usuarios.filter((u) => u.id !== id);
    saveUsuarios(filtrados);
    showSuccess('Usuario eliminado correctamente');
  };

  const handleToggleUsuario = (id: string) => {
    const actualizados = usuarios.map((u) =>
      u.id === id ? { ...u, activo: !u.activo } : u
    );
    saveUsuarios(actualizados);
    showSuccess('Estado del usuario actualizado');
  };

  const handleGuardarPassword = () => {
    if (!formDataPassword.password.trim()) {
      showError('La contraseña es requerida');
      return;
    }
    if (formDataPassword.password !== formDataPassword.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    if (usuarioSeleccionado) {
      const actualizados = usuarios.map((u) =>
        u.id === usuarioSeleccionado.id ? { ...u, password: formDataPassword.password } : u
      );
      saveUsuarios(actualizados);
      showSuccess('Contraseña actualizada correctamente');
      setOpenPasswordDialog(false);
    }
  };

  // Obtener áreas desde localStorage
  const areas = useMemo(() => {
    const stored = localStorage.getItem('admin_areas');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { id: 'area-1', nombre: 'Gestión Financiera y Administrativa', activa: true },
      { id: 'area-2', nombre: 'Gestión de Talento Humano', activa: true },
      { id: 'area-3', nombre: 'Gestión de TI', activa: true },
      { id: 'area-4', nombre: 'Gestión Comercial', activa: true },
    ];
  }, []);

  // Cargar asignaciones del localStorage
  const loadAsignaciones = () => {
    const storedResponsables = localStorage.getItem('asignaciones_responsables');
    const storedSupervisores = localStorage.getItem('asignaciones_supervisores');
    
    if (storedResponsables) {
      setAsignacionesResponsables(JSON.parse(storedResponsables));
    }
    if (storedSupervisores) {
      setAsignacionesSupervisores(JSON.parse(storedSupervisores));
    }
  };

  // Guardar asignaciones en localStorage
  const saveAsignaciones = (type: 'responsable' | 'supervisor', data: any[]) => {
    if (type === 'responsable') {
      localStorage.setItem('asignaciones_responsables', JSON.stringify(data));
      setAsignacionesResponsables(data);
    } else {
      localStorage.setItem('asignaciones_supervisores', JSON.stringify(data));
      setAsignacionesSupervisores(data);
    }
  };

  // Cargar asignaciones al montar
  useEffect(() => {
    loadAsignaciones();
  }, []);

  // Cargar configuraciones desde localStorage
  const loadConfiguraciones = () => {
    // Frecuencias
    const storedFrecuencias = localStorage.getItem('config_frecuencias');
    if (storedFrecuencias) {
      setFrecuencias(JSON.parse(storedFrecuencias));
    } else {
      const frecuenciasDefault = [
        { valor: 1, etiqueta: 'Raro', descripcion: 'mayor a anual' },
        { valor: 2, etiqueta: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
        { valor: 3, etiqueta: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
        { valor: 4, etiqueta: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
        { valor: 5, etiqueta: 'Esperado', descripcion: 'diaria o varias veces al día' },
      ];
      setFrecuencias(frecuenciasDefault);
      localStorage.setItem('config_frecuencias', JSON.stringify(frecuenciasDefault));
    }

    // Impactos
    const storedImpactos = localStorage.getItem('config_impactos');
    if (storedImpactos) {
      setImpactos(JSON.parse(storedImpactos));
    } else {
      const impactosDefault = [
        { key: 'personas', label: 'Personas', peso: 14 },
        { key: 'legal', label: 'Legal/Normativo', peso: 22 },
        { key: 'ambiental', label: 'Ambiental', peso: 22 },
        { key: 'procesos', label: 'Procesos', peso: 10 },
        { key: 'reputacion', label: 'Reputacional', peso: 10 },
        { key: 'economico', label: 'Económico', peso: 22 },
      ];
      setImpactos(impactosDefault);
      localStorage.setItem('config_impactos', JSON.stringify(impactosDefault));
    }

    // Siglas
    const storedSiglas = localStorage.getItem('config_siglas');
    if (storedSiglas) {
      setSiglasOrganizacionales(JSON.parse(storedSiglas));
    } else {
      const siglasDefault = [
        { nombre: 'Gestión Financiera y Administrativa', sigla: 'GFA' },
        { nombre: 'Gestión de Talento Humano', sigla: 'GTH' },
        { nombre: 'Gestión de TI', sigla: 'GTI' },
        { nombre: 'Gestión Comercial', sigla: 'GCO' },
      ];
      setSiglasOrganizacionales(siglasDefault);
      localStorage.setItem('config_siglas', JSON.stringify(siglasDefault));
    }

    // Fórmula especial
    const storedFormula = localStorage.getItem('config_formula_especial');
    if (storedFormula) {
      setFormulaEspecial(JSON.parse(storedFormula));
    }
  };

  useEffect(() => {
    loadConfiguraciones();
  }, []);

  // Funciones CRUD para frecuencias
  const handleCrearFrecuencia = () => {
    setFormDataFrecuencia({ valor: 0, etiqueta: '', descripcion: '' });
    setOpenFrecuenciaDialog(true);
  };

  const handleEditarFrecuencia = (freq: { valor: number; etiqueta: string; descripcion: string }) => {
    setFormDataFrecuencia(freq);
    setOpenFrecuenciaDialog(true);
  };

  const handleGuardarFrecuencia = () => {
    if (!formDataFrecuencia.etiqueta.trim() || formDataFrecuencia.valor < 1 || formDataFrecuencia.valor > 5) {
      showError('Valor debe estar entre 1 y 5, y la etiqueta es requerida');
      return;
    }
    const actualizadas = formDataFrecuencia.valor
      ? frecuencias.map((f) => (f.valor === formDataFrecuencia.valor ? formDataFrecuencia : f))
      : [...frecuencias, formDataFrecuencia];
    localStorage.setItem('config_frecuencias', JSON.stringify(actualizadas));
    setFrecuencias(actualizadas);
    showSuccess('Frecuencia guardada correctamente');
    setOpenFrecuenciaDialog(false);
  };

  // Funciones CRUD para impactos
  const handleEditarImpacto = (impacto: { key: string; label: string; peso: number }) => {
    setFormDataImpacto(impacto);
    setOpenImpactoDialog(true);
  };

  const handleGuardarImpacto = () => {
    if (formDataImpacto.peso < 0 || formDataImpacto.peso > 100) {
      showError('El porcentaje debe estar entre 0 y 100');
      return;
    }
    const actualizados = impactos.map((i) => (i.key === formDataImpacto.key ? formDataImpacto : i));
    const total = actualizados.reduce((sum, i) => sum + i.peso, 0);
    if (total !== 100) {
      showError(`La suma de porcentajes debe ser 100%. Actual: ${total}%`);
      return;
    }
    localStorage.setItem('config_impactos', JSON.stringify(actualizados));
    setImpactos(actualizados);
    showSuccess('Impacto actualizado correctamente');
    setOpenImpactoDialog(false);
  };

  // Funciones CRUD para siglas
  const handleCrearSigla = () => {
    setFormDataSigla({ nombre: '', sigla: '' });
    setOpenSiglaDialog(true);
  };

  const handleEditarSigla = (sigla: { nombre: string; sigla: string }, index: number) => {
    setFormDataSigla({ ...sigla, index });
    setOpenSiglaDialog(true);
  };

  const handleGuardarSigla = () => {
    if (!formDataSigla.nombre.trim() || !formDataSigla.sigla.trim()) {
      showError('Nombre y sigla son requeridos');
      return;
    }
    const actualizadas = (formDataSigla as any).index !== undefined
      ? siglasOrganizacionales.map((s, i) => (i === (formDataSigla as any).index ? { nombre: formDataSigla.nombre, sigla: formDataSigla.sigla } : s))
      : [...siglasOrganizacionales, { nombre: formDataSigla.nombre, sigla: formDataSigla.sigla }];
    localStorage.setItem('config_siglas', JSON.stringify(actualizadas));
    setSiglasOrganizacionales(actualizadas);
    showSuccess('Sigla guardada correctamente');
    setOpenSiglaDialog(false);
  };

  const handleEliminarSigla = (index: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta sigla?')) {
      return;
    }
    const actualizadas = siglasOrganizacionales.filter((_, i) => i !== index);
    localStorage.setItem('config_siglas', JSON.stringify(actualizadas));
    setSiglasOrganizacionales(actualizadas);
    showSuccess('Sigla eliminada correctamente');
  };

  const handleGuardarFormulaEspecial = () => {
    localStorage.setItem('config_formula_especial', JSON.stringify(formulaEspecial));
    showSuccess('Fórmula guardada correctamente');
  };

  const handleOpenAsignacionDialog = (type: 'responsable' | 'supervisor', item?: any) => {
    setDialogAsignacionType(type);
    if (item) {
      setFormDataAsignacion(item);
    } else {
      setFormDataAsignacion({});
    }
    setDialogAsignacionOpen(true);
  };

  const handleCloseAsignacionDialog = () => {
    setDialogAsignacionOpen(false);
    setFormDataAsignacion({});
  };

  const handleSaveAsignacion = () => {
    if (dialogAsignacionType === 'responsable') {
      const nuevas = formDataAsignacion.id
        ? asignacionesResponsables.map((a) => (a.id === formDataAsignacion.id ? formDataAsignacion : a))
        : [...asignacionesResponsables, { ...formDataAsignacion, id: `asig-resp-${Date.now()}` }];
      saveAsignaciones('responsable', nuevas);
    } else {
      const nuevas = formDataAsignacion.id
        ? asignacionesSupervisores.map((a) => (a.id === formDataAsignacion.id ? formDataAsignacion : a))
        : [...asignacionesSupervisores, { ...formDataAsignacion, id: `asig-sup-${Date.now()}` }];
      saveAsignaciones('supervisor', nuevas);
    }
    handleCloseAsignacionDialog();
  };

  const handleDeleteAsignacion = (id: string, type: 'responsable' | 'supervisor') => {
    if (type === 'responsable') {
      const nuevas = asignacionesResponsables.filter((a) => a.id !== id);
      saveAsignaciones('responsable', nuevas);
    } else {
      const nuevas = asignacionesSupervisores.filter((a) => a.id !== id);
      saveAsignaciones('supervisor', nuevas);
    }
  };

  const handleAbrirCrearProceso = () => {
    setProcesoEditando(null);
    setFormDataProceso({
      nombre: '',
      descripcion: '',
      tipoProceso: '',
      areaId: '',
      areaNombre: '',
      vicepresidencia: '',
      gerencia: '',
      subdivision: '',
      gestorValor: '',
      versionDocumento: '1.0',
      aprobadorMatriz: '',
      fechaAprobacionMatriz: '',
    });
    setOpenCrearProcesoDialog(true);
  };

  const handleEditarProceso = (proceso: Proceso) => {
    setProcesoEditando(proceso);
    setFormDataProceso({
      nombre: proceso.nombre,
      descripcion: proceso.descripcion || '',
      tipoProceso: proceso.tipoProceso || '',
      areaId: proceso.areaId || '',
      areaNombre: proceso.areaNombre || '',
      vicepresidencia: proceso.vicepresidencia || '',
      gerencia: proceso.gerencia || '',
      subdivision: (proceso as any).subdivision || '',
      gestorValor: (proceso as any).gestorValor || '',
      versionDocumento: (proceso as any).versionDocumento || '1.0',
      aprobadorMatriz: (proceso as any).aprobadorMatriz || '',
      fechaAprobacionMatriz: (proceso as any).fechaAprobacionMatriz || '',
    });
    setOpenCrearProcesoDialog(true);
  };

  const handleGuardarProceso = async () => {
    if (!formDataProceso.nombre.trim()) {
      showError('El nombre del proceso es requerido');
      return;
    }
    if (!formDataProceso.vicepresidencia.trim()) {
      showError('La Vicepresidencia/Gerencia Alta es requerida');
      return;
    }

    try {
      if (procesoEditando) {
        // Actualizar proceso existente
        await updateProceso({
          id: procesoEditando.id,
          nombre: formDataProceso.nombre,
          descripcion: formDataProceso.descripcion,
          tipoProceso: formDataProceso.tipoProceso || undefined,
          areaId: formDataProceso.areaId || undefined,
          vicepresidencia: formDataProceso.vicepresidencia,
          gerencia: formDataProceso.gerencia,
          ...(formDataProceso.subdivision && { subdivision: formDataProceso.subdivision }),
          ...(formDataProceso.gestorValor && { gestorValor: formDataProceso.gestorValor }),
          ...(formDataProceso.versionDocumento && { versionDocumento: formDataProceso.versionDocumento }),
          ...(formDataProceso.aprobadorMatriz && { aprobadorMatriz: formDataProceso.aprobadorMatriz }),
          ...(formDataProceso.fechaAprobacionMatriz && { fechaAprobacionMatriz: formDataProceso.fechaAprobacionMatriz }),
        } as any).unwrap();
        showSuccess('Proceso actualizado correctamente');
      } else {
        // Crear nuevo proceso
        await createProceso({
          nombre: formDataProceso.nombre,
          descripcion: formDataProceso.descripcion,
          tipoProceso: formDataProceso.tipoProceso || undefined,
          areaId: formDataProceso.areaId || undefined,
          vicepresidencia: formDataProceso.vicepresidencia,
          gerencia: formDataProceso.gerencia,
          ...(formDataProceso.subdivision && { subdivision: formDataProceso.subdivision }),
          ...(formDataProceso.gestorValor && { gestorValor: formDataProceso.gestorValor }),
          ...(formDataProceso.versionDocumento && { versionDocumento: formDataProceso.versionDocumento }),
          ...(formDataProceso.aprobadorMatriz && { aprobadorMatriz: formDataProceso.aprobadorMatriz }),
          ...(formDataProceso.fechaAprobacionMatriz && { fechaAprobacionMatriz: formDataProceso.fechaAprobacionMatriz }),
          responsableId: user?.id,
          responsableNombre: user?.fullName,
        } as any).unwrap();
        showSuccess('Proceso creado correctamente');
      }
      
      setOpenCrearProcesoDialog(false);
      setFormDataProceso({
        nombre: '',
        descripcion: '',
        tipoProceso: '',
        areaId: '',
        areaNombre: '',
        vicepresidencia: '',
        gerencia: '',
        subdivision: '',
        gestorValor: '',
        versionDocumento: '1.0',
        aprobadorMatriz: '',
        fechaAprobacionMatriz: '',
      });
      setProcesoEditando(null);
    } catch (error) {
      showError(procesoEditando ? 'Error al actualizar el proceso' : 'Error al crear el proceso');
    }
  };

  const handleEliminarProceso = async (id: string) => {
    if (!window.confirm('¿Está seguro de eliminar este proceso?')) {
      return;
    }

    try {
      await deleteProceso(id).unwrap();
      showSuccess('Proceso eliminado correctamente');
    } catch (error) {
      showError('Error al eliminar el proceso');
    }
  };

  if (!esAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Panel de Administración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestione usuarios, procesos y asignaciones
        </Typography>
      </Box>

        {/* Sección: Usuarios */}
      {adminSection === 'usuarios' && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                  Gestión de Usuarios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cree, edite y gestione usuarios del sistema
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCrearUsuario}
              >
              Nuevo Usuario
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                    <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay usuarios. Cree el primer usuario.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {usuario.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {usuario.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{usuario.email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {usuario.position}
                          </Typography>
                        </TableCell>
                    <TableCell>
                      <Chip label={usuario.role} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                          <Typography variant="body2">{usuario.department}</Typography>
                          {usuario.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {usuario.phone}
                            </Typography>
                          )}
                    </TableCell>
                    <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleVerUsuario(usuario)}
                              title="Ver detalles"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEditarUsuario(usuario)}
                              title="Editar"
                            >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCambiarPassword(usuario)}
                        title="Cambiar contraseña"
                      >
                        <LockIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleUsuario(usuario.id)}
                              title={usuario.activo !== false ? 'Desactivar' : 'Activar'}
                              color={usuario.activo !== false ? 'default' : 'success'}
                      >
                              {usuario.activo !== false ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleEliminarUsuario(usuario.id)}
                              color="error"
                              title="Eliminar"
                            >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                          </Box>
                    </TableCell>
                  </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Sección: Procesos */}
      {adminSection === 'procesos' && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                  Gestión de Procesos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                  Cargue y gestione todos los procesos del sistema
                        </Typography>
                      </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAbrirCrearProceso}
              >
                Nuevo Proceso
              </Button>
                      </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                Flujo de trabajo:
                    </Typography>
              <Typography variant="body2" component="div">
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Primero, cargue todos los procesos aquí</li>
                  <li>Luego, vaya a "Asignaciones" para asignar responsables y supervisores</li>
                </ol>
                      </Typography>
              </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : procesos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No hay procesos. Cree el primer proceso.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    procesos.map((proceso: Proceso) => (
                    <TableRow key={proceso.id}>
                      <TableCell>{proceso.nombre}</TableCell>
                      <TableCell>
                          {proceso.descripcion || (
                          <Typography variant="body2" color="text.secondary">
                              Sin descripción
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                          {proceso.tipoProceso ? (
                            <Chip label={proceso.tipoProceso} size="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {proceso.areaNombre || (
                            <Typography variant="body2" color="text.secondary">
                              Sin área
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                            label={proceso.estado || 'borrador'}
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
                            onClick={() => handleEliminarProceso(proceso.id)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Sección: Asignaciones */}
      {adminSection === 'asignaciones' && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                Gestión de Asignaciones
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asigne responsables a procesos y supervisores a áreas/procesos
              </Typography>
              </Box>

            <Tabs value={tabValueAsignaciones} onChange={(e, v) => setTabValueAsignaciones(v)} sx={{ mb: 3 }}>
              <Tab label="Responsables a Procesos" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Supervisores a Áreas/Procesos" icon={<AssignmentIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab 1: Asignación de Responsables */}
            {tabValueAsignaciones === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Asignar Responsables a Procesos</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenAsignacionDialog('responsable')}
                  >
                    Nueva Asignación
              </Button>
            </Box>

                <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                        <TableCell>Proceso</TableCell>
                        <TableCell>Responsable</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Rol</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                      {asignacionesResponsables.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No hay asignaciones. Cree una nueva asignación.
                                  </Typography>
                                </TableCell>
                        </TableRow>
                      ) : (
                        asignacionesResponsables.map((asig) => {
                          const proceso = procesos.find((p: Proceso) => p.id === asig.procesoId);
                          const usuario = USUARIOS_DISPONIBLES.find((u) => u.id === asig.responsableId);
                          return (
                            <TableRow key={asig.id}>
                              <TableCell>{proceso?.nombre || 'Proceso no encontrado'}</TableCell>
                              <TableCell>{usuario?.nombre || 'Usuario no encontrado'}</TableCell>
                              <TableCell>{usuario?.email || '-'}</TableCell>
                              <TableCell>
                                <Chip label={usuario?.rol || '-'} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton 
                                      size="small" 
                                  onClick={() => handleOpenAsignacionDialog('responsable', asig)}
                                >
                                  <EditIcon />
                                    </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAsignacion(asig.id, 'responsable')}
                                  color="error"
                                >
                                  <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                        })
                      )}
                        </TableBody>
                      </Table>
                    </TableContainer>
          </Box>
        )}

            {/* Tab 2: Asignación de Supervisores */}
            {tabValueAsignaciones === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Asignar Supervisores a Áreas/Procesos</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenAsignacionDialog('supervisor')}
                  >
                    Nueva Asignación
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Área/Proceso</TableCell>
                        <TableCell>Supervisor</TableCell>
                        <TableCell>Email</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                      {asignacionesSupervisores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No hay asignaciones. Cree una nueva asignación.
                            </Typography>
                      </TableCell>
                        </TableRow>
                      ) : (
                        asignacionesSupervisores.map((asig) => {
                          const supervisor = USUARIOS_DISPONIBLES.find((u) => u.id === asig.supervisorId);
                          const nombreAsignado =
                            asig.tipoAsignacion === 'area'
                              ? AREAS_DISPONIBLES.find((a) => a.id === asig.areaId)?.nombre
                              : procesos.find((p: Proceso) => p.id === asig.procesoId)?.nombre;
                          return (
                            <TableRow key={asig.id}>
                      <TableCell>
                        <Chip
                                  label={asig.tipoAsignacion === 'area' ? 'Área' : 'Proceso'}
                          size="small"
                                  color={asig.tipoAsignacion === 'area' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                              <TableCell>{nombreAsignado || 'No encontrado'}</TableCell>
                              <TableCell>{supervisor?.nombre || 'Usuario no encontrado'}</TableCell>
                              <TableCell>{supervisor?.email || '-'}</TableCell>
                      <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenAsignacionDialog('supervisor', asig)}
                                >
                                  <EditIcon />
                        </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAsignacion(asig.id, 'supervisor')}
                                  color="error"
                                >
                                  <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                          );
                        })
                      )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
                      </CardContent>
                    </Card>
      )}

      {/* Sección: Configuración */}
      {adminSection === 'configuracion' && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                Configuración del Sistema
                          </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure frecuencias, impactos, fórmulas y siglas organizacionales
                          </Typography>
                        </Box>

            <Tabs value={tabValueConfiguracion} onChange={(e, v) => setTabValueConfiguracion(v)} sx={{ mb: 3 }}>
              <Tab label="Frecuencias" icon={<FunctionsIcon />} iconPosition="start" />
              <Tab label="Impactos" icon={<BusinessIcon />} iconPosition="start" />
              <Tab label="Fórmulas" icon={<FunctionsIcon />} iconPosition="start" />
              <Tab label="Siglas Organizacionales" icon={<BusinessIcon />} iconPosition="start" />
              <Tab label="Vicepresidencias/Gerencias" icon={<BusinessIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab 1: Frecuencias */}
            {tabValueConfiguracion === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Configuración de Frecuencias</Typography>
                      <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCrearFrecuencia}
                  >
                    Nueva Frecuencia
                      </Button>
          </Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Configure los valores de frecuencia que se usarán en la evaluación de riesgos.
                  Los valores van del 1 (Raro) al 5 (Esperado).
              </Alert>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Valor</TableCell>
                        <TableCell>Etiqueta</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { valor: 1, etiqueta: 'Raro', descripcion: 'mayor a anual' },
                        { valor: 2, etiqueta: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
                        { valor: 3, etiqueta: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
                        { valor: 4, etiqueta: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
                        { valor: 5, etiqueta: 'Esperado', descripcion: 'diaria o varias veces al día' },
                      ].map((freq) => (
                        <TableRow key={freq.valor}>
                          <TableCell>
                            <Chip label={freq.valor} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{freq.etiqueta}</TableCell>
                          <TableCell>{freq.descripcion}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
          </Box>
        )}

            {/* Tab 2: Impactos */}
            {tabValueConfiguracion === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Configuración de Impactos</Typography>
              </Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Configure los porcentajes de peso para cada dimensión de impacto.
                  La suma de todos los porcentajes debe ser 100%.
                </Alert>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dimensión</TableCell>
                        <TableCell>Porcentaje (%)</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {impactos.map((dim) => (
                        <TableRow key={dim.key}>
                          <TableCell>{dim.label}</TableCell>
                          <TableCell>
                            <Chip label={`${dim.peso}%`} size="small" color="secondary" />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleEditarImpacto(dim)}>
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell>
                        <Chip
                            label={`${impactos.reduce((sum, i) => sum + i.peso, 0)}%`}
                          size="small"
                            color={impactos.reduce((sum, i) => sum + i.peso, 0) === 100 ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
          </Box>
        )}

            {/* Tab 3: Fórmulas */}
            {tabValueConfiguracion === 2 && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Configuración de Fórmulas</Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Configure las fórmulas de cálculo para la evaluación de riesgos.
                  </Alert>
            </Box>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Calificación Inherente por Causa
                        </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Fórmula: Si (CALIFICACION GLOBAL IMPACTO = 2 Y FRECUENCIA = 2) entonces 3.99, 
                      sino CALIFICACION GLOBAL IMPACTO × FRECUENCIA
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Valor especial cuando ambos son 2"
                        type="number"
                        value={formulaEspecial.valorEspecial}
                        onChange={(e) => setFormulaEspecial({ valorEspecial: parseFloat(e.target.value) || 3.99 })}
                      size="small"
                        inputProps={{ step: 0.01 }}
                        sx={{ width: 200 }}
                      />
                      <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardarFormulaEspecial}>
                        Guardar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
          </Box>
        )}

            {/* Tab 4: Siglas Organizacionales */}
            {tabValueConfiguracion === 3 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Siglas de Vicepresidencias/Gerencias</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCrearSigla}
                  >
                    Nueva Sigla
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 3 }}>
                  Configure las siglas para cada Vicepresidencia/Gerencia Alta.
                  Estas siglas se usarán para generar el ID automático de los riesgos (ej: 1GFA).
            </Alert>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                        <TableCell>Vicepresidencia/Gerencia Alta</TableCell>
                        <TableCell>Sigla</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                      {siglasOrganizacionales.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.nombre}</TableCell>
                    <TableCell>
                            <Chip label={item.sigla} size="small" color="primary" />
                    </TableCell>
                    <TableCell align="right">
                            <IconButton size="small" onClick={() => handleEditarSigla(item, index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleEliminarSigla(index)}>
                              <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        )}
                  </CardContent>
                </Card>
      )}

      {/* Dialog para crear/editar asignación */}
      <Dialog open={dialogAsignacionOpen} onClose={handleCloseAsignacionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAsignacionType === 'responsable' ? 'Asignar Responsable a Proceso' : 'Asignar Supervisor'}
        </DialogTitle>
        <DialogContent>
          {dialogAsignacionType === 'responsable' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
                <InputLabel>Proceso</InputLabel>
              <Select
                  value={formDataAsignacion.procesoId || ''}
                  onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, procesoId: e.target.value })}
                  label="Proceso"
                >
                  {procesos.map((p: Proceso) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
              <FormControl fullWidth>
                <InputLabel>Responsable</InputLabel>
                <Select
                  value={formDataAsignacion.responsableId || ''}
                  onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, responsableId: e.target.value })}
                  label="Responsable"
                >
                  {USUARIOS_DISPONIBLES.filter((u) => u.rol === 'dueño_procesos' || u.rol === 'manager').map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={formDataAsignacion.supervisorId || ''}
                  onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, supervisorId: e.target.value })}
                  label="Supervisor"
                >
                  {USUARIOS_DISPONIBLES.filter((u) => u.rol === 'supervisor_riesgos').map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tipo de Asignación</InputLabel>
                <Select
                  value={formDataAsignacion.tipoAsignacion || 'area'}
                  onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, tipoAsignacion: e.target.value, areaId: undefined, procesoId: undefined })}
                  label="Tipo de Asignación"
                >
                  <MenuItem value="area">Por Área</MenuItem>
                  <MenuItem value="proceso">Por Proceso</MenuItem>
                </Select>
              </FormControl>
              {formDataAsignacion.tipoAsignacion === 'area' ? (
                <FormControl fullWidth>
                  <InputLabel>Área</InputLabel>
                  <Select
                    value={formDataAsignacion.areaId || ''}
                    onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, areaId: e.target.value, procesoId: undefined })}
                    label="Área"
                  >
                    {AREAS_DISPONIBLES.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Proceso</InputLabel>
                  <Select
                    value={formDataAsignacion.procesoId || ''}
                    onChange={(e) => setFormDataAsignacion({ ...formDataAsignacion, procesoId: e.target.value, areaId: undefined })}
                    label="Proceso"
                  >
                    {procesos.map((p: Proceso) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
          </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAsignacionDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveAsignacion}
            disabled={
              dialogAsignacionType === 'responsable'
                ? !formDataAsignacion.procesoId || !formDataAsignacion.responsableId
                : !formDataAsignacion.supervisorId || (!formDataAsignacion.areaId && !formDataAsignacion.procesoId)
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear/Editar Proceso */}
      <Dialog open={openCrearProcesoDialog} onClose={() => setOpenCrearProcesoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{procesoEditando ? 'Editar Proceso' : 'Crear Nuevo Proceso'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre del Proceso"
              fullWidth
              required
              value={formDataProceso.nombre}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, nombre: e.target.value })}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formDataProceso.descripcion}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, descripcion: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Proceso</InputLabel>
              <Select
                value={formDataProceso.tipoProceso}
                onChange={(e) => setFormDataProceso({ ...formDataProceso, tipoProceso: e.target.value })}
                label="Tipo de Proceso"
              >
                <MenuItem value="01 Estratégico">01 Estratégico</MenuItem>
                <MenuItem value="02 Operacional">02 Operacional</MenuItem>
                <MenuItem value="03 Apoyo">03 Apoyo</MenuItem>
                <MenuItem value="Gerencial">Gerencial</MenuItem>
                <MenuItem value="Talento Humano">Talento Humano</MenuItem>
                <MenuItem value="Planificación Financiera">Planificación Financiera</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Nombre de la Vicepresidencia/Gerencia Alta</InputLabel>
              <Select
                value={formDataProceso.vicepresidencia}
                      onChange={(e) => {
                  const vpGer = vicepresidenciasGerencias.find((v) => v.vicepresidencia === e.target.value);
                  setFormDataProceso({
                    ...formDataProceso,
                    vicepresidencia: e.target.value,
                    gerencia: vpGer?.gerencia || '',
                    subdivision: '',
                  });
                }}
                label="Nombre de la Vicepresidencia/Gerencia Alta"
              >
                {Array.from(new Set(vicepresidenciasGerencias.map((v) => v.vicepresidencia))).map((vp) => (
                  <MenuItem key={vp} value={vp}>
                    {vp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Nombre de la Gerencia</InputLabel>
              <Select
                value={formDataProceso.gerencia}
                onChange={(e) => {
                  const vpGer = vicepresidenciasGerencias.find(
                    (v) => v.vicepresidencia === formDataProceso.vicepresidencia && v.gerencia === e.target.value
                  );
                  setFormDataProceso({
                    ...formDataProceso,
                    gerencia: e.target.value,
                    subdivision: '',
                  });
                }}
                label="Nombre de la Gerencia"
                disabled={!formDataProceso.vicepresidencia}
              >
                {vicepresidenciasGerencias
                  .filter((v) => v.vicepresidencia === formDataProceso.vicepresidencia)
                  .map((v) => (
                    <MenuItem key={v.id} value={v.gerencia}>
                      {v.gerencia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Nombre de la Subdivisión</InputLabel>
              <Select
                value={formDataProceso.subdivision}
                onChange={(e) => setFormDataProceso({ ...formDataProceso, subdivision: e.target.value })}
                label="Nombre de la Subdivisión"
                disabled={!formDataProceso.gerencia}
              >
                {vicepresidenciasGerencias
                  .find(
                    (v) =>
                      v.vicepresidencia === formDataProceso.vicepresidencia &&
                      v.gerencia === formDataProceso.gerencia
                  )
                  ?.subdivisiones.map((sub) => (
                    <MenuItem key={sub} value={sub}>
                      {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Nombre del Gestor de Valor"
              fullWidth
              value={formDataProceso.gestorValor}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, gestorValor: e.target.value })}
            />
            <TextField
              label="Versión del documento"
              fullWidth
              value={formDataProceso.versionDocumento}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, versionDocumento: e.target.value })}
              placeholder="1.0"
            />
            <TextField
              label="Nombre del aprobador de la matriz"
              fullWidth
              value={formDataProceso.aprobadorMatriz}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, aprobadorMatriz: e.target.value })}
            />
            <TextField
              label="Fecha de aprobación de la matriz"
              fullWidth
              type="date"
              value={formDataProceso.fechaAprobacionMatriz}
              onChange={(e) => setFormDataProceso({ ...formDataProceso, fechaAprobacionMatriz: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select
                value={formDataProceso.areaId}
                onChange={(e) => {
                  const area = areas.find((a: any) => a.id === e.target.value);
                  setFormDataProceso({
                    ...formDataProceso,
                    areaId: e.target.value,
                    areaNombre: area?.nombre || '',
                  });
                }}
                label="Área"
              >
                {areas.map((area: any) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCrearProcesoDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarProceso}
            disabled={!formDataProceso.nombre.trim() || !formDataProceso.vicepresidencia.trim()}
          >
            {procesoEditando ? 'Actualizar' : 'Crear'} Proceso
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear/Editar Usuario */}
      <Dialog open={openUsuarioDialog} onClose={() => setOpenUsuarioDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{formDataUsuario.id ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Usuario"
              fullWidth
              required
              value={formDataUsuario.username}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, username: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              required
              type="email"
              value={formDataUsuario.email}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, email: e.target.value })}
            />
            <TextField
              label="Nombre Completo"
              fullWidth
              required
              value={formDataUsuario.fullName}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, fullName: e.target.value })}
            />
            <FormControl fullWidth required>
              <InputLabel>Rol</InputLabel>
              <Select
                value={formDataUsuario.role}
                onChange={(e) => setFormDataUsuario({ ...formDataUsuario, role: e.target.value as UserRole })}
                label="Rol"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="analyst">Analyst</MenuItem>
                <MenuItem value="dueño_procesos">Dueño de Procesos</MenuItem>
                <MenuItem value="supervisor_riesgos">Supervisor de Riesgos</MenuItem>
                <MenuItem value="auditoria">Auditoría</MenuItem>
                <MenuItem value="gerente_general">Gerente General</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Departamento"
              fullWidth
              required
              value={formDataUsuario.department}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, department: e.target.value })}
            />
            <TextField
              label="Posición"
              fullWidth
              required
              value={formDataUsuario.position}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, position: e.target.value })}
            />
            <TextField
              label="Teléfono"
              fullWidth
              value={formDataUsuario.phone}
              onChange={(e) => setFormDataUsuario({ ...formDataUsuario, phone: e.target.value })}
            />
            {!formDataUsuario.id && (
              <TextField
                label="Contraseña"
                fullWidth
                required
                type="password"
                value={formDataUsuario.password}
                onChange={(e) => setFormDataUsuario({ ...formDataUsuario, password: e.target.value })}
              />
            )}
            {formDataUsuario.id && (
              <TextField
                label="Nueva Contraseña (opcional)"
                fullWidth
                type="password"
                value={formDataUsuario.password}
                onChange={(e) => setFormDataUsuario({ ...formDataUsuario, password: e.target.value })}
                helperText="Deje vacío para mantener la contraseña actual"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUsuarioDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarUsuario}
            disabled={
              !formDataUsuario.username.trim() ||
              !formDataUsuario.email.trim() ||
              !formDataUsuario.fullName.trim() ||
              (!formDataUsuario.id && !formDataUsuario.password.trim())
            }
          >
            {formDataUsuario.id ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Ver Usuario */}
      <Dialog open={openVerUsuarioDialog} onClose={() => setOpenVerUsuarioDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles del Usuario</DialogTitle>
        <DialogContent>
          {usuarioSeleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
                <Typography variant="caption" color="text.secondary">
                  Usuario
              </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {usuarioSeleccionado.username}
                </Typography>
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary">
                  Nombre Completo
              </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {usuarioSeleccionado.fullName}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{usuarioSeleccionado.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Rol
                </Typography>
                <Chip label={usuarioSeleccionado.role} size="small" color="primary" sx={{ mt: 0.5 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Departamento
                </Typography>
                <Typography variant="body1">{usuarioSeleccionado.department}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Posición
                </Typography>
                <Typography variant="body1">{usuarioSeleccionado.position}</Typography>
              </Box>
              {usuarioSeleccionado.phone && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Typography variant="body1">{usuarioSeleccionado.phone}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  label={(usuarioSeleccionado as any).activo !== false ? 'Activo' : 'Inactivo'}
                  size="small"
                  color={(usuarioSeleccionado as any).activo !== false ? 'success' : 'default'}
                  sx={{ mt: 0.5 }}
                />
            </Box>
          </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVerUsuarioDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cambiar Contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          {usuarioSeleccionado && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Usuario: <strong>{usuarioSeleccionado.username}</strong>
              </Typography>
              <TextField
                label="Nueva Contraseña"
                fullWidth
                required
                type="password"
                value={formDataPassword.password}
                onChange={(e) => setFormDataPassword({ ...formDataPassword, password: e.target.value })}
              />
              <TextField
                label="Confirmar Contraseña"
                fullWidth
                required
                type="password"
                value={formDataPassword.confirmPassword}
                onChange={(e) => setFormDataPassword({ ...formDataPassword, confirmPassword: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarPassword}
            disabled={
              !formDataPassword.password.trim() ||
              formDataPassword.password !== formDataPassword.confirmPassword
            }
          >
            Actualizar Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear/Editar Frecuencia */}
      <Dialog open={openFrecuenciaDialog} onClose={() => setOpenFrecuenciaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formDataFrecuencia.valor ? 'Editar Frecuencia' : 'Nueva Frecuencia'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Valor (1-5)"
              type="number"
              fullWidth
              required
              inputProps={{ min: 1, max: 5 }}
              value={formDataFrecuencia.valor || ''}
              onChange={(e) => setFormDataFrecuencia({ ...formDataFrecuencia, valor: parseInt(e.target.value) || 0 })}
            />
            <TextField
              label="Etiqueta"
              fullWidth
              required
              value={formDataFrecuencia.etiqueta}
              onChange={(e) => setFormDataFrecuencia({ ...formDataFrecuencia, etiqueta: e.target.value })}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              value={formDataFrecuencia.descripcion}
              onChange={(e) => setFormDataFrecuencia({ ...formDataFrecuencia, descripcion: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFrecuenciaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarFrecuencia}
            disabled={!formDataFrecuencia.etiqueta.trim() || formDataFrecuencia.valor < 1 || formDataFrecuencia.valor > 5}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Editar Impacto */}
      <Dialog open={openImpactoDialog} onClose={() => setOpenImpactoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Porcentaje de Impacto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Dimensión"
              fullWidth
              disabled
              value={formDataImpacto.label}
            />
            <TextField
              label="Porcentaje (%)"
              type="number"
              fullWidth
              required
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              value={formDataImpacto.peso || ''}
              onChange={(e) => setFormDataImpacto({ ...formDataImpacto, peso: parseFloat(e.target.value) || 0 })}
              helperText={`Total actual: ${impactos.reduce((sum, i) => sum + (i.key === formDataImpacto.key ? formDataImpacto.peso : i.peso), 0).toFixed(1)}%`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImpactoDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarImpacto}
            disabled={formDataImpacto.peso < 0 || formDataImpacto.peso > 100}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Crear/Editar Sigla */}
      <Dialog open={openSiglaDialog} onClose={() => setOpenSiglaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formDataSigla.index !== undefined ? 'Editar Sigla' : 'Nueva Sigla'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Vicepresidencia/Gerencia Alta"
              fullWidth
              required
              value={formDataSigla.nombre}
              onChange={(e) => setFormDataSigla({ ...formDataSigla, nombre: e.target.value })}
            />
            <TextField
              label="Sigla"
              fullWidth
              required
              value={formDataSigla.sigla}
              onChange={(e) => setFormDataSigla({ ...formDataSigla, sigla: e.target.value.toUpperCase() })}
              inputProps={{ maxLength: 10 }}
              helperText="Se usará para generar IDs de riesgos (ej: 1GFA)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSiglaDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarSigla}
            disabled={!formDataSigla.nombre.trim() || !formDataSigla.sigla.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
