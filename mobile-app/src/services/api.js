import axios from 'axios';
import { API_URL } from '@env';
import { getAccessToken, refreshAccessToken, clearTokens } from './authService';

// Use API_URL from .env
// iOS Simulator/Expo Go: http://localhost:8000/api
// Android Emulator: http://10.0.2.2:8000/api
// Physical device: Use your computer's local IP address
const baseURL = API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the access token
        const newAccessToken = await refreshAccessToken();

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await clearTokens();
        
        // Don't redirect here - let the component handle it
        // This prevents circular dependencies
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
