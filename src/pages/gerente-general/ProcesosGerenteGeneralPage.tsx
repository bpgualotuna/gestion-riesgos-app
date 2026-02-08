/**
 * Página de Procesos para Gerente General
 * Similar a ProcesosPage pero solo muestra procesos de tipo gerencial
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Add as AddIcon,
  BusinessCenter as BusinessCenterIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useGetProcesosQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import type { Proceso } from '../../types';

export default function ProcesosGerenteGeneralPage() {
  const navigate = useNavigate();
  const { esGerenteGeneral } = useAuth();
  const { data: procesos = [], isLoading } = useGetProcesosQuery();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<Proceso | null>(null);

  // Filtrar solo procesos gerenciales
  const procesosGerenciales = useMemo(() => {
    return procesos.filter((p: Proceso) => {
      const tipoProceso = (p.tipoProceso || '').toLowerCase();
      return (
        tipoProceso.includes('gerencial') ||
        tipoProceso.includes('gerencia') ||
        tipoProceso.includes('01 estratégico') ||
        tipoProceso === '01 estratégico'
      );
    });
  }, [procesos]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, proceso: Proceso) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setProcesoSeleccionado(proceso);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setProcesoSeleccionado(null);
  };

  const handleVerProceso = () => {
    if (procesoSeleccionado) {
      navigate(`${ROUTES.FICHA}?procesoId=${procesoSeleccionado.id}`);
    }
    handleMenuClose();
  };

  const handleEditarProceso = () => {
    if (procesoSeleccionado) {
      navigate(`${ROUTES.FICHA}?procesoId=${procesoSeleccionado.id}&modo=editar`);
    }
    handleMenuClose();
  };

  if (!esGerenteGeneral) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Procesos Gerenciales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de procesos de tipo gerencial
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(ROUTES.FICHA)}
        >
          Nuevo Proceso
        </Button>
      </Box>

      {isLoading ? (
        <Typography>Cargando procesos...</Typography>
      ) : procesosGerenciales.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BusinessCenterIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No hay procesos gerenciales
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Comience creando un nuevo proceso gerencial
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.FICHA)}
            >
              Crear Proceso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid2 container spacing={3}>
          {procesosGerenciales.map((proceso: Proceso) => (
            <Grid2 xs={12} sm={6} md={4} key={proceso.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  },
                }}
                onClick={() => navigate(`${ROUTES.FICHA}?procesoId=${proceso.id}`)}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <BusinessCenterIcon sx={{ fontSize: 40, color: '#1976d2', mr: 1 }} />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, proceso)}
                      sx={{ ml: 'auto' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                    {proceso.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {proceso.descripcion || 'Sin descripción'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={proceso.tipoProceso || 'Sin tipo'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={proceso.estado || 'borrador'}
                      size="small"
                      color={
                        proceso.estado === 'aprobado'
                          ? 'success'
                          : proceso.estado === 'en_revision'
                          ? 'warning'
                          : 'default'
                      }
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${ROUTES.FICHA}?procesoId=${proceso.id}`);
                      }}
                    >
                      Ver
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${ROUTES.FICHA}?procesoId=${proceso.id}&modo=editar`);
                      }}
                    >
                      Editar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      )}

      {/* Menú contextual */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleVerProceso}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          Ver Proceso
        </MenuItem>
        <MenuItem onClick={handleEditarProceso}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar Proceso
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ContentCopyIcon sx={{ mr: 1, fontSize: 20 }} />
          Duplicar Proceso
        </MenuItem>
      </Menu>
    </Box>
  );
}



