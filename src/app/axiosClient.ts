/**
 * Axios Client Configuration
 */

import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

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

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
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
