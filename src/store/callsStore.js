import { create } from 'zustand';
import { callsApi } from '../api/calls';

export const useCallsStore = create((set) => ({
  callLogs: [],
  isLoading: false,

  fetchCallHistory: async () => {
    set({ isLoading: true });
    try {
      const res = await callsApi.getHistory();
      set({ callLogs: res.data ?? [] });
    } catch {
      // leave existing data in place on error
    } finally {
      set({ isLoading: false });
    }
  },
}));
