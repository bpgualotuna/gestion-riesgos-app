import { useContext } from 'react';
import { NotificacionContext } from '../contexts/NotificacionContext';

export const useNotification = () => {
    const context = useContext(NotificacionContext);
    if (!context) {
        throw new Error('useNotification debe ser usado dentro de un NotificacionProvider');
    }
    return context;
};
