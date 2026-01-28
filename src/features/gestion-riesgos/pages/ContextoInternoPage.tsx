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
import { Save as SaveIcon } from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';

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
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Análisis de Contexto Interno
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Análisis de factores internos de la organización que afectan el proceso
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <TextField
              fullWidth
              label="Financieros"
              value={formData.financieros}
              onChange={handleChange('financieros')}
              multiline
              rows={4}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Gente"
              value={formData.gente}
              onChange={handleChange('gente')}
              multiline
              rows={4}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Procesos"
              value={formData.procesos}
              onChange={handleChange('procesos')}
              multiline
              rows={4}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Activos Físicos"
              value={formData.activosFisicos}
              onChange={handleChange('activosFisicos')}
              multiline
              rows={4}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Cadena de Suministro"
              value={formData.cadenaSuministro}
              onChange={handleChange('cadenaSuministro')}
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Información"
              value={formData.informacion}
              onChange={handleChange('informacion')}
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Sistemas"
              value={formData.sistemas}
              onChange={handleChange('sistemas')}
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Proyectos"
              value={formData.proyectos}
              onChange={handleChange('proyectos')}
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Impuestos"
              value={formData.impuestos}
              onChange={handleChange('impuestos')}
              multiline
              rows={3}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Grupos de Interés Internos"
              value={formData.gruposInteresInternos}
              onChange={handleChange('gruposInteresInternos')}
              multiline
              rows={4}
              variant="outlined"
            />

            <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
