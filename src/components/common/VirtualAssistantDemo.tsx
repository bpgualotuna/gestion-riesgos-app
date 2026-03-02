import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slide,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { keyframes } from '@mui/system';

const float = keyframes`
  0% { transform: translateY(0px); box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
  50% { transform: translateY(-6px); box-shadow: 0 12px 26px rgba(0,0,0,0.45); }
  100% { transform: translateY(0px); box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
`;

const pulseRing = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.6);
    opacity: 0;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
`;

const VirtualAssistantDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Pequeño recordatorio periódico "¿Necesitas ayuda? CORA IA"
  useEffect(() => {
    const interval = window.setInterval(() => {
      // Solo mostrar si el chat está cerrado
      if (!open) {
        setShowNudge(true);
        // Ocultar el mensaje después de unos segundos
        window.setTimeout(() => {
          setShowNudge(false);
        }, 6000);
      }
    }, 45000); // cada 45 segundos aprox.

    return () => {
      window.clearInterval(interval);
    };
  }, [open]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 32 },
        zIndex: (t) => t.zIndex.snackbar + 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            mb: 1.5,
            width: isMobile ? 280 : 360,
            height: isMobile ? 320 : 420,
            maxWidth: '100vw',
            borderRadius: 3,
            p: 2,
            backgroundColor: '#ffffff',
            color: '#111827',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
            <Box
              component="img"
              src="/logo-cora.png"
              alt="Asistente IA"
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'contain',
                backgroundColor: '#fff',
                p: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                Asistente CORA IA 
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Demo visual 
              </Typography>
            </Box>s
            <Chip
              size="small"
              label="Próximamente"
              sx={{
                backgroundColor: 'rgba(37,99,235,0.08)',
                color: '#1d4ed8',
                fontWeight: 600,
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              mb: 1.5,
              px: 0.25,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '80%',
                  backgroundColor: '#eff6ff',
                  borderRadius: 2,
                  borderTopLeftRadius: 0,
                  p: 1,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  Hola, soy el futuro asistente CORA IA.
                  Aquí podrás hacer preguntas sobre tus procesos y riesgos.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '82%',
                  backgroundColor: '#eff6ff',
                  borderRadius: 2,
                  borderTopLeftRadius: 0,
                  p: 1,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  En la primera versión podrá:
                </Typography>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.8rem' }}>
                  <li>Guiarte por las pantallas del sistema.</li>
                  <li>Explicar indicadores y mapas de riesgo.</li>
                </ul>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                Esta vista es solo un prototipo de interfaz. La IA se implementará en una fase posterior.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              borderTop: '1px solid #e5e7eb',
              pt: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: 36,
                borderRadius: 999,
                border: '1px dashed #d1d5db',
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                color: '#9ca3af',
                fontSize: '0.8rem',
                backgroundColor: '#f9fafb',
              }}
            >
              Próxima implementación: escribe aquí tus preguntas...
            </Box>
          </Box>
        </Paper>
      </Slide>

      <Box sx={{ pointerEvents: 'auto', position: 'relative' }}>
        {showNudge && !open && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 80,
              maxWidth: 220,
              backgroundColor: '#111827',
              color: '#f9fafb',
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              fontSize: '0.8rem',
              zIndex: 1,
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 18,
                bottom: -6,
                width: 12,
                height: 12,
                backgroundColor: '#111827',
                transform: 'rotate(45deg)',
              },
            }}
          >
            ¿Necesitas ayuda? <strong>CORA IA</strong> (demo) llega pronto.
          </Box>
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(25,118,210,0.28) 0%, rgba(25,118,210,0.05) 45%, transparent 70%)',
            animation: `${pulseRing} 2.4s ease-out infinite`,
            pointerEvents: 'none',
          }}
        />
        <Tooltip title={open ? 'Ocultar asistente' : 'Asistente IA (demo)'}>
          <IconButton
            onClick={() => setOpen((prev) => !prev)}
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
              backgroundColor: '#ffffff',
              p: 0.5,
              '&:hover': {
                transform: 'translateY(-4px) scale(1.03)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              },
              transition: 'all 0.2s ease-out',
              animation: `${float} 3s ease-in-out infinite`,
            }}
            aria-label="Asistente IA (demo)"
          >
            <Box
              component="img"
              src="/logo-cora.png"
              alt="Asistente IA"
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'contain',
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default VirtualAssistantDemo;

