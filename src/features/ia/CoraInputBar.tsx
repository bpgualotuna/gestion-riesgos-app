import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

/** Crece con el texto; al llegar aquí aparece scroll dentro del campo. */
const MAX_ROWS = 8;

const CoraInputBar: React.FC<Props> = React.memo(({ value, onChange, onSend, disabled }) => {
  return (
    <Box
      sx={{
        borderTop: '1px solid #f1f5f9',
        pt: 1.5,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={MAX_ROWS}
          size="small"
          placeholder="Escribe tu mensaje a CORA…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          helperText={
            <Typography component="span" variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
              Enter envía · Shift+Enter nueva línea · crece hasta ~{MAX_ROWS} líneas
            </Typography>
          }
          FormHelperTextProps={{ sx: { mx: 0, mt: 0.5 } }}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 2,
              bgcolor: '#f8fafc',
              alignItems: 'flex-start',
              py: 0.75,
            },
            '& .MuiInputBase-input': {
              lineHeight: 1.45,
              resize: 'none',
            },
          }}
        />
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={onSend}
        disabled={!value.trim() || disabled}
        sx={{ minWidth: 90, textTransform: 'none', fontSize: '0.85rem', flexShrink: 0 }}
      >
        Enviar
      </Button>
    </Box>
  );
});

CoraInputBar.displayName = 'CoraInputBar';

export default CoraInputBar;

