import { Paper, Typography, Box } from '@mui/material';
import {
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  CheckCircle as CheckCircleIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { colors } from '../../app/theme/colors';
import Grid2 from '../../utils/Grid2';

interface Conteos {
  bajaron: number;
  subieron: number;
  seMantu: number;
}

interface ResumenEstadisticasCardsProps {
  totalRiesgos: number;
  conteos: Conteos;
  porcentajeReduccionTotal: number;
}

export default function ResumenEstadisticasCards({
  totalRiesgos,
  conteos,
  porcentajeReduccionTotal,
}: ResumenEstadisticasCardsProps) {
  return (
    <Grid2 container spacing={2} sx={{ mb: 4 }}>
      <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.85rem' }}>
            Total Riesgos
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: colors.risk.critical.main }}>
            {totalRiesgos}
          </Typography>
        </Paper>
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <ArrowDownIcon sx={{ color: '#10b981', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Bajaron
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#10b981' }}>
            {conteos.bajaron}
          </Typography>
        </Paper>
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fce4ec' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <ArrowUpIcon sx={{ color: '#ef4444', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Subieron
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#ef4444' }}>
            {conteos.subieron}
          </Typography>
        </Paper>
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              Se Mantuvieron
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#6366f1' }}>
            {conteos.seMantu}
          </Typography>
        </Paper>
      </Grid2>
      <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <TrendingDownIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
              % Reducción
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#7c3aed' }}>
            {porcentajeReduccionTotal}%
          </Typography>
        </Paper>
      </Grid2>
    </Grid2>
  );
}
