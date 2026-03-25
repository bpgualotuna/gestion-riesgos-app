import { Box, Button, Tooltip } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

type Props = {
  onClick: () => void;
  /** Sin cambios sin guardar */
  disabled: boolean;
  isSaving: boolean;
};

/** Persiste solo las filas de contexto en el servidor; no modifica la matriz DOFA. */
export default function GuardarContextoButton({ onClick, disabled, isSaving }: Props) {
  return (
    <Tooltip
      title="Guarda el contexto en el proceso (sin cambiar la matriz DOFA). Para la matriz usa «Enviar a DOFA»."
      placement="bottom"
      arrow
      enterDelay={300}
    >
      <Box component="span" sx={{ display: 'inline-block' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<SaveIcon />}
          onClick={onClick}
          disabled={disabled || isSaving}
          sx={{
            fontWeight: 700,
            px: 2.5,
            borderRadius: 2,
            borderWidth: 2,
          }}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Box>
    </Tooltip>
  );
}
