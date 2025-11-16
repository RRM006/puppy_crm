import axios from 'axios';
import { getAccessToken, refreshAccessToken, clearTokens } from './authService';

// Support both Vite and CRA-style env vars; default to localhost API
const viteUrl = import.meta?.env?.VITE_API_URL;
const craUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_URL : undefined;
const baseURL = viteUrl || craUrl || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newAccessToken = await refreshAccessToken();
        
        // Update the authorization header with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        
        // Only redirect if we're not already on login/signup pages
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!['/login', '/signup', '/'].includes(currentPath)) {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export async function healthCheck() {
  const res = await api.get('/health/');
  return res.data;
}

export default api;
