import { create } from 'zustand';
import { databaseService } from '../services/database/databaseService';

export const useActivityStore = create((set, get) => ({
  history: [],
  logs: [],
  filterStatus: 'ALL', // ALL, SUCCESS, FAILED, NO_CHANGES
  isLoading: false,

  fetchActivity: async () => {
    set({ isLoading: true });
    const history = await databaseService.getPushHistory();
    const logs = await databaseService.getLogs();
    set({ history, logs, isLoading: false });
  },

  setFilterStatus: (filterStatus) => {
    set({ filterStatus });
  },

  clearLogs: async () => {
    await databaseService.clearLogs();
    set({ logs: [] });
  },
}));
