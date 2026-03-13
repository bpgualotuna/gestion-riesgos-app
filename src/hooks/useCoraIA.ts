import { useState } from 'react';
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

  const enviarStream = async (texto: string) => {
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
            if (newConvId) {
              setConversationId(newConvId);
            }
            setStreaming(false);
          },
        },
      );
    } catch (e: any) {
      console.error('Error en enviarStream IA', e);
      setError(e?.message || 'Error al hablar con CORA IA.');
      setStreaming(false);
    }
  };

  const limpiar = () => {
    setConversationId(undefined);
    setMensajes([]);
    setError(null);
  };

  const cargarHistorial = async () => {
    try {
      const data = await obtenerConversaciones();
      return data;
    } catch (e: any) {
      console.error('Error al cargar historial', e);
      return [];
    }
  };

  const seleccionarConversacion = async (id: string) => {
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
  };

  const borrar = async (id: string) => {
    try {
      await eliminarConversacion(id);
      if (conversationId === id) {
        limpiar();
      }
      return true;
    } catch (e) {
      console.error('Error al borrar conversación', e);
      return false;
    }
  };

  const renombrar = async (id: string, title: string) => {
    try {
      await renombrarConversacion(id, title);
      return true;
    } catch (e) {
      console.error('Error al renombrar conversación', e);
      return false;
    }
  };

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
