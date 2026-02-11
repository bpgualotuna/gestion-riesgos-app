/**
 * Contexto Externo Page
 * Análisis de factores externos según análisis Excel
 */

import { useState } from 'react';
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
  const { showSuccess } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [formData, setFormData] = useState<ContextoExterno>({
    economico: 'Alta demanda del mercado por perfiles especializados en tecnologías emergentes...',
    culturalSocial: 'Preferencia del sector laboral tecnológico por modalidades de trabajo flexibles...',
    legalRegulatorio: 'La compañía mantiene un proceso documental que asegura el cumplimiento...',
    tecnologico: 'Gestión del talento humano mediante plataformas innovadoras...',
    ambiental: 'N/A',
    gruposInteresExternos: 'El área de Talento Humano interactúa de manera permanente...',
    otrosFactores: 'N/A',
  });

  const handleChange = (field: keyof ContextoExterno) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSave = async () => {
    localStorage.setItem('contexto_externo', JSON.stringify(formData));
    showSuccess('Análisis de contexto externo guardado exitosamente');
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


