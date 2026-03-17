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
} from '@mui/material';
import { Search as SearchIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

export interface CoraHistoryItem {
  id: string;
  title?: string | null;
  preview?: string | null;
  updatedAt: string | Date;
}

interface Props {
  items: CoraHistoryItem[];
  searchText: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onDelete: (item: CoraHistoryItem) => void;
  onRename: (item: CoraHistoryItem) => void;
}

const CoraHistoryPanel: React.FC<Props> = React.memo(({
  items,
  searchText,
  onSearchChange,
  onSelect,
  onDelete,
  onRename,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = React.useState<CoraHistoryItem | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: CoraHistoryItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    const item = selectedItem;
    handleMenuClose(); // Cerrar primero para evitar getBoundingClientRect sobre nodo desmontado
    if (item) setTimeout(() => onDelete(item), 0);
  };

  const handleRenameClick = () => {
    const item = selectedItem;
    handleMenuClose();
    if (item) onRename(item);
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

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 1, px: 0.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar conversación..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            ),
            sx: { borderRadius: 2, fontSize: '0.875rem' },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 0.5 }}>
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 2 }}
          >
            Sin resultados.
          </Typography>
        ) : (
          <List disablePadding>
            {filtered.map((h) => (
              <Box key={h.id} sx={{ position: 'relative', mb: 0.75 }}>
                <ListItemButton
                  onClick={() => onSelect(h.id)}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid #f1f5f9',
                    '&:hover': { bgcolor: '#f1f5f9' },
                    pr: 7,
                  }}
                >
                  <ListItemText
                    primary={h.title || 'Conversación'}
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
                          {h.preview && h.preview !== 'Nueva Conversación'
                            ? h.preview
                            : ''}
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
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMenuOpen(e, h);
                  }}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    color: 'text.secondary',
                    pointerEvents: 'auto',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </List>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        // Anclar el menú justo SOBRE el botón de tres puntos, alineado a la derecha
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        // Renderizar dentro del árbol del chat para evitar que quede "detrás"
        disablePortal
        slotProps={{ paper: { sx: { minWidth: 160, zIndex: 9999 } } }}
      >
        <MenuItem onClick={handleRenameClick}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Renombrar
          </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>
    </Box>
  );
});

CoraHistoryPanel.displayName = 'CoraHistoryPanel';

export default CoraHistoryPanel;

