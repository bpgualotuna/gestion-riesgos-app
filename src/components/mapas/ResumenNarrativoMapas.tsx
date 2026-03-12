import { Box, Typography } from '@mui/material';
import { colors } from '../../app/theme/colors';

interface Conteos {
  bajaron: number;
  subieron: number;
  seMantu: number;
}

interface ResumenNarrativoMapasProps {
  conteos: Conteos;
  porcentajeReduccionTotal: number;
}

export default function ResumenNarrativoMapas({ conteos, porcentajeReduccionTotal }: ResumenNarrativoMapasProps) {
  return (
    <Box
      sx={{
        p: 2.5,
        mt: 3,
        backgroundColor: '#f0f9ff',
        borderLeft: `4px solid ${colors.risk.critical.main}`,
        borderRadius: 1,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
        📈 Análisis Clave:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.95rem' }}>
        <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
          <strong>{conteos.bajaron} riesgo(s) bajaron de clasificación</strong> gracias a los controles implementados,
          mejorando la posición de riesgo.
        </Typography>
        {conteos.subieron > 0 && (
          <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, color: '#dc2626' }}>
            <strong>⚠️ {conteos.subieron} riesgo(s) subieron de clasificación</strong>, requiriendo revisión de controles
            y posibles acciones correctivas.
          </Typography>
        )}
        {conteos.seMantu > 0 && (
          <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
            <strong>{conteos.seMantu} riesgo(s) se mantuvieron</strong> en la misma clasificación entre inherente y
            residual.
          </Typography>
        )}
        <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
          <strong>Reducción promedio: {porcentajeReduccionTotal}%</strong> de los riesgos identificados gracias a la
          implementación de controles.
        </Typography>
      </Box>
    </Box>
  );
}
