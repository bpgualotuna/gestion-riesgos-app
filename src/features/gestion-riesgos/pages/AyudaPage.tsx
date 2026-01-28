/**
 * Ayuda/Introducción Page - Modern Design
 * Documentación e instrucciones según análisis Excel
 */

import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  Paper,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  PriorityHigh as PriorityIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  AccountTree as AccountTreeIcon,
  CompareArrows as CompareArrowsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const secciones = [
  {
    title: '1. Ficha del Proceso',
    icon: <DescriptionIcon />,
    description: 'Formulario de diligenciamiento obligatorio con información básica del proceso. Incluye datos de la vicepresidencia, gerencia, responsable y objetivos.',
  },
  {
    title: '2. Inventario de Normatividad',
    icon: <DescriptionIcon />,
    description: 'Catálogo de normativas aplicables al proceso de Talento Humano. Permite registrar el estado, cumplimiento y riesgos asociados a cada normativa.',
  },
  {
    title: '3. Identificación de Riesgos',
    icon: <SearchIcon />,
    description: 'Registro y catalogación de riesgos identificados para el proceso. Incluye clasificación, tipologías, causas y fuentes de riesgo.',
  },
  {
    title: '4. Evaluación de Riesgos',
    icon: <AssessmentIcon />,
    description: 'Evaluación y calificación de cada riesgo identificado, incluyendo cálculo de impacto, probabilidad y riesgo inherente/residual. Los cálculos se realizan automáticamente según las fórmulas establecidas.',
  },
  {
    title: '5. Mapa de Riesgos',
    icon: <MapIcon />,
    description: 'Visualización matricial de riesgos (Probabilidad vs Impacto). Matriz de 5x5 para consecuencias negativas y positivas.',
  },
  {
    title: '6. Priorización y Respuesta',
    icon: <PriorityIcon />,
    description: 'Priorización de riesgos evaluados y definición de respuestas estratégicas. Permite asignar responsables y establecer acciones de mitigación.',
  },
  {
    title: 'Análisis de Contexto',
    icon: <PublicIcon />,
    description: 'Análisis de factores externos e internos que afectan el proceso. Incluye análisis económico, tecnológico, legal, ambiental y otros factores relevantes.',
  },
  {
    title: 'Matriz DOFA',
    icon: <AnalyticsIcon />,
    description: 'Análisis FODA (Fortalezas, Oportunidades, Debilidades y Amenazas). Permite identificar y documentar los elementos clave del análisis estratégico.',
  },
];

export default function AyudaPage() {
  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight={700}
          sx={{
            color: '#1976d2',
            fontWeight: 700,
          }}
        >
          Introducción y Ayuda
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Herramienta de Gestión de Riesgo Talento Humano V1
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Info Card */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: '#F5F5F5',
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InfoIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Información del Sistema
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <List>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Código:
                        </Typography>
                        <Chip label="HHC-FO-CI&R-03" size="small" />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Versión:
                        </Typography>
                        <Chip label="01" size="small" color="primary" />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          Emisión:
                        </Typography>
                        <Typography variant="body2">26/05/2017</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Sections Card */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                background: '#F5F5F5',
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccountTreeIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Secciones del Sistema
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              {secciones.map((seccion, index) => (
                <Accordion
                  key={index}
                  elevation={0}
                  sx={{
                    '&:before': { display: 'none' },
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#C8D900' }} />}
                    sx={{
                      px: 3,
                      py: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: 'rgba(25, 118, 210, 0.1)',
                          color: '#C8D900',
                        }}
                      >
                        {seccion.icon}
                      </Box>
                      <Typography fontWeight={600}>{seccion.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {seccion.description}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions Card */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              mt: 2,
            }}
          >
            <Box
              sx={{
                background: '#F5F5F5',
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Instrucciones de Uso
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {[
                  { step: 1, text: 'Complete la Ficha del Proceso', subtext: 'Información básica requerida para el sistema' },
                  { step: 2, text: 'Registre las Normatividades Aplicables', subtext: 'Catálogo de regulaciones y su estado de cumplimiento' },
                  { step: 3, text: 'Identifique los Riesgos', subtext: 'Registro detallado de todos los riesgos del proceso' },
                  { step: 4, text: 'Evalúe cada Riesgo', subtext: 'Calificación de impactos y probabilidades (cálculos automáticos)' },
                  { step: 5, text: 'Visualice el Mapa de Riesgos', subtext: 'Matriz de probabilidad vs impacto' },
                  { step: 6, text: 'Priorice y Asigne Respuestas', subtext: 'Definición de estrategias y responsables' },
                ].map((item) => (
                  <Grid item xs={12} md={6} key={item.step}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: '#C8D900',
                          backgroundColor: 'rgba(200, 217, 0, 0.03)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                        <Chip
                          label={item.step}
                          size="small"
                          sx={{
                            background: '#1976d2',
                            color: '#fff',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: 32,
                            height: 32,
                          }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            {item.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.subtext}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
