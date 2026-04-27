/**
 * Axios Client Configuration
 */

import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';
import { repairSpanishDisplayArtifacts } from '../utils/utf8Repair';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: añadir JWT si existe
axiosClient.interceptors.request.use(
  (config) => {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

function sanitizeResponseData(value: unknown): unknown {
  if (typeof value === 'string') {
    return repairSpanishDisplayArtifacts(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeResponseData(item));
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      normalized[k] = sanitizeResponseData(v);
    }
    return normalized;
  }
  return value;
}

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    response.data = sanitizeResponseData(response.data);
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      // Forbidden
    }
    
    if (error.response?.status === 500) {
      // Server error
    }
    
    if (!error.response && error.request) {
      // Network error
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
