/**
 * Identificación y Calificación Page
 * Página con tres paneles: RIESGO, CAUSAS, IMPACTO
 * Basado en la imagen de referencia
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useGetRiesgosQuery } from '../api/riesgosApi';

export default function IdentificacionCalificacionPage() {
  const { procesoSeleccionado } = useProceso();
  const [riesgoSeleccionado, setRiesgoSeleccionado] = useState<any>(null);
  const [causaSeleccionada, setCausaSeleccionada] = useState<any>(null);

  const { data: riesgosData } = useGetRiesgosQuery({
    procesoId: procesoSeleccionado?.id,
    pageSize: 1000,
  });

  const riesgos = riesgosData?.data || [];

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard para ver la identificación y calificación.
        </Alert>
      </Box>
    );
  }

  // Mock de datos para el riesgo seleccionado
  const riesgoActual = riesgoSeleccionado || riesgos[0] || {
    id: '1',
    descripcion: 'Posibilidad de pérdida de la confidencialidad de la información, con el impacto en la continuidad de las operaciones, pérdidas financieras y daño a la reputación de la compañía.',
    numero: '171',
    siglaGerencia: '',
    origenRiesgo: '1 Talleres internos',
    tipoProceso: '02 Operacional',
    proceso: 'Ciberseguridad',
    consecuencia: '01 Negativa',
    tipoRiesgo: '02 Operacional',
    descripcionTipoRiesgo: 'Son aquellos riesgos relacionados con fallas en procesos, personas y/o tecnología',
    subtipo: 'sistemas',
    descripcionSubtipo: 'Es el riesgo de fallas, u otra deficiencia en las plataformas automáticas que soportan la operación diaria de la compañía (aplicaciones), y en los sistemas de infraestructura en las que ellas residen (date centers, redes, computadores, etc.)',
    objetivo: '13 Aplicar estándares de seguridad de la información',
  };

  // Mock de causas
  const causas = [
    {
      id: '1',
      descripcion: 'Ataques cibernéticos por hackers que pueden explotar vulnerabilidades en los sistemas para acceder a',
      fuente: 'Personas',
      frecuencia: 'Probable',
    },
    {
      id: '2',
      descripcion: 'Robo, daño, modificación o sustracción de información por accesos no autorizados.',
      fuente: 'Personas',
      frecuencia: 'Esperado',
    },
    {
      id: '3',
      descripcion: 'Por errores humanos al compartir información confidencial a través de correos electrónicos, uso inadecuado',
      fuente: 'Personas',
      frecuencia: 'Esperado',
      seleccionada: true,
    },
    {
      id: '4',
      descripcion: 'Por falta de garantías de seguridades de la información por los proveedores de los sistemas que',
      fuente: 'Externos',
      frecuencia: 'Probable',
    },
    {
      id: '5',
      descripcion: 'Por falta de estrategias de gestión de nuevos proyectos que incluya la seguridad de la información.',
      fuente: 'Externos',
      frecuencia: 'Probable',
    },
  ];

  // Mock de impactos
  const impactos = [
    { tipo: 'Impacto económico', valor: 4, descripcion: 'Variación (+ ó -) en los recursos financieros de hasta $85,9K USD' },
    { tipo: 'Procesos', valor: 5, descripcion: 'Impacto importante en el tiempo de ejecución del proceso (mayor a 2 días). Mayoría de clientes con Impacto que se van (-) y/o vienen (+) de la competencia.' },
    { tipo: 'Legal', valor: 4, descripcion: 'Junta Directiva y representantes legales resultan con antecedentes judiciales o administrativos que afectan las decisiones de la operación o el negocio. (-)' },
    { tipo: 'Confidencialidad SGSI', valor: 1, descripcion: 'El activo de información no se encuentra expuesto a acceso no autorizado' },
    { tipo: 'Reputación', valor: 3, descripcion: 'El hecho afecta (+ ó -) la confianza y credibilidad de varios grupos de interés clave para la compañía. El hecho es conocido por empresas del sector.' },
    { tipo: 'Disponibilidad SGSI', valor: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a' },
    { tipo: 'Personas', valor: 1, descripcion: '-Lesión Leve (Primeros auxilios dentro de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-)' },
    { tipo: 'Integridad SGSI', valor: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a' },
    { tipo: 'Ambiental', valor: 1, descripcion: 'Sin afectación ambiental. Sin modificaciones en el ambiente' },
  ];

  return (
    <Box>
      {/* Header con navegación */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#1976d2' }}>
          IDENTIFICACIÓN Y CALIFICACIÓN
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton>
            <ChevronRightIcon />
          </IconButton>
          <IconButton>
            <AddIcon />
          </IconButton>
          <IconButton>
            <FolderIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tres paneles principales */}
      <Grid2 container spacing={3}>
        {/* Panel RIESGO */}
        <Grid2 xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1976d2' }}>
                RIESGO
              </Typography>

              {/* Descripción del riesgo */}
              <Typography variant="body2" paragraph sx={{ mb: 3 }}>
                {riesgoActual.descripcion}
              </Typography>

              {/* Campos del formulario */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Origen del riesgo</InputLabel>
                  <Select value={riesgoActual.origenRiesgo || ''} label="Origen del riesgo">
                    <MenuItem value="1 Talleres internos">1 Talleres internos</MenuItem>
                    <MenuItem value="2 Auditoría HHI">2 Auditoría HHI</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="# Identificación"
                  value={`R${riesgoActual.numero || ''}`}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Proceso</InputLabel>
                  <Select value={riesgoActual.tipoProceso || ''} label="Tipo de Proceso">
                    <MenuItem value="01 Estratégico">01 Estratégico</MenuItem>
                    <MenuItem value="02 Operacional">02 Operacional</MenuItem>
                    <MenuItem value="03 Apoyo">03 Apoyo</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Proceso</InputLabel>
                  <Select value={riesgoActual.proceso || ''} label="Proceso">
                    <MenuItem value="Ciberseguridad">Ciberseguridad</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Consecuencia</InputLabel>
                  <Select value={riesgoActual.consecuencia || ''} label="Consecuencia">
                    <MenuItem value="01 Negativa">01 Negativa</MenuItem>
                    <MenuItem value="02 Positiva">02 Positiva</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Riesgo</InputLabel>
                  <Select value={riesgoActual.tipoRiesgo || ''} label="Tipo de Riesgo">
                    <MenuItem value="01 Estratégico">01 Estratégico</MenuItem>
                    <MenuItem value="02 Operacional">02 Operacional</MenuItem>
                    <MenuItem value="03 Financiero">03 Financiero</MenuItem>
                    <MenuItem value="04 Cumplimiento">04 Cumplimiento</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  {riesgoActual.descripcionTipoRiesgo}
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Subtipo"
                  value={riesgoActual.subtipo || ''}
                />

                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  {riesgoActual.descripcionSubtipo}
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  label="Objetivo"
                  value={riesgoActual.objetivo || ''}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Panel CAUSAS */}
        <Grid2 xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1976d2' }}>
                CAUSAS
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Causa</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fuente</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Frecuencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {causas.map((causa) => (
                      <TableRow
                        key={causa.id}
                        selected={causa.seleccionada}
                        sx={{
                          backgroundColor: causa.seleccionada ? 'rgba(255, 235, 59, 0.3)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                          cursor: 'pointer',
                        }}
                        onClick={() => setCausaSeleccionada(causa)}
                      >
                        <TableCell>{causa.descripcion}</TableCell>
                        <TableCell>
                          <Chip label={causa.fuente} size="small" />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={causa.frecuencia}
                              sx={{
                                border: causa.seleccionada ? '2px solid red' : 'none',
                              }}
                            >
                              <MenuItem value="Muy Baja">Muy Baja</MenuItem>
                              <MenuItem value="Baja">Baja</MenuItem>
                              <MenuItem value="Moderada">Moderada</MenuItem>
                              <MenuItem value="Alta">Alta</MenuItem>
                              <MenuItem value="Muy Alta">Muy Alta</MenuItem>
                              <MenuItem value="Probable">Probable</MenuItem>
                              <MenuItem value="Esperado">Esperado</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Agregar Causa
              </Button>
            </CardContent>
          </Card>
        </Grid2>

        {/* Panel IMPACTO */}
        <Grid2 xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2, color: '#1976d2' }}>
                IMPACTO
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {impactos.map((impacto, index) => (
                  <Box key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {impacto.tipo}
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select value={impacto.valor}>
                          <MenuItem value={1}>1</MenuItem>
                          <MenuItem value={2}>2</MenuItem>
                          <MenuItem value={3}>3</MenuItem>
                          <MenuItem value={4}>4</MenuItem>
                          <MenuItem value={5}>5</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {impacto.descripcion}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}

