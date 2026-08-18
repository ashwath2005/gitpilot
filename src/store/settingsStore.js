import { create } from 'zustand';
import { databaseService } from '../services/database/databaseService';

export const useSettingsStore = create((set, get) => ({
  settings: {},
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    const settings = await databaseService.getSettings();
    set({ settings, isLoading: false });
  },

  updateSettings: async (partialSettings) => {
    const current = get().settings;
    const updated = { ...current, ...partialSettings };
    await databaseService.saveSettings(updated);
    set({ settings: updated });
  },
}));
