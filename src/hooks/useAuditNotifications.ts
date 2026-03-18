import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface AuditNotification {
  id: number;
  usuarioNombre: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  tabla: string;
  registroDesc?: string;
  createdAt: string;
}

export function useAuditNotifications(enabled: boolean = true) {
  const [notifications, setNotifications] = useState<AuditNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCheckRef = useRef<Date>(new Date());

  const fetchNewNotifications = useCallback(async () => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !enabled) return;

    try {
      const response = await axios.get(`${API_URL}/audit/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          pageSize: 10,
          desde: lastCheckRef.current.toISOString(),
        },
      });

      const newLogs = response.data.data || [];
      
      if (newLogs.length > 0) {
        setNotifications((prev) => {
          const prevIds = new Set(prev.map((n) => n.id));
          const filteredNew = newLogs.filter((n: AuditNotification) => !prevIds.has(n.id));
          if (filteredNew.length > 0) {
            setUnreadCount((count) => count + filteredNew.length);
          }
          const combined = [...filteredNew, ...prev];
          // Mantener solo las últimas 50 notificaciones
          return combined.slice(0, 50);
        });
      }

      lastCheckRef.current = new Date();
    } catch (error) {
      console.error('Error fetching audit notifications:', error);
    }
  }, [enabled]);

  // Polling cada 30 segundos solo si está habilitado
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      fetchNewNotifications();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchNewNotifications, enabled]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    refreshNotifications: fetchNewNotifications,
  };
}
