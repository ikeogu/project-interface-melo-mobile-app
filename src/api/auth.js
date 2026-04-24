import { apiClient } from './client';
import * as SecureStore from 'expo-secure-store';

export const authApi = {
  sendOtp: (email) =>
    apiClient.post('/auth/send-otp', { email }),

  verifyOtp: (email, code) =>
    apiClient.post('/auth/verify-otp', { email, code }),

  completeProfile: (display_name, avatar_url) =>
    apiClient.post('/auth/complete-profile', { display_name, avatar_url }),

  getMe: () =>
    apiClient.get('/auth/me'),

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user');
  },
};
