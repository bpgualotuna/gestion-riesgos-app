/**
 * Contexto Interno Page
 * Análisis de factores internos según análisis Excel
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
} from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { Alert, Chip } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import AppPageLayout from '../../components/layout/AppPageLayout';

interface ContextoInterno {
  financieros: string;
  gente: string;
  procesos: string;
  activosFisicos: string;
  cadenaSuministro: string;
  informacion: string;
  sistemas: string;
  proyectos: string;
  impuestos: string;
  gruposInteresInternos: string;
}

export default function ContextoInternoPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [formData, setFormData] = useState<ContextoInterno>({
    financieros: '',
    gente: '',
    procesos: '',
    activosFisicos: '',
    cadenaSuministro: '',
    informacion: '',
    sistemas: '',
    proyectos: '',
    impuestos: '',
    gruposInteresInternos: '',
  });

  useEffect(() => {
    if (procesoData && procesoData.contextos) {
      const contextoMap: any = {};
      procesoData.contextos.forEach((c: any) => {
        if (c.tipo === 'INTERNO_FINANCIEROS') contextoMap.financieros = c.descripcion;
        if (c.tipo === 'INTERNO_GENTE') contextoMap.gente = c.descripcion;
        if (c.tipo === 'INTERNO_PROCESOS') contextoMap.procesos = c.descripcion;
        if (c.tipo === 'INTERNO_ACTIVOSFISICOS') contextoMap.activosFisicos = c.descripcion;
        if (c.tipo === 'INTERNO_CADENASUMINISTRO') contextoMap.cadenaSuministro = c.descripcion;
        if (c.tipo === 'INTERNO_INFORMACION') contextoMap.informacion = c.descripcion;
        if (c.tipo === 'INTERNO_SISTEMAS') contextoMap.sistemas = c.descripcion;
        if (c.tipo === 'INTERNO_PROYECTOS') contextoMap.proyectos = c.descripcion;
        if (c.tipo === 'INTERNO_IMPUESTOS') contextoMap.impuestos = c.descripcion;
        if (c.tipo === 'INTERNO_GRUPOSINTERESINTERNOS') contextoMap.gruposInteresInternos = c.descripcion;
      });
      setFormData(prev => ({ ...prev, ...contextoMap }));
    }
  }, [procesoData]);

  const handleChange = (field: keyof ContextoInterno) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!procesoSeleccionado) return;

    const contextos = [
      { tipo: 'INTERNO_FINANCIEROS', descripcion: formData.financieros },
      { tipo: 'INTERNO_GENTE', descripcion: formData.gente },
      { tipo: 'INTERNO_PROCESOS', descripcion: formData.procesos },
      { tipo: 'INTERNO_ACTIVOSFISICOS', descripcion: formData.activosFisicos },
      { tipo: 'INTERNO_CADENASUMINISTRO', descripcion: formData.cadenaSuministro },
      { tipo: 'INTERNO_INFORMACION', descripcion: formData.informacion },
      { tipo: 'INTERNO_SISTEMAS', descripcion: formData.sistemas },
      { tipo: 'INTERNO_PROYECTOS', descripcion: formData.proyectos },
      { tipo: 'INTERNO_IMPUESTOS', descripcion: formData.impuestos },
      { tipo: 'INTERNO_GRUPOSINTERESINTERNOS', descripcion: formData.gruposInteresInternos },
    ];

    // Keep existing external context
    const existingExternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('EXTERNO_')) || [];

    try {
      await updateProceso({
        id: procesoSeleccionado.id,
        contextos: [...contextos, ...existingExternos]
      }).unwrap();
      showSuccess('Análisis de contexto interno guardado exitosamente');
    } catch (error) {
      console.error(error);
      showError('Error al guardar el contexto interno');
    }
  };

  return (
    <AppPageLayout
      title="Análisis de Contexto Interno"
      description="Análisis de factores internos de la organización que afectan el proceso"
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
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                background: '#1976d2',
                color: '#fff',
              }}
            >
              Guardar Análisis
            </Button>
          )}
        </Box>
      }
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Está en modo visualización. Solo puede ver la información.
          </Alert>
        )
      }
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        <TextField
          fullWidth
          label="Financieros"
          value={formData.financieros}
          onChange={handleChange('financieros')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Gente"
          value={formData.gente}
          onChange={handleChange('gente')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Procesos"
          value={formData.procesos}
          onChange={handleChange('procesos')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Activos Físicos"
          value={formData.activosFisicos}
          onChange={handleChange('activosFisicos')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Cadena de Suministro"
          value={formData.cadenaSuministro}
          onChange={handleChange('cadenaSuministro')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Información"
          value={formData.informacion}
          onChange={handleChange('informacion')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Sistemas"
          value={formData.sistemas}
          onChange={handleChange('sistemas')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Proyectos"
          value={formData.proyectos}
          onChange={handleChange('proyectos')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Impuestos"
          value={formData.impuestos}
          onChange={handleChange('impuestos')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Grupos de Interés Internos"
          value={formData.gruposInteresInternos}
          onChange={handleChange('gruposInteresInternos')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />
      </Box>
    </AppPageLayout>
  );
}


