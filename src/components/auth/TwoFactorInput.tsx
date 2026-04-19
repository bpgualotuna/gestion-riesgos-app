import React, { useRef, useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface TwoFactorInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onCodeChange?: (code: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Componente de input para códigos de 6 dígitos (2FA)
 * Auto-focus entre campos y validación en tiempo real
 */
export const TwoFactorInput: React.FC<TwoFactorInputProps> = ({
  length = 6,
  onComplete,
  onCodeChange,
  error = false,
  helperText = '',
  disabled = false,
  autoFocus = true
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue.length > 1) {
      // Si se pega un código completo
      const digits = numericValue.slice(0, length).split('');
      const newValues = [...values];
      
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newValues[index + i] = digit;
        }
      });
      
      setValues(newValues);
      
      // Enfocar el último campo llenado o el siguiente vacío
      const nextEmptyIndex = newValues.findIndex(v => v === '');
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      
      const code = newValues.join('');
      onCodeChange?.(code);
      
      if (code.length === length) {
        onComplete(code);
      }
      
      return;
    }

    const newValues = [...values];
    newValues[index] = numericValue;
    setValues(newValues);

    const code = newValues.join('');
    onCodeChange?.(code);

    // Auto-focus al siguiente campo
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Llamar onComplete cuando se complete el código
    if (code.length === length) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: borrar y volver al campo anterior
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Flecha izquierda
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Flecha derecha
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const numericData = pastedData.replace(/[^0-9]/g, '');
    
    if (numericData) {
      const digits = numericData.slice(0, length).split('');
      const newValues = Array(length).fill('');
      
      digits.forEach((digit, i) => {
        newValues[i] = digit;
      });
      
      setValues(newValues);
      
      const code = newValues.join('');
      onCodeChange?.(code);
      
      // Enfocar el último campo
      const lastFilledIndex = digits.length - 1;
      inputRefs.current[Math.min(lastFilledIndex, length - 1)]?.focus();
      
      if (code.length === length) {
        onComplete(code);
      }
    }
  };

  const handleFocus = (index: number) => {
    // Seleccionar el contenido al enfocar
    inputRefs.current[index]?.select();
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          justifyContent: 'center',
          mb: helperText ? 1 : 0
        }}
      >
        {values.map((value, index) => (
          <TextField
            key={index}
            inputRef={(el) => (inputRefs.current[index] = el)}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            error={error}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                padding: '12px'
              },
              inputMode: 'numeric',
              pattern: '[0-9]*',
              autoComplete: 'one-time-code'
            }}
            sx={{
              width: 50,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: error ? 'error.main' : 'primary.main'
                },
                '&:hover fieldset': {
                  borderColor: error ? 'error.dark' : 'primary.dark'
                },
                '&.Mui-focused fieldset': {
                  borderColor: error ? 'error.main' : 'primary.main',
                  borderWidth: 2
                }
              }
            }}
          />
        ))}
      </Box>
      
      {helperText && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default TwoFactorInput;
