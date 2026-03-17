import { useState, useCallback } from 'react';
import { 
  enviarMensajeIA, 
  enviarMensajeIAStream,
  obtenerConversaciones, 
  obtenerDetalleConversacion, 
  eliminarConversacion, 
  renombrarConversacion, 
  type IaChatResponse 
} from '../api/services/iaApi';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function useCoraIA() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const enviar = async (texto: string) => {
    const message = texto.trim();
    if (!message) return;
    setError(null);
    setLoading(true);
    setMensajes((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const resp: IaChatResponse = await enviarMensajeIA({ message, conversationId });
      setConversationId(resp.conversationId);
      setMensajes((prev) => [...prev, { role: 'assistant', content: resp.answer }]);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al hablar con CORA IA.');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = useCallback(() => {
    setConversationId(undefined);
    setMensajes([]);
    setError(null);
    setLoading(false);
    setStreaming(false);
  }, []);

  const enviarStream = useCallback(async (texto: string) => {
    const message = texto.trim();
    if (!message) return;
    setError(null);
    setStreaming(true);

    setMensajes((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '' }]);

    let currentAnswer = '';

    const currentConversationId = conversationId;

    try {
      await enviarMensajeIAStream(
        { message, conversationId: currentConversationId },
        {
          onChunk: ({ delta }) => {
            if (!delta) return;
            currentAnswer += delta;
            setMensajes((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: currentAnswer,
                };
              }
              return updated;
            });
          },
          onEnd: ({ conversationId: newConvId }) => {
            if (newConvId) setConversationId(newConvId);
          },
        },
      );
    } catch (e: any) {
      console.error('Error en enviarStream IA', e);
      setError(e?.message || 'Error al hablar con CORA IA.');
    } finally {
      setStreaming(false);
    }
  }, [conversationId]);

  const cargarHistorial = useCallback(async () => {
    try {
      const data = await obtenerConversaciones();
      return data;
    } catch (e: any) {
      console.error('Error al cargar historial', e);
      return [];
    }
  }, []);

  const seleccionarConversacion = useCallback(async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await obtenerDetalleConversacion(id);
      setConversationId(data.id);
      setMensajes(data.messages || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al cargar la conversación.');
    } finally {
      setLoading(false);
    }
  }, []);

  const borrar = useCallback(async (id: string) => {
    try {
      await eliminarConversacion(id);
      setConversationId((cid) => {
        if (cid === id) {
          setMensajes([]);
          setError(null);
          setLoading(false);
          setStreaming(false);
          return undefined;
        }
        return cid;
      });
      return true;
    } catch (e) {
      console.error('Error al borrar conversación', e);
      return false;
    }
  }, []);

  const renombrar = useCallback(async (id: string, title: string) => {
    try {
      await renombrarConversacion(id, title);
      return true;
    } catch (e) {
      console.error('Error al renombrar conversación', e);
      return false;
    }
  }, []);

  return {
    conversationId,
    mensajes,
    loading,
    streaming,
    error,
    enviar,
    enviarStream,
    limpiar,
    cargarHistorial,
    seleccionarConversacion,
    borrar,
    renombrar
  };
}
