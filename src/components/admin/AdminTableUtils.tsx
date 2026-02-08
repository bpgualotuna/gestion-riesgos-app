import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    TextField,
    Box,
    InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Componente de búsqueda reutilizable
export function AdminSearchBox({
    searchTerm,
    onSearchChange,
    placeholder = 'Buscar...',
}: {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    placeholder?: string;
}) {
    return (
        <TextField
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            sx={{
                mb: 2,
                width: '100%',
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f5f5f5',
                },
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999' }} />
                    </InputAdornment>
                ),
            }}
        />
    );
}

// Diálogo de confirmación reutilizable
export function ConfirmDialog({
    open,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'delete',
}: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'delete' | 'edit' | 'default';
}) {
    const confirmColor =
        variant === 'delete' ? 'error' : variant === 'edit' ? 'warning' : 'primary';

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} color="inherit">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant="contained" color={confirmColor}>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Contenedor de acciones con diseño mejorado
export function ActionButtonsContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 0.5,
                justifyContent: 'center',
            }}
        >
            {children}
        </Box>
    );
}
