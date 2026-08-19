import { create } from 'zustand';
import { desktopBridge } from '../services/desktopBridge';
import { APP_VERSION } from '../config/version';

export const useUpdateStore = create((set, get) => ({
  status: 'IDLE', // IDLE | CHECKING | AVAILABLE | NOT_AVAILABLE | DOWNLOADING | DOWNLOADED | INSTALLING | ERROR
  currentVersion: APP_VERSION,
  latestVersion: null,
  releaseNotes: '',
  releaseDate: null,
  downloadProgress: {
    percent: 0,
    bytesPerSecond: 0,
    transferred: 0,
    total: 0,
    estimatedRemainingSec: 0,
  },
  error: null,
  lastChecked: null,
  channel: 'stable',
  autoCheck: true,
  autoDownload: true,
  installOnQuit: true,
  isModalOpen: false,
  isBannerDismissed: false,

  fetchStatus: async () => {
    try {
      const state = await desktopBridge.getUpdateStatus();
      if (state) {
        set((prev) => ({
          ...prev,
          status: state.status || prev.status,
          currentVersion: state.currentVersion || prev.currentVersion,
          latestVersion: state.latestVersion || prev.latestVersion,
          releaseNotes: state.releaseNotes || prev.releaseNotes,
          releaseDate: state.releaseDate || prev.releaseDate,
          downloadProgress: state.downloadProgress || prev.downloadProgress,
          error: state.error || null,
          lastChecked: state.lastChecked || prev.lastChecked,
          channel: state.channel || prev.channel,
          autoCheck: typeof state.autoCheck === 'boolean' ? state.autoCheck : prev.autoCheck,
          autoDownload: typeof state.autoDownload === 'boolean' ? state.autoDownload : prev.autoDownload,
          installOnQuit: typeof state.installOnQuit === 'boolean' ? state.installOnQuit : prev.installOnQuit,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch update status:', e);
    }
  },

  checkForUpdates: async (manual = true) => {
    set({ status: 'CHECKING', error: null });
    try {
      const res = await desktopBridge.checkForUpdates(manual);
      if (res && res.state) {
        set({
          status: res.state.status,
          latestVersion: res.state.latestVersion,
          releaseNotes: res.state.releaseNotes,
          releaseDate: res.state.releaseDate,
          error: res.state.error,
          lastChecked: new Date().toISOString(),
          isBannerDismissed: false,
        });

        if (res.state.status === 'AVAILABLE' && manual) {
          set({ isModalOpen: true });
        }
      } else {
        await get().fetchStatus();
      }
    } catch (err) {
      set({
        status: 'ERROR',
        error: err.message || 'Unable to check for updates',
        lastChecked: new Date().toISOString(),
      });
    }
  },

  downloadUpdate: async () => {
    set({ status: 'DOWNLOADING', error: null, isModalOpen: true });
    try {
      await desktopBridge.downloadUpdate();
      // Start polling download progress while downloading
      const interval = setInterval(async () => {
        await get().fetchStatus();
        const currentStatus = get().status;
        if (currentStatus === 'DOWNLOADED' || currentStatus === 'ERROR') {
          clearInterval(interval);
        }
      }, 800);
    } catch (err) {
      set({ status: 'ERROR', error: err.message });
    }
  },

  installUpdate: async (force = false) => {
    set({ status: 'INSTALLING' });
    try {
      const res = await desktopBridge.installUpdate(force);
      if (res && res.deferred) {
        alert(res.message || 'Git operation in progress. Update will install after completion.');
        set({ status: 'DOWNLOADED' });
      }
    } catch (err) {
      set({ status: 'ERROR', error: err.message });
    }
  },

  updateConfig: async (partialConfig) => {
    try {
      const res = await desktopBridge.saveUpdateConfig(partialConfig);
      set((prev) => ({
        ...prev,
        ...partialConfig,
      }));
    } catch (e) {
      console.warn('Update config save error:', e);
    }
  },

  openUpdateModal: () => set({ isModalOpen: true }),
  closeUpdateModal: () => set({ isModalOpen: false }),
  dismissBanner: () => set({ isBannerDismissed: true }),
}));
