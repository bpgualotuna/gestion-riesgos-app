import React, { useEffect, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Box, Paper, Typography, IconButton, Skeleton } from '@mui/material';
import { History as HistoryIcon, Add as AddIcon } from '@mui/icons-material';
import { useCoraIA } from '../../hooks/useCoraIA';
import { useCoraIAContext } from '../../contexts/CoraIAContext'; // NUEVO: Contexto global
import { useAuth } from '../../contexts/AuthContext';
import { swalConfirmEliminacion, swalExitoEliminacion } from '../../lib/swal';
import CoraHistoryPanel, { CoraHistoryItem } from './CoraHistoryPanel';
import CoraMessageList from './CoraMessageList';
import CoraInputBar from './CoraInputBar';
import { mergeCoraScreenContext } from '../../utils/coraScreenNavigation';

const CoraChatWindow: React.FC = React.memo(() => {
  const {
    conversationId,
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
    sincronizarSaludoNombre,
  } = useCoraIA();
  const { screenContext } = useCoraIAContext(); // NUEVO: Obtener contexto desde provider global
  const { pathname } = useLocation();
  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<CoraHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleToggleHistory = useCallback(() => {
    if (!showHistory) {
      setHistoryLoading(true);
      cargarHistorial()
        .then(setHistoryList)
        .catch(() => setHistoryList([]))
        .finally(() => setHistoryLoading(false));
    }
    setShowHistory((prev) => !prev);
  }, [showHistory, cargarHistorial]);

  const nombreCora = user?.fullName?.trim() || 'Usuario';

  const handleNewConversation = useCallback(() => {
    limpiar(nombreCora);
    setShowHistory(false);
  }, [limpiar, nombreCora]);

  /** Chat nuevo sin conversación en servidor: asegura el saludo como primer mensaje del hilo. */
  useEffect(() => {
    if (loading || streaming) return;
    if (conversationId !== undefined && conversationId !== '') return;
    if (mensajes.length > 0) return;
    limpiar(nombreCora);
  }, [loading, streaming, conversationId, mensajes.length, nombreCora, limpiar]);

  useEffect(() => {
    const n = user?.fullName?.trim();
    if (!n) return;
    sincronizarSaludoNombre(n);
  }, [user?.fullName, sincronizarSaludoNombre]);

  const handleSelectConversation = useCallback(async (id: string) => {
    flushSync(() => {
      setShowHistory(false);
    });
    await seleccionarConversacion(id);
  }, [seleccionarConversacion]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || loading || streaming) return;
    const ctxMerged = mergeCoraScreenContext(pathname, screenContext);
    enviarStream(inputValue, ctxMerged);
    setInputValue('');
  }, [inputValue, loading, streaming, enviarStream, screenContext, pathname]);

  const handleDeleteHistory = useCallback(
    async (item: CoraHistoryItem) => {
      const confirmDelete = await swalConfirmEliminacion(`la conversación "${item.title || 'sin título'}"`);
      if (!confirmDelete) return;
      const ok = await borrar(item.id);
      if (ok) {
        const hist = await cargarHistorial();
        setHistoryList(hist);
        await swalExitoEliminacion('La conversación se eliminó correctamente.');
      }
    },
    [borrar, cargarHistorial]
  );

  const handleDeleteManyHistory = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return false;
      const confirmDelete = await swalConfirmEliminacion(`${ids.length} conversación(es)`);
      if (!confirmDelete) return false;

      const results = await Promise.allSettled(ids.map((id) => borrar(id)));
      const okCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
      if (okCount > 0) {
        const hist = await cargarHistorial();
        setHistoryList(hist);
        await swalExitoEliminacion(
          okCount === ids.length
            ? `Se eliminaron ${okCount} conversación(es) correctamente.`
            : `Se eliminaron ${okCount} de ${ids.length} conversación(es).`,
          1900
        );
        return true;
      }
      return false;
    },
    [borrar, cargarHistorial]
  );

  const handleRenameHistory = useCallback(
    async (item: CoraHistoryItem, newTitle: string) => {
      const ok = await renombrar(item.id, newTitle.trim());
      if (ok) {
        const hist = await cargarHistorial();
        setHistoryList(hist);
      }
      return ok;
    },
    [renombrar, cargarHistorial]
  );

  // Scroll al final del listado (ancla dentro del overflow de CoraMessageList)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = messagesEndRef.current;
      if (el?.scrollIntoView) {
        el.scrollIntoView({
          block: 'end',
          inline: 'nearest',
          behavior: streaming ? 'auto' : 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [mensajes, streaming]);

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
          loading={historyLoading}
          searchText={searchText}
          onSearchChange={setSearchText}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteHistory}
          onDeleteMany={handleDeleteManyHistory}
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
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <CoraMessageList
                listEndRef={messagesEndRef}
                mensajes={mensajes}
                loading={loading}
                streaming={streaming}
                error={error}
              />
            </Box>
          )}
        </>
      )}

      {!showHistory && (
        <CoraInputBar
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={loading || streaming}
        />
      )}
    </Paper>
  );
});

CoraChatWindow.displayName = 'CoraChatWindow';

export default CoraChatWindow;

