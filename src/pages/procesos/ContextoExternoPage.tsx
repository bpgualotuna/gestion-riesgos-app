/**
 * Contexto Externo Page
 * Análisis de factores externos según análisis Excel
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useGetProcesoByIdQuery, useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import AppPageLayout from '../../components/layout/AppPageLayout';

interface ContextoExterno {
  economico: string;
  culturalSocial: string;
  legalRegulatorio: string;
  tecnologico: string;
  ambiental: string;
  gruposInteresExternos: string;
  otrosFactores: string;
}

export default function ContextoExternoPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useGetProcesoByIdQuery(procesoSeleccionado?.id || '', {
    skip: !procesoSeleccionado?.id
  });
  const [updateProceso] = useUpdateProcesoMutation();

  const [formData, setFormData] = useState<ContextoExterno>({
    economico: '',
    culturalSocial: '',
    legalRegulatorio: '',
    tecnologico: '',
    ambiental: '',
    gruposInteresExternos: '',
    otrosFactores: '',
  });

  useEffect(() => {
    if (procesoData && procesoData.contextos) {
      const contextoMap: any = {};
      procesoData.contextos.forEach((c: any) => {
        if (c.tipo === 'EXTERNO_ECONOMICO') contextoMap.economico = c.descripcion;
        if (c.tipo === 'EXTERNO_CULTURALSOCIAL') contextoMap.culturalSocial = c.descripcion;
        if (c.tipo === 'EXTERNO_LEGALREGULATORIO') contextoMap.legalRegulatorio = c.descripcion;
        if (c.tipo === 'EXTERNO_TECNOLOGICO') contextoMap.tecnologico = c.descripcion;
        if (c.tipo === 'EXTERNO_AMBIENTAL') contextoMap.ambiental = c.descripcion;
        if (c.tipo === 'EXTERNO_GRUPOSINTERESEXTERNOS') contextoMap.gruposInteresExternos = c.descripcion;
        if (c.tipo === 'EXTERNO_OTROSFACTORES') contextoMap.otrosFactores = c.descripcion;
      });
      setFormData(prev => ({ ...prev, ...contextoMap }));
    }
  }, [procesoData]);

  const handleChange = (field: keyof ContextoExterno) => (
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
      { tipo: 'EXTERNO_ECONOMICO', descripcion: formData.economico },
      { tipo: 'EXTERNO_CULTURALSOCIAL', descripcion: formData.culturalSocial },
      { tipo: 'EXTERNO_LEGALREGULATORIO', descripcion: formData.legalRegulatorio },
      { tipo: 'EXTERNO_TECNOLOGICO', descripcion: formData.tecnologico },
      { tipo: 'EXTERNO_AMBIENTAL', descripcion: formData.ambiental },
      { tipo: 'EXTERNO_GRUPOSINTERESEXTERNOS', descripcion: formData.gruposInteresExternos },
      { tipo: 'EXTERNO_OTROSFACTORES', descripcion: formData.otrosFactores },
    ];

    // Keep existing internal context
    const existingInternos = procesoData?.contextos?.filter((c: any) => c.tipo.startsWith('INTERNO_')) || [];

    try {
      await updateProceso({
        id: procesoSeleccionado.id,
        contextos: [...existingInternos, ...contextos]
      }).unwrap();
      showSuccess('Análisis de contexto externo guardado exitosamente');
    } catch (error) {
      console.error(error);
      showError('Error al guardar el contexto externo');
    }
  };

  return (
    <AppPageLayout
      title="Análisis de Contexto Externo"
      description="Análisis de factores externos que afectan el proceso"
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          fullWidth
          label="Económico"
          value={formData.economico}
          onChange={handleChange('economico')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Cultural y Social"
          value={formData.culturalSocial}
          onChange={handleChange('culturalSocial')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Legal/Regulatorio"
          value={formData.legalRegulatorio}
          onChange={handleChange('legalRegulatorio')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Tecnológico"
          value={formData.tecnologico}
          onChange={handleChange('tecnologico')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Ambiental"
          value={formData.ambiental}
          onChange={handleChange('ambiental')}
          disabled={isReadOnly}
          multiline
          rows={3}
          variant="outlined"
        />

        <TextField
          fullWidth
          label="Grupos de Interés Externos"
          value={formData.gruposInteresExternos}
          onChange={handleChange('gruposInteresExternos')}
          disabled={isReadOnly}
          multiline
          rows={4}
          variant="outlined"
        />

        <Box sx={{ gridColumn: { md: '1 / -1' } }}>
          <TextField
            fullWidth
            label="Otros Factores Externos"
            value={formData.otrosFactores}
            onChange={handleChange('otrosFactores')}
            disabled={isReadOnly}
            multiline
            rows={3}
            variant="outlined"
          />
        </Box>
      </Box>
    </AppPageLayout>
  );
}


