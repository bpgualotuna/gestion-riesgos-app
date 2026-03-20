import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Paper, Typography, IconButton, Skeleton } from '@mui/material';
import { History as HistoryIcon, Add as AddIcon } from '@mui/icons-material';
import { useCoraIA } from '../../hooks/useCoraIA';
import { useCoraIAContext } from '../../contexts/CoraIAContext'; // NUEVO: Contexto global
import { useAuth } from '../../contexts/AuthContext';
import CoraHistoryPanel, { CoraHistoryItem } from './CoraHistoryPanel';
import CoraMessageList from './CoraMessageList';
import CoraInputBar from './CoraInputBar';

const CoraChatWindow: React.FC = React.memo(() => {
  const {
    mensajes,
    loading,
    streaming,
    error,
    enviarStream,
    limpiar,
    cargarHistorial,
    seleccionarConversacion,
    borrar,
    renombrar,
  } = useCoraIA();
  const { screenContext } = useCoraIAContext(); // NUEVO: Obtener contexto desde provider global
  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<CoraHistoryItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchHistory = useCallback(async () => {
    const hist = await cargarHistorial();
    setHistoryList(hist);
  }, [cargarHistorial]);

  const handleToggleHistory = useCallback(async () => {
    if (!showHistory) {
      const hist = await cargarHistorial();
      setHistoryList(hist);
    }
    setShowHistory((prev) => !prev);
  }, [showHistory, cargarHistorial]);

  const handleNewConversation = useCallback(() => {
    limpiar();
    setShowHistory(false);
  }, [limpiar]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setShowHistory(false);
    await seleccionarConversacion(id);
  }, [seleccionarConversacion]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || loading) return;
    console.log('🚀🚀🚀 [CORA ENVIANDO] Mensaje:', inputValue);
    console.log('🚀🚀🚀 [CORA ENVIANDO] Contexto:', JSON.stringify(screenContext, null, 2));
    enviarStream(inputValue, screenContext || undefined); // CORREGIDO: Pasar screenContext
    setInputValue('');
  }, [inputValue, loading, enviarStream, screenContext]);

  const handleDeleteHistory = useCallback(
    async (item: CoraHistoryItem) => {
      const ok = await borrar(item.id);
      if (ok) {
        const hist = await cargarHistorial();
        setHistoryList(hist);
      }
    },
    [borrar, cargarHistorial]
  );

  const handleRenameHistory = useCallback(
    async (item: CoraHistoryItem) => {
      const nuevoTitulo = window.prompt('Nuevo título', item.title || '');
      if (!nuevoTitulo?.trim()) return;
      const ok = await renombrar(item.id, nuevoTitulo.trim());
      if (ok) {
        const hist = await cargarHistorial();
        setHistoryList(hist);
      }
    },
    [renombrar, cargarHistorial]
  );

  // Scroll al final sin bloquear el hilo principal
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = messagesEndRef.current;
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [mensajes]);

  return (
    <Paper
      elevation={6}
      sx={{
        mb: 1.5,
        width: 380,
        height: 480,
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
      {/* Cabecera */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
        <Box
          component="img"
          src="/logo-cora.png"
          alt="CORA IA"
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            CORA IA
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Conectada a Gestión de Riesgos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.25 }}>
          <IconButton
            title="Historial"
            size="small"
            onClick={handleToggleHistory}
            color={showHistory ? 'primary' : 'default'}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
          <IconButton title="Nueva conversación" size="small" onClick={handleNewConversation}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {showHistory ? (
        <CoraHistoryPanel
          items={historyList}
          searchText={searchText}
          onSearchChange={setSearchText}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteHistory}
          onRename={handleRenameHistory}
        />
      ) : (
        <>
          {loading && mensajes.length === 0 ? (
            <Box sx={{ flex: 1, px: 0.5, pt: 0.5 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          ) : (
            <>
              {mensajes.length === 0 && (
                <Box
                  sx={{
                    mt: 1,
                    mb: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#f0f7ff',
                    border: '1px solid #dbeafe',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    Hola <strong>{user?.fullName || 'Usuario'}</strong>, soy CORA. Estoy
                    lista para ayudarte con tus riesgos y procesos. ¿En qué puedo apoyarte hoy?
                  </Typography>
                </Box>
              )}
              <CoraMessageList
                mensajes={mensajes}
                loading={loading}
                streaming={streaming}
                error={error}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </>
      )}

      {!showHistory && (
        <CoraInputBar
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={loading}
        />
      )}
    </Paper>
  );
});

CoraChatWindow.displayName = 'CoraChatWindow';

export default CoraChatWindow;

