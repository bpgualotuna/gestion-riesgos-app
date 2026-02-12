/**
 * Axios Client Configuration
 */

import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      // Use window.location.pathname to preserve the current path structure
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden:', error.response?.data?.message || 'You do not have permission to access this resource');
    }
    
    if (error.response?.status === 500) {
      // Server error
      console.error('Server error:', error.response?.data?.message || 'Internal server error');
    }
    
    // Handle network errors
    if (!error.response && error.request) {
      console.error('Network error: Unable to connect to the server');
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
