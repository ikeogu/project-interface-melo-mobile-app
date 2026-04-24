import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://project-interface-melo-backend-production.up.railway.app';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// authStore registers this to reset state on token expiry.
// Using a callback avoids a circular import (client → authStore → auth → client).
let _onSessionExpired = null;
export const setSessionExpiredHandler = (fn) => { _onSessionExpired = fn; };

// Attach JWT token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear stored credentials and signal the auth store
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user');
      _onSessionExpired?.();
    }
    return Promise.reject(error);
  }
);
