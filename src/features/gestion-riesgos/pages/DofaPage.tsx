/**
 * DOFA Page
 * Matriz FODA (Fortalezas, Oportunidades, Debilidades, Amenazas)
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';

interface DofaItem {
  id: string;
  descripcion: string;
}

export default function DofaPage() {
  const { showSuccess } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  
  const [oportunidades, setOportunidades] = useState<DofaItem[]>([
    {
      id: '1',
      descripcion: 'Tendencia del mercado hacia modalidades de trabajo flexibles y remoto...',
    },
    {
      id: '2',
      descripcion: 'Avances tecnológicos y plataformas digitales para gestión de talento...',
    },
  ]);

  const [amenazas, setAmenazas] = useState<DofaItem[]>([
    {
      id: '1',
      descripcion: 'Alta demanda del mercado por perfiles especializados en tecnologías emergentes...',
    },
    {
      id: '2',
      descripcion: 'Rigidez del marco laboral ecuatoriano que limita la flexibilidad...',
    },
  ]);

  const [fortalezas, setFortalezas] = useState<DofaItem[]>([]);
  const [debilidades, setDebilidades] = useState<DofaItem[]>([]);

  const handleAdd = (tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades') => {
    const newItem: DofaItem = {
      id: Date.now().toString(),
      descripcion: '',
    };

    switch (tipo) {
      case 'oportunidades':
        setOportunidades([...oportunidades, newItem]);
        break;
      case 'amenazas':
        setAmenazas([...amenazas, newItem]);
        break;
      case 'fortalezas':
        setFortalezas([...fortalezas, newItem]);
        break;
      case 'debilidades':
        setDebilidades([...debilidades, newItem]);
        break;
    }
  };

  const handleChange = (
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades',
    id: string,
    value: string
  ) => {
    const updateItem = (items: DofaItem[]) =>
      items.map((item) => (item.id === id ? { ...item, descripcion: value } : item));

    switch (tipo) {
      case 'oportunidades':
        setOportunidades(updateItem(oportunidades));
        break;
      case 'amenazas':
        setAmenazas(updateItem(amenazas));
        break;
      case 'fortalezas':
        setFortalezas(updateItem(fortalezas));
        break;
      case 'debilidades':
        setDebilidades(updateItem(debilidades));
        break;
    }
  };

  const handleSave = () => {
    const dofaData = {
      oportunidades,
      amenazas,
      fortalezas,
      debilidades,
    };
    localStorage.setItem('dofa', JSON.stringify(dofaData));
    showSuccess('Matriz DOFA guardada exitosamente');
  };

  const renderDofaSection = (
    title: string,
    items: DofaItem[],
    tipo: 'oportunidades' | 'amenazas' | 'fortalezas' | 'debilidades'
  ) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleAdd(tipo)}
          sx={{
            background: '#1976d2',
            color: '#fff',
          }}
        >
          Agregar
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, index) => (
          <TextField
            key={item.id}
            fullWidth
            label={`${title} ${index + 1}`}
            value={item.descripcion}
            onChange={(e) => handleChange(tipo, item.id, e.target.value)}
            multiline
            rows={3}
            variant="outlined"
          />
        ))}
        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hay elementos registrados. Haz clic en "Agregar" para comenzar.
          </Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Matriz DOFA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          sx={{
            background: '#1976d2',
            color: '#fff',
          }}
        >
          Guardar DOFA
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Oportunidades" />
            <Tab label="Amenazas" />
            <Tab label="Fortalezas" />
            <Tab label="Debilidades" />
          </Tabs>

          {tabValue === 0 && renderDofaSection('Oportunidades', oportunidades, 'oportunidades')}
          {tabValue === 1 && renderDofaSection('Amenazas', amenazas, 'amenazas')}
          {tabValue === 2 && renderDofaSection('Fortalezas', fortalezas, 'fortalezas')}
          {tabValue === 3 && renderDofaSection('Debilidades', debilidades, 'debilidades')}
        </CardContent>
      </Card>
    </Box>
  );
}
