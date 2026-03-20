import { axiosClient } from '../../app/axiosClient';
import { API_BASE_URL } from '../../utils/constants';
import type { ScreenContext } from '../../types/ia.types';

export interface IaChatRequest {
  message: string;
  conversationId?: string;
  screenContext?: ScreenContext; // NUEVO: Contexto de pantalla
}

export interface IaChatResponse {
  conversationId: string;
  answer: string;
}

export interface IaStreamChunk {
  delta?: string;
}

export interface IaStreamEndEvent {
  conversationId: string;
}

export async function enviarMensajeIA(payload: IaChatRequest): Promise<IaChatResponse> {
  // La IA puede tardar más en responder que otros endpoints,
  // así que usamos un timeout más alto solo para este servicio.
  const { data } = await axiosClient.post<IaChatResponse>('/ia/chat', payload, {
    timeout: 60000, // hasta 60 segundos para respuestas complejas
  });
  return data;
}

/**
 * Streaming de IA usando fetch + ReadableStream para leer SSE
 */
export async function enviarMensajeIAStream(
  payload: IaChatRequest,
  {
    onChunk,
    onEnd,
  }: {
    onChunk: (chunk: IaStreamChunk) => void;
    onEnd: (event: IaStreamEndEvent) => void;
  },
): Promise<void> {
  const token =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('gr_token')
      : null;

  const response = await fetch(`${API_BASE_URL}/ia/chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error('No se pudo iniciar el stream de IA');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    // Procesamos eventos SSE separados por doble salto de línea
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex).trim();
      buffer = buffer.slice(sepIndex + 2);

      if (!rawEvent) continue;

      let eventName: string | null = null;
      let dataLine: string | null = null;

      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) {
          eventName = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          dataLine = line.replace('data:', '').trim();
        }
      }

      if (!dataLine) continue;

      try {
        const data = JSON.parse(dataLine);
        if (eventName === 'error') {
          const msg = (data as { message?: string; error?: string })?.message ?? (data as { error?: string })?.error ?? 'Error en el stream de IA';
          throw new Error(msg);
        }
        if (!eventName) {
          onChunk(data as IaStreamChunk);
        } else if (eventName === 'end') {
          onEnd(data as IaStreamEndEvent);
        }
      } catch (e) {
        if (e instanceof Error) throw e;
        console.error('Error al parsear evento de IA stream', e);
      }
    }
  }
}

export async function obtenerConversaciones() {
  const { data } = await axiosClient.get('/ia/conversaciones');
  return data;
}

export async function obtenerDetalleConversacion(id: string) {
  const { data } = await axiosClient.get(`/ia/conversaciones/${id}`);
  return data;
}
export async function eliminarConversacion(id: string) {
  const { data } = await axiosClient.delete(`/ia/conversaciones/${id}`);
  return data;
}

export async function renombrarConversacion(id: string, title: string) {
  const { data } = await axiosClient.put(`/ia/conversaciones/${id}`, { title });
  return data;
}
