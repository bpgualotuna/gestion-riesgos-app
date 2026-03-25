import { Box, Button, Tooltip } from '@mui/material';
import { FactCheck as FactCheckIcon } from '@mui/icons-material';

type Props = {
  onClick: () => void;
  /** true si no hay cambios o modo solo lectura */
  disabled: boolean;
  isSaving: boolean;
};

/**
 * Añade a la matriz DOFA las características con texto que aún no figuran (y actualiza textos ya enlazados).
 * Si hay cambios sin guardar, también los persiste junto con el DOFA.
 */
export default function EnviarDofaContextoButton({ onClick, disabled, isSaving }: Props) {
  return (
    <Tooltip
      title="Envía a la matriz DOFA las filas que aún no están en el cuadrante. Si editaste sin pulsar Guardar, también se guarda aquí."
      placement="bottom"
      arrow
      enterDelay={300}
    >
      <Box component="span" sx={{ display: 'inline-block' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<FactCheckIcon />}
          onClick={onClick}
          disabled={disabled || isSaving}
          sx={{
            background: '#1976d2',
            color: '#fff',
            fontWeight: 700,
            px: 2.5,
            borderRadius: 2,
          }}
        >
          {isSaving ? 'Enviando...' : 'Enviar a DOFA'}
        </Button>
      </Box>
    </Tooltip>
  );
}
