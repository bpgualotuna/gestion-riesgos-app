import React from 'react';
import { Box, TextField, Button } from '@mui/material';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const CoraInputBar: React.FC<Props> = React.memo(({ value, onChange, onSend, disabled }) => {
  return (
    <Box
      sx={{
        borderTop: '1px solid #f1f5f9',
        pt: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Pregunta algo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        sx={{ '& .MuiInputBase-root': { borderRadius: 4, bgcolor: '#f8fafc' } }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={onSend}
        disabled={!value.trim() || disabled}
        sx={{ minWidth: 90, textTransform: 'none', fontSize: '0.85rem' }}
      >
        Enviar
      </Button>
    </Box>
  );
});

CoraInputBar.displayName = 'CoraInputBar';

export default CoraInputBar;

