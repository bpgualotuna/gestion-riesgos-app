import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { 
  History as HistoryIcon, 
  Add as AddIcon, 
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useCoraIA } from '../../hooks/useCoraIA';
import { useAuth } from '../../contexts/AuthContext';

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

const thinkingDots = keyframes`
  0% { opacity: 0.2; transform: translateY(0); }
  20% { opacity: 1; transform: translateY(-2px); }
  40% { opacity: 0.2; transform: translateY(0); }
  100% { opacity: 0.2; transform: translateY(0); }
`;

const VirtualAssistantDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    mensajes, loading, error, enviar, limpiar, 
    cargarHistorial, seleccionarConversacion, borrar, renombrar 
  } = useCoraIA();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  // Estados para el menú de opciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedHistItem, setSelectedHistItem] = useState<any | null>(null);

  // Estados para renombrar
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const fetchHistory = async () => {
    const hist = await cargarHistorial();
    setHistoryList(hist);
  };

  const handleToggleHistory = async () => {
    if (!showHistory) {
      await fetchHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleNewConversation = () => {
    limpiar();
    setShowHistory(false);
  };

  const handleSelectConversation = async (id: string) => {
    await seleccionarConversacion(id);
    setShowHistory(false);
  };

  const filteredHistory = useMemo(() => {
    if (!searchText.trim()) return historyList;
    const lower = searchText.toLowerCase();
    return historyList.filter(h => 
      (h.title?.toLowerCase().includes(lower)) || 
      (h.preview?.toLowerCase().includes(lower))
    );
  }, [historyList, searchText]);

  // Manejo del menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedHistItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    if (!selectedHistItem) return;
    const ok = await borrar(selectedHistItem.id);
    if (ok) {
      fetchHistory();
    }
    handleMenuClose();
  };

  const handleOpenRename = () => {
    if (!selectedHistItem) return;
    setNewTitle(selectedHistItem.title || '');
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRenameSubmit = async () => {
    if (!selectedHistItem || !newTitle.trim()) return;
    const ok = await renombrar(selectedHistItem.id, newTitle.trim());
    if (ok) {
      fetchHistory();
    }
    setRenameDialogOpen(false);
  };

  // Pequeño recordatorio periódico
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!open) {
        setShowNudge(true);
        window.setTimeout(() => setShowNudge(false), 6000);
      }
    }, 45000);
    return () => window.clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, open]);

  const handleSend = () => {
    if (!inputValue.trim() || loading) return;
    enviar(inputValue);
    setInputValue('');
  };

  const handleToggleOpen = () => {
    setOpen(!open);
  };

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
            width: isMobile ? 300 : 380,
            height: isMobile ? 360 : 480,
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
              <Typography variant="subtitle2" fontWeight={700} noWrap> CORA IA </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}> Conectada a Gestión de Riesgos </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.25 }}>
              <Tooltip title="Historial">
                <IconButton size="small" onClick={handleToggleHistory} color={showHistory ? 'primary' : 'default'}>
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Nueva">
                <IconButton size="small" onClick={handleNewConversation}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {showHistory ? (
            <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 1, px: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar conversación..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />,
                    sx: { borderRadius: 2, fontSize: '0.875rem' }
                  }}
                />
              </Box>
              
              <Box sx={{ flex: 1, overflowY: 'auto', p: 0.5 }}>
                {filteredHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>Sin resultados.</Typography>
                ) : (
                  <List disablePadding>
                    {filteredHistory.map(h => (
                      <Box key={h.id} sx={{ position: 'relative', mb: 0.75 }}>
                        <ListItemButton 
                          onClick={() => handleSelectConversation(h.id)} 
                          sx={{ 
                            borderRadius: 2, 
                            border: '1px solid #f1f5f9',
                            '&:hover': { bgcolor: '#f1f5f9' },
                            pr: 7 // Espacio generoso para el botón de menú
                          }}
                        >
                          <ListItemText
                            primary={h.title || 'Conversación'}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true, color: 'primary' }}
                            secondary={
                              <>
                                <Typography component="span" variant="caption" color="text.secondary" display="block" noWrap sx={{ fontSize: '0.75rem', mb: 0.2 }}>
                                  {h.preview && h.preview !== 'Nueva Conversación' ? h.preview : ''}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.7 }}>
                                  {new Date(h.updatedAt).toLocaleDateString()}
                                </Typography>
                              </>
                            }
                          />
                        </ListItemButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, h)}
                          sx={{ 
                            position: 'absolute', 
                            right: 8, 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            zIndex: 2,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, mb: 1.5, px: 0.25, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {mensajes.length === 0 && (
                <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: '#f0f7ff', border: '1px solid #dbeafe' }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    Hola <strong>{user?.fullName || 'Usuario'}</strong>, soy CORA. Estoy lista para ayudarte con tus riesgos y procesos. ¿En qué puedo apoyarte hoy?
                  </Typography>
                </Box>
              )}

              {mensajes.map((m, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem',
                      lineHeight: 1.5
                    }}
                  >
                    {m.content}
                  </Box>
                </Box>
              ))}
              {/* Indicador de "pensando" mientras la IA responde */}
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, pl: 0.5 }}>
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
                    }}
                  >
                    <Box
                      component="img"
                      src="/logo-cora.png"
                      alt="CORA IA"
                      sx={{ width: 18, height: 18, borderRadius: '50%' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.4 }}>
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
              <div ref={messagesEndRef} />
              {error && <Typography variant="caption" color="error" sx={{ px: 1 }}>{error}</Typography>}
            </Box>
          )}

          {/* Input inferior: oculto cuando se está viendo el historial */}
          {!showHistory && (
            <Box sx={{ borderTop: '1px solid #f1f5f9', pt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Pregunta algo..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                sx={{ '& .MuiInputBase-root': { borderRadius: 4, bgcolor: '#f8fafc' } }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                sx={{ minWidth: 90, textTransform: 'none', fontSize: '0.85rem' }}
              >
                Enviar
              </Button>
            </Box>
          )}
        </Paper>
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
        <Tooltip title="CORA IA">
          <IconButton
            onClick={handleToggleOpen}
            sx={{
              width: 64, height: 64, bgcolor: '#fff', boxShadow: 5,
              animation: `${float} 3s ease-in-out infinite`,
              '&:hover': { transform: 'scale(1.05)' }
            }}
          >
            <Box component="img" src="/logo-cora.png" sx={{ width: '85%' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Menú de Opciones Contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => {
          e.stopPropagation();
          handleMenuClose();
        }}
        disablePortal={false}
        sx={{ zIndex: 10000 }} // Aseguramos que esté por encima de todo
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            minWidth: 150,
            border: '1px solid #e2e8f0',
            mt: 0.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              gap: 1.5,
              '&:hover': { bgcolor: '#f8fafc' }
            }
          }
        }}
      >
        <MenuItem onClick={(e) => { e.stopPropagation(); handleOpenRename(); }}>
          <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <ListItemText primary="Renombrar" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); handleDelete(); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" color="error" />
          <ListItemText primary="Eliminar" primaryTypographyProps={{ variant: 'body2', color: 'error', fontWeight: 500 }} />
        </MenuItem>
      </Menu>

      {/* Dialog para Renombrar */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem' }}>Renombrar Conversación</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nuevo Título"
            fullWidth
            variant="outlined"
            size="small"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)} size="small">Cancelar</Button>
          <Button onClick={handleRenameSubmit} variant="contained" size="small">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VirtualAssistantDemo;


