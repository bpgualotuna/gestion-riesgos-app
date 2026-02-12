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
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon, Edit as EditIcon, Visibility as VisibilityIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateProcesoMutation, useGetProcesosQuery, useGetGerenciasQuery } from '../../api/services/riesgosApi';
import { useEffect } from 'react';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import AppPageLayout from '../../components/layout/AppPageLayout';


interface FichaData {
  vicepresidencia: string;
  gerencia: string;
  gerenciaSigla?: string; // Sigla de la gerencia para generación de IDs en riesgos
  area: string;
  responsable: string;
  encargado: string; // Quién está a cargo del proceso
  fechaCreacion: string;
  objetivoProceso: string;
}

export default function FichaPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { esAdmin, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos, user } = useAuth();
  const [updateProceso] = useUpdateProcesoMutation();
  const { data: procesos = [] } = useGetProcesosQuery();
  const { data: gerencias = [] } = useGetGerenciasQuery();
  const { procesoId } = useParams<{ procesoId?: string }>();
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();

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

  // Obtener proceso del parámetro de ruta o del contexto
  const procesoActual = procesoId
    ? procesos.find(p => String(p.id) === String(procesoId))
    : procesoSeleccionado;

  const procesosDisponibles = useMemo(() => {
    if (esAdmin) return procesos;

    // Gerente General Director o Supervisor
    if (esGerenteGeneralDirector || esSupervisorRiesgos) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
        return false;
      });
    }

    // Gerente General Proceso
    if (esGerenteGeneralProceso) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
        return false;
      });
    }

    // Dueño de Proceso REAL
    if (user?.role === 'dueño_procesos') {
      return procesos.filter((p: any) => p.responsableId === user.id);
    }

    return procesos;
  }, [procesos, esAdmin, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, areasAsignadas, procesosAsignados, user]);

  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');

  const areasDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    procesosDisponibles.forEach((p: any) => {
      if (p.areaId) map.set(p.areaId, p.areaNombre || `Área ${p.areaId}`);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [procesosDisponibles]);

  const procesosFiltrados = useMemo(() => {
    let filtrados = procesosDisponibles;
    if (filtroArea !== 'all') {
      filtrados = filtrados.filter((p: any) => p.areaId === filtroArea);
    }
    return filtrados;
  }, [procesosDisponibles, filtroArea]);

  const procesosFiltradosUnicos = useMemo(() => {
    const map = new Map<string, any>();
    procesosFiltrados.forEach((p: any) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [procesosFiltrados]);

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

  const mostrarFiltrosProceso =
    esSupervisorRiesgos ||
    esGerenteGeneralDirector ||
    user?.role === 'supervisor' ||
    user?.role === 'gerente_general';

  // La ficha es del proceso, solo depende del modo del proceso
  const isReadOnly = modoProceso === 'visualizar';
  const isEditMode = modoProceso === 'editar';

  // Solo admin puede editar información organizacional
  const puedeEditarInfoOrganizacional = esAdmin && isEditMode;
  const puedeEditarFechaCreacion = esAdmin && isEditMode;

  // Cargar datos del proceso seleccionado
  const [formData, setFormData] = useState<FichaData>(() => {
    if (procesoActual) {
      // Extraer sigla del catálogo de gerencias si existe
      const gerenciaObj = gerencias?.find((g: any) => String(g.id) === String(procesoActual.gerencia));
      const gerenciaSigla = gerenciaObj?.sigla || '';
      
      return {
        vicepresidencia: procesoActual.vicepresidencia || '',
        gerencia: getGerenciaNombre(procesoActual.gerencia) || '',
        gerenciaSigla: gerenciaSigla,
        area: procesoActual.areaNombre || procesoActual.area?.nombre || '',
        responsable: (procesoActual as any).responsable?.nombre || '',
        encargado: (procesoActual as any).responsable?.nombre || '',
        fechaCreacion: procesoActual.createdAt ? new Date(procesoActual.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        objetivoProceso: procesoActual.objetivoProceso || '',
      };
    }
    return {
      vicepresidencia: '',
      gerencia: '',
      gerenciaSigla: '',
      area: '',
      responsable: '',
      encargado: '',
      fechaCreacion: new Date().toISOString().split('T')[0],
      objetivoProceso: '',
    };
  });

  // Actualizar formData cuando cambie el proceso seleccionado
  useEffect(() => {
    if (procesoActual) {
      // Extraer sigla del catálogo de gerencias si existe
      const gerenciaObj = gerencias?.find((g: any) => String(g.id) === String(procesoActual.gerencia));
      const gerenciaSigla = gerenciaObj?.sigla || '';
      
      setFormData({
        vicepresidencia: procesoActual.vicepresidencia || '',
        gerencia: getGerenciaNombre(procesoActual.gerencia) || '',
        gerenciaSigla: gerenciaSigla,
        area: procesoActual.areaNombre || (procesoActual as any).area?.nombre || '',
        responsable: (procesoActual as any).responsable?.nombre || '',
        encargado: (procesoActual as any).responsable?.nombre || '',
        fechaCreacion: procesoActual.createdAt ? new Date(procesoActual.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        objetivoProceso: procesoActual.objetivoProceso || '',
      });
    }
  }, [procesoActual, gerencias]);

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

      // Actualizar solo los campos editables
      await updateProceso({
        objetivoProceso: formData.objetivoProceso,
        // Solo admin puede actualizar información organizacional
        ...(puedeEditarInfoOrganizacional && {
          vicepresidencia: formData.vicepresidencia,
          gerencia: formData.gerencia,
          responsableId: formData.responsable,
        }),
      }).unwrap();

      showSuccess('Ficha del proceso guardada exitosamente');
    } catch (error: any) {
      showError(error?.data?.message || 'Error al guardar la ficha');
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
            </Button>
          </Box>
        )}
      </Box>
    </AppPageLayout>
  );
}

