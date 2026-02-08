import React, { useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, ListItemText, Typography, Box } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';

const NotificacionesMenu: React.FC = () => {
    const { notificaciones, marcarComoLeida } = useNotification();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const unreadCount = notificaciones.filter(n => !n.leida).length;

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = (id: string) => {
        marcarComoLeida(id);
        handleClose();
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: '350px',
                    },
                }}
            >
                {notificaciones.length === 0 ? (
                    <MenuItem disabled>
                        <ListItemText primary="No hay notificaciones" />
                    </MenuItem>
                ) : (
                    notificaciones.map((notificacion) => (
                        <MenuItem key={notificacion.id} onClick={() => handleMarkAsRead(notificacion.id)}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="subtitle2">{notificacion.titulo}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {notificacion.mensaje}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificacionesMenu;
