/**
 * Contexto Interno Page
 * Análisis de factores internos según análisis Excel
 */

import { useState } from 'react';
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
  const { showSuccess } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [formData, setFormData] = useState<ContextoInterno>({
    financieros: 'El área de Talento Humano administra, controla y optimiza los recursos financieros...',
    gente: 'El área de Talento Humano es responsable de fortalecer las capacidades del personal...',
    procesos: 'Talento Humano cuenta con políticas y procedimientos documentados...',
    activosFisicos: 'Talento Humano coordina los procesos de asignación de espacios físicos...',
    cadenaSuministro: 'N/A',
    informacion: 'Talento Humano gestiona el control de accesos y asignación de permisos...',
    sistemas: 'Subutilización de las funcionalidades disponibles en los sistemas...',
    proyectos: 'N/A',
    impuestos: 'N/A',
    gruposInteresInternos: 'AP: El proceso de Talento Humano cuenta con personal capacitado...',
  });

  const handleChange = (field: keyof ContextoInterno) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSave = async () => {
    localStorage.setItem('contexto_interno', JSON.stringify(formData));
    showSuccess('Análisis de contexto interno guardado exitosamente');
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


