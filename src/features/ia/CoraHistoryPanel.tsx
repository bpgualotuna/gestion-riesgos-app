import React from 'react';
import {
  Box,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Close as CloseIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export interface CoraHistoryItem {
  id: string;
  title?: string | null;
  preview?: string | null;
  updatedAt: string | Date;
}

interface Props {
  items: CoraHistoryItem[];
  loading?: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDelete: (item: CoraHistoryItem) => void;
  onDeleteMany: (ids: string[]) => Promise<boolean> | boolean;
  onRename: (item: CoraHistoryItem, newTitle: string) => Promise<boolean> | boolean;
}

const CoraHistoryPanel: React.FC<Props> = React.memo(
  ({
    items,
    loading = false,
    searchText,
    onSearchChange,
    onSelect,
    onDelete,
    onDeleteMany,
    onRename,
  }) => {
    const [rowMenuAnchor, setRowMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [toolbarMenuAnchor, setToolbarMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [selectedRowItem, setSelectedRowItem] = React.useState<CoraHistoryItem | null>(null);
    const [selectionMode, setSelectionMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [editingTitle, setEditingTitle] = React.useState('');

    const closeToolbarMenu = () => setToolbarMenuAnchor(null);
    const closeRowMenu = () => {
      setRowMenuAnchor(null);
      setSelectedRowItem(null);
    };

    const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, item: CoraHistoryItem) => {
      event.stopPropagation();
      setRowMenuAnchor(event.currentTarget);
      setSelectedRowItem(item);
    };

    const handleDeleteRowClick = () => {
      const item = selectedRowItem;
      closeRowMenu();
      if (item) setTimeout(() => onDelete(item), 0);
    };

    const handleRenameRowClick = () => {
      const item = selectedRowItem;
      closeRowMenu();
      if (item) {
        setEditingRowId(item.id);
        setEditingTitle(item.title || '');
      }
    };

    const cancelInlineRename = () => {
      setEditingRowId(null);
      setEditingTitle('');
    };

    const saveInlineRename = async (item: CoraHistoryItem) => {
      const cleanTitle = editingTitle.trim();
      if (!cleanTitle || cleanTitle === (item.title || '').trim()) {
        cancelInlineRename();
        return;
      }
      const ok = await onRename(item, cleanTitle);
      if (ok) cancelInlineRename();
    };

    const filtered = React.useMemo(() => {
      if (!searchText.trim()) return items;
      const lower = searchText.toLowerCase();
      return items.filter(
        (h) =>
          h.title?.toLowerCase().includes(lower) ||
          h.preview?.toLowerCase().includes(lower),
      );
    }, [items, searchText]);

    const toggleSelection = (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };

    const handleToggleSelectAllVisible = () => {
      const visibleIds = filtered.map((h) => h.id);
      const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
      if (allSelected) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          visibleIds.forEach((id) => next.delete(id));
          return next;
        });
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    };

    const exitSelectionMode = () => {
      setSelectionMode(false);
      setSelectedIds(new Set());
    };

    const handleDeleteSelected = async () => {
      if (selectedIds.size === 0) return;
      const ok = await onDeleteMany(Array.from(selectedIds));
      if (ok) exitSelectionMode();
    };

    const visibleIds = filtered.map((h) => h.id);
    const areAllVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    const toolbarMenuHasBulkActions = selectionMode && selectedIds.size > 0;

    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Barra superior: búsqueda + menú general (⋮) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mb: selectionMode ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar conversación…"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ fontSize: 18, mr: 0.75, color: 'text.secondary', flexShrink: 0 }} />
              ),
              sx: { borderRadius: 2, fontSize: '0.875rem' },
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
          <IconButton
            size="small"
            aria-label="Opciones del historial"
            aria-haspopup="menu"
            aria-expanded={Boolean(toolbarMenuAnchor)}
            onClick={(e) => setToolbarMenuAnchor(e.currentTarget)}
            color={toolbarMenuHasBulkActions ? 'primary' : 'default'}
            sx={(theme) => ({
              flexShrink: 0,
              border: '1px solid',
              borderColor: toolbarMenuHasBulkActions ? 'primary.main' : 'divider',
              bgcolor: toolbarMenuHasBulkActions
                ? alpha(theme.palette.primary.main, 0.1)
                : theme.palette.background.paper,
            })}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {selectionMode && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 0.25, mb: 0.75, display: 'block', lineHeight: 1.35 }}
          >
            {selectedIds.size === 0
              ? 'Modo selección: elige conversaciones o usa el menú ⋮.'
              : `${selectedIds.size} seleccionada(s). Acciones en el menú ⋮.`}
          </Typography>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, px: 0.25 }}>
          {loading && items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                gap: 1.5,
              }}
            >
              <CircularProgress size={28} />
              <Typography variant="caption" color="text.secondary">
                Cargando conversaciones…
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Sin resultados.
            </Typography>
          ) : (
            <List disablePadding sx={{ py: 0 }}>
              {filtered.map((h) => (
                <Box key={h.id} sx={{ position: 'relative', mb: 0.75 }}>
                  <ListItemButton
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelection(h.id);
                        return;
                      }
                      onSelect(h.id);
                    }}
                    sx={{
                      alignItems: 'flex-start',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selectedIds.has(h.id) ? 'primary.light' : '#f1f5f9',
                      bgcolor: selectedIds.has(h.id) ? 'action.hover' : 'transparent',
                      py: 1,
                      pr: selectionMode ? 1 : 6,
                      '&:hover': {
                        bgcolor: selectionMode ? 'action.hover' : '#f8fafc',
                      },
                    }}
                  >
                    {selectionMode && (
                      <Checkbox
                        checked={selectedIds.has(h.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(h.id);
                        }}
                        size="small"
                        sx={{ mt: -0.25, mr: 1, p: 0.5, alignSelf: 'flex-start' }}
                      />
                    )}
                    <ListItemText
                      primary={
                        editingRowId === h.id ? (
                          <TextField
                            size="small"
                            autoFocus
                            fullWidth
                            value={editingTitle}
                            placeholder="Título de conversación"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => {
                              void saveInlineRename(h);
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void saveInlineRename(h);
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelInlineRename();
                              }
                            }}
                            inputProps={{ maxLength: 120 }}
                          />
                        ) : (
                          h.title || 'Conversación'
                        )
                      }
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 600,
                        noWrap: true,
                        color: 'primary',
                      }}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            noWrap
                            sx={{ fontSize: '0.75rem', mb: 0.2 }}
                          >
                            {h.preview && h.preview !== 'Nueva Conversación' ? h.preview : '\u00a0'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ fontSize: '0.65rem', opacity: 0.7 }}
                          >
                            {new Date(h.updatedAt).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  {!selectionMode && (
                    <IconButton
                      size="small"
                      aria-label="Opciones de conversación"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRowMenuOpen(e, h);
                      }}
                      sx={{
                        position: 'absolute',
                        right: 6,
                        top: 10,
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Menú general del panel (acciones masivas y modo selección) */}
        <Menu
          anchorEl={toolbarMenuAnchor}
          open={Boolean(toolbarMenuAnchor)}
          onClose={closeToolbarMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          disablePortal
          slotProps={{
            paper: {
              sx: { minWidth: 220, zIndex: 9999 },
            },
          }}
        >
          {!selectionMode ? (
            <MenuItem
              onClick={() => {
                setSelectionMode(true);
                closeToolbarMenu();
              }}
            >
              Seleccionar varias…
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={() => {
                  handleToggleSelectAllVisible();
                  closeToolbarMenu();
                }}
                disabled={filtered.length === 0}
              >
                <DoneAllIcon fontSize="small" sx={{ mr: 1 }} />
                {areAllVisibleSelected ? 'Desmarcar visibles' : 'Seleccionar todas (visibles)'}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSelectedIds(new Set());
                  closeToolbarMenu();
                }}
                disabled={selectedIds.size === 0}
              >
                <ClearAllIcon fontSize="small" sx={{ mr: 1 }} />
                Limpiar selección
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={selectedIds.size === 0}
                onClick={() => {
                  closeToolbarMenu();
                  void handleDeleteSelected();
                }}
                sx={{ color: selectedIds.size === 0 ? undefined : 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Eliminar seleccionadas ({selectedIds.size})
              </MenuItem>
              <MenuItem
                onClick={() => {
                  exitSelectionMode();
                  closeToolbarMenu();
                }}
              >
                <CloseIcon fontSize="small" sx={{ mr: 1 }} />
                Salir del modo selección
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Menú por fila: renombrar / eliminar una */}
        <Menu
          anchorEl={rowMenuAnchor}
          open={Boolean(rowMenuAnchor)}
          onClose={closeRowMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          disablePortal
          slotProps={{ paper: { sx: { minWidth: 160, zIndex: 9999 } } }}
        >
          <MenuItem onClick={handleRenameRowClick}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Renombrar
          </MenuItem>
          <MenuItem onClick={handleDeleteRowClick} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        </Menu>
      </Box>
    );
  },
);

CoraHistoryPanel.displayName = 'CoraHistoryPanel';

export default CoraHistoryPanel;
