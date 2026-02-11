import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useState } from 'react';

interface CatalogosPageProps {
  user: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CatalogosPage({ user }: CatalogosPageProps) {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Gestión de Catálogos
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Cargos" />
          <Tab label="Gerencias" />
          <Tab label="Áreas" />
          <Tab label="Tipos de Riesgo" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1">
            Módulo de Cargos en desarrollo...
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1">
            Módulo de Gerencias en desarrollo...
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1">
            Módulo de Áreas en desarrollo...
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="body1">
            Módulo de Tipos de Riesgo en desarrollo...
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}
