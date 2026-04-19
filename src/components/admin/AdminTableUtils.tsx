import React from 'react';
import {
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
