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
  Grid,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';

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
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Análisis de Contexto Externo
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Análisis de factores externos que afectan el proceso de Talento Humano
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Económico"
                value={formData.economico}
                onChange={handleChange('economico')}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cultural y Social"
                value={formData.culturalSocial}
                onChange={handleChange('culturalSocial')}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Legal/Regulatorio"
                value={formData.legalRegulatorio}
                onChange={handleChange('legalRegulatorio')}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tecnológico"
                value={formData.tecnologico}
                onChange={handleChange('tecnologico')}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ambiental"
                value={formData.ambiental}
                onChange={handleChange('ambiental')}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Grupos de Interés Externos"
                value={formData.gruposInteresExternos}
                onChange={handleChange('gruposInteresExternos')}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Otros Factores Externos"
                value={formData.otrosFactores}
                onChange={handleChange('otrosFactores')}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

