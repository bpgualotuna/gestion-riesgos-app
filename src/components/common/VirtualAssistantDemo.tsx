import React, { useState, useEffect } from 'react';
import { Box, IconButton, Slide } from '@mui/material';
import { keyframes } from '@mui/system';
import { CoraChatWindow } from '../../features/ia';

const float = keyframes`
  0% { transform: translateY(0px); box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
  50% { transform: translateY(-6px); box-shadow: 0 12px 26px rgba(0,0,0,0.45); }
  100% { transform: translateY(0px); box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
`;

const pulseRing = keyframes`
  0% { transform: scale(0.8); opacity: 0.6; }
  70% { transform: scale(1.6); opacity: 0; }
  100% { transform: scale(1.6); opacity: 0; }
`;

const VirtualAssistantDemo: React.FC = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  const handleToggleOpen = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Pequeño recordatorio periódico (no bloquea el hilo principal)
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!open) {
        setShowNudge(true);
        window.setTimeout(() => setShowNudge(false), 6000);
      }
    }, 45000);
    return () => window.clearInterval(interval);
  }, [open]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 32 },
        zIndex: 1000, // Reducido para no bloquear otros elementos de la UI
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        // No bloquear clics en el área vacía, solo en los elementos hijos
        pointerEvents: 'none',
      }}
    >
      {/* Chat siempre montado (sin mountOnEnter/unmountOnExit) para que useCoraIA y hooks se ejecuten en cada render y no cambie el número de hooks al abrir/cerrar */}
      <Slide direction="up" in={open}>
        <div style={{ display: 'inline-block', pointerEvents: 'auto' }}>
          <CoraChatWindow />
        </div>
      </Slide>

      {/* Botón flotante */}
      <Box sx={{ pointerEvents: 'auto', position: 'relative' }}>
        {showNudge && !open && (
          <Box
            sx={{
              position: 'absolute', right: 0, bottom: 85, width: 200,
              bgcolor: '#1e293b', color: 'white', p: 1, borderRadius: 2,
              boxShadow: 3, fontSize: '0.75rem', zIndex: 1,
              '&::after': {
                content: '""', position: 'absolute', right: 20, bottom: -6,
                width: 12, height: 12, bgcolor: '#1e293b', transform: 'rotate(45deg)'
              }
            }}
          >
            ¿Necesitas ayuda con tus riesgos? pregúntame.
          </Box>
        )}
        <Box sx={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          animation: `${pulseRing} 2.5s infinite`, pointerEvents: 'none'
        }} />
        <IconButton
          title="CORA IA"
          onClick={handleToggleOpen}
          sx={{
            width: 64, height: 64, bgcolor: '#fff', boxShadow: 5,
            animation: `${float} 3s ease-in-out infinite`,
            '&:hover': { transform: 'scale(1.05)' }
          }}
        >
          <Box component="img" src="/logo-cora.png" sx={{ width: '85%' }} alt="CORA IA" />
        </IconButton>
      </Box>

    </Box>
  );
});

VirtualAssistantDemo.displayName = 'VirtualAssistantDemo';

export default VirtualAssistantDemo;


