import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Restore session on app launch
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userStr = await SecureStore.getItemAsync('user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      console.log('Session restore failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('access_token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  updateUser: (user) => {
    SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await authApi.logout();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

// When the API returns 401 (token expired), reset auth state.
// AppNavigator will automatically redirect to the login screen.
setSessionExpiredHandler(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});
