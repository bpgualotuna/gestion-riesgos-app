/**
 * Notificación Context
 * Solo toast (éxito/error) para mensajes. Sin tareas ni notificaciones.
 * Éxito: barra de tiempo + cierre automático o Aceptar. Error: solo Aceptar.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';

import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const SUCCESS_AUTO_CLOSE_MS = 1600;

interface NotificacionContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export const NotificacionContext = createContext<NotificacionContextType | undefined>(undefined);

export function NotificacionProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [successProgress, setSuccessProgress] = useState(0);

  const showSuccess = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnackbarMessage(message);
    setSnackbarSeverity('success');
    setSuccessProgress(0);
    setSnackbarOpen(true);
  }, []);

  const showError = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnackbarMessage(message);
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSnackbarOpen(false);
    setSuccessProgress(0);
  }, []);

  useEffect(() => {
    if (!snackbarOpen || snackbarSeverity !== 'success') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setSuccessProgress(Math.min(100, (elapsed / SUCCESS_AUTO_CLOSE_MS) * 100));
    }, 80);
    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      setSnackbarOpen(false);
      setSuccessProgress(0);
    }, SUCCESS_AUTO_CLOSE_MS);
    return () => {
      clearInterval(interval);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [snackbarOpen, snackbarSeverity]);

  return (
    <NotificacionContext.Provider value={{ showSuccess, showError }}>
      {children}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            minWidth: { xs: 280, sm: 380 },
            maxWidth: '90vw',
            '@keyframes modalEnter': {
              '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.92)' },
              '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            },
            animation: 'modalEnter 0.25s ease-out',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              border: '1px solid',
              borderColor: snackbarSeverity === 'success'
                ? theme.palette.success.main
                : theme.palette.error.main,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {snackbarSeverity === 'success' ? (
                  <CheckCircleIcon sx={{ fontSize: 32, color: theme.palette.success.main, flexShrink: 0 }} />
                ) : (
                  <ErrorOutlineIcon sx={{ fontSize: 32, color: theme.palette.error.main, flexShrink: 0 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                    {snackbarSeverity === 'success' ? 'Operación exitosa' : 'Error'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {snackbarMessage}
                  </Typography>
                </Box>
              </Box>
              {snackbarSeverity === 'success' && (
                <LinearProgress
                  variant="determinate"
                  value={successProgress}
                  sx={{
                    mt: 2,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.palette.success.light,
                    '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.success.main },
                  }}
                />
              )}
              <Button
                variant="contained"
                size="medium"
                fullWidth
                onClick={handleSnackbarClose}
                sx={{
                  mt: 3,
                  ...(snackbarSeverity === 'success'
                    ? { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }
                    : { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText }),
                }}
              >
                Aceptar
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      {snackbarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 9999,
            '@keyframes backdropIn': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
            animation: 'backdropIn 0.2s ease-out',
          }}
          onClick={snackbarSeverity === 'success' ? handleSnackbarClose : undefined}
        />
      )}
    </NotificacionContext.Provider>
  );
}

export function useNotificacion() {
  const context = useContext(NotificacionContext);
  if (context === undefined) {
    throw new Error('useNotificacion must be used within a NotificacionProvider');
  }
  return context;
}
