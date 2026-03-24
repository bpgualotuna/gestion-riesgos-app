import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ConteoRiesgosCriticos {
  total: number;
  inherentes: number;
  residuales: number;
}

export function useRiesgosCriticosNotifications(enabled: boolean = true) {
  const [conteo, setConteo] = useState<ConteoRiesgosCriticos>({
    total: 0,
    inherentes: 0,
    residuales: 0
  });
  const [loading, setLoading] = useState(false);
  const enabledRef = useRef(enabled);

  // Actualizar ref cuando cambia enabled
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const fetchConteo = useCallback(async () => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !enabledRef.current) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/riesgos/criticos/conteo`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConteo(response.data);
    } catch (error) {
      console.error('Error fetching riesgos críticos:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias, usa ref

  // Polling cada 60 segundos
  useEffect(() => {
    if (!enabled) return;

    // Fetch inicial
    fetchConteo();

    const interval = setInterval(() => {
      fetchConteo();
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [enabled, fetchConteo]);

  return {
    conteo,
    loading,
    refresh: fetchConteo,
  };
}
