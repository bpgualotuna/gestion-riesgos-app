import React, { type RefObject } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import ReactMarkdown from 'react-markdown';

/** Contenido del chat con Markdown real (negritas, cursivas, listas, reglas ---). */
function CoraMarkdownBody({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <Box
      sx={{
        '& p': { margin: 0, mb: 1, '&:last-child': { mb: 0 } },
        '& strong': { fontWeight: 700 },
        '& em': { fontStyle: 'italic' },
        '& strong em, & em strong': { fontWeight: 700, fontStyle: 'italic' },
        '& hr': {
          border: 0,
          borderTop: '1px solid',
          borderColor: isUser ? 'rgba(0,0,0,0.12)' : '#e5e7eb',
          my: 1.25,
        },
        '& ul, & ol': { pl: 2, my: 0.5, mb: 1 },
        '& li': { mb: 0.35 },
        '& h1, & h2, & h3': { fontWeight: 700, mt: 1, mb: 0.75, fontSize: '0.95rem' },
        '& h1:first-of-type, & h2:first-of-type, & h3:first-of-type': { mt: 0 },
        '& code': {
          fontSize: '0.85em',
          bgcolor: isUser ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.05)',
          px: 0.4,
          py: 0.1,
          borderRadius: 0.5,
          fontFamily: 'ui-monospace, monospace',
        },
        '& pre': {
          overflow: 'auto',
          maxWidth: '100%',
          p: 1,
          borderRadius: 1,
          bgcolor: isUser ? 'rgba(0,0,0,0.06)' : '#f9fafb',
          fontSize: '0.8rem',
          my: 1,
        },
        '& pre code': { bgcolor: 'transparent', p: 0 },
        '& blockquote': {
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          pl: 1.25,
          my: 1,
          color: 'text.secondary',
        },
        '& a': { color: 'primary.main', wordBreak: 'break-word' },
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
  );
}

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface Props {
  mensajes: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  error: string | null;
  /** Ancla al final del área con scroll (debe ir dentro del contenedor overflow) */
  listEndRef?: RefObject<HTMLDivElement | null>;
}

const thinkingDots = keyframes`
  0% { opacity: 0.2; transform: translateY(0); }
  20% { opacity: 1; transform: translateY(-2px); }
  40% { opacity: 0.2; transform: translateY(0); }
  100% { opacity: 0.2; transform: translateY(0); }
`;

const CoraMessageList: React.FC<Props> = React.memo(({ mensajes, loading, streaming, error, listEndRef }) => {
  const lastMsg = mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;
  const lastIsAssistantWithContent =
    lastMsg?.role === 'assistant' && (lastMsg?.content?.trim() ?? '') !== '';
  // Mientras piensa: solo puntos. Cuando ya hay respuesta: quitar puntos y mostrar recuadro.
  const showThinking = (loading || streaming) && !lastIsAssistantWithContent;
  // No mostrar recuadro vacío del asistente mientras se está escribiendo; solo cuando hay contenido.
  const visibleMessages =
    showThinking && lastMsg?.role === 'assistant' && (lastMsg?.content?.trim() ?? '') === ''
      ? mensajes.slice(0, -1)
      : mensajes;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        mb: 1.5,
        px: 0.25,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {visibleMessages.map((m, idx) => {
        return (
        <Box
          key={idx}
          sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
        >
          <Box
            sx={{
              maxWidth: '85%',
              backgroundColor: m.role === 'user' ? '#f3f4f6' : '#ffffff',
              color: '#1f2937',
              borderRadius: 2,
              borderTopRightRadius: m.role === 'user' ? 0 : 2,
              borderTopLeftRadius: m.role === 'assistant' ? 0 : 2,
              p: 1.25,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: m.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
              fontSize: '0.875rem',
              lineHeight: 1.5,
            }}
          >
            <CoraMarkdownBody content={m.content} isUser={m.role === 'user'} />
          </Box>
        </Box>
        );
      })}

      {showThinking && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, pl: 0.5, minHeight: 34 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              bgcolor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/logo-cora.png"
              alt=""
              sx={{ width: 18, height: 18, borderRadius: '50%' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 0.4, alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#38bdf8',
                  animation: `${thinkingDots} 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ px: 1 }}>
          {error}
        </Typography>
      )}

      <div ref={listEndRef} aria-hidden style={{ height: 1, width: '100%', flexShrink: 0 }} />
    </Box>
  );
});

CoraMessageList.displayName = 'CoraMessageList';

export default CoraMessageList;

