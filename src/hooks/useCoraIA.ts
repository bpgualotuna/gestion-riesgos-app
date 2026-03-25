import { useState, useCallback, useRef } from 'react';
import { 
  enviarMensajeIA, 
  enviarMensajeIAStream,
  obtenerConversaciones, 
  obtenerDetalleConversacion, 
  eliminarConversacion, 
  renombrarConversacion, 
  type IaChatResponse 
} from '../api/services/iaApi';
import type { ChatMessage, ScreenContext } from '../types/ia.types';

/** Asegura role/content por mensaje (Mongo puede traer createdAt u otros campos). */
function normalizeMensajesDesdeApi(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: string }).role === 'user' ? 'user' : 'assistant';
    const content = (m as { content?: unknown }).content;
    const str = typeof content === 'string' ? content : content != null ? String(content) : '';
    out.push({ role, content: str });
  }
  return out;
}

export function useCoraIA() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  /** Evita aplicar respuestas viejas si el usuario cambia de conversación rápido. */
  const detalleLoadSeqRef = useRef(0);

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

  const enviarStream = useCallback(async (texto: string, context?: ScreenContext) => {
    const message = texto.trim();
    if (!message) return;
    setError(null);
    setStreaming(true);

    setMensajes((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '' }]);

    let currentAnswer = '';

    const currentConversationId = conversationId;
    const contextToSend = context; // MODIFICADO: Solo usar el contexto pasado como parámetro

    try {
      await enviarMensajeIAStream(
        { 
          message, 
          conversationId: currentConversationId,
          screenContext: contextToSend // NUEVO: Enviar contexto de pantalla
        },
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
  }, [conversationId]); // MODIFICADO: Removido screenContext de dependencias

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
    setStreaming(false);
    setMensajes([]);
    setLoading(true);
    detalleLoadSeqRef.current += 1;
    const seq = detalleLoadSeqRef.current;
    try {
      const data = await obtenerDetalleConversacion(id);
      if (seq !== detalleLoadSeqRef.current) return;
      setConversationId(data.id);
      setMensajes(normalizeMensajesDesdeApi(data.messages));
    } catch (e: any) {
      if (seq !== detalleLoadSeqRef.current) return;
      setError(e?.response?.data?.error || 'Error al cargar la conversación.');
    } finally {
      if (seq === detalleLoadSeqRef.current) {
        setLoading(false);
      }
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
    renombrar,
  };
}
