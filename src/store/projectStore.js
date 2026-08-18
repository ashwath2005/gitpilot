import { create } from 'zustand';
import { databaseService } from '../services/database/databaseService';
import { gitService } from '../services/git/gitService';

export const useProjectStore = create((set, get) => ({
  repositories: [],
  selectedRepoId: null,
  isLoading: false,
  isScanningAll: false,
  error: null,

  fetchRepositories: async () => {
    set({ isLoading: true, error: null });
    try {
      let repos = await databaseService.getRepositories();
      set({ repositories: repos, isLoading: false });

      // Run live scan for accurate branch and changes on initial load
      get().scanAll();
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectRepository: (id) => {
    set({ selectedRepoId: id });
  },

  addRepository: async (path, name) => {
    set({ isLoading: true, error: null });
    try {
      const validation = await gitService.validateRepository(path);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid git repository');
      }

      const statusRes = await gitService.getStatus(path);

      const newRepo = await databaseService.addRepository({
        name: name || path.split(/[\\/]/).filter(Boolean).pop(),
        path,
        branch: validation.branch,
        remoteUrl: validation.remoteUrl,
        remoteName: validation.remoteName,
        status: statusRes.hasChanges ? 'CHANGES' : 'READY',
        filesChanged: statusRes.summary.total,
      });

      const repos = await databaseService.getRepositories();
      set({ repositories: repos, isLoading: false });
      return newRepo;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateRepository: async (id, updates) => {
    await databaseService.updateRepository(id, updates);
    const repos = await databaseService.getRepositories();
    set({ repositories: repos });
  },

  deleteRepository: async (id) => {
    await databaseService.deleteRepository(id);
    const repos = await databaseService.getRepositories();
    set({ repositories: repos, selectedRepoId: get().selectedRepoId === id ? null : get().selectedRepoId });
  },

  scanRepository: async (id) => {
    const repo = get().repositories.find((r) => r.id === id);
    if (!repo) return;

    try {
      const validation = await gitService.validateRepository(repo.path);
      const statusRes = await gitService.getStatus(repo.path);

      const updates = {
        branch: validation.valid ? validation.branch : repo.branch,
        remoteUrl: validation.valid ? validation.remoteUrl : repo.remoteUrl,
        filesChanged: statusRes.summary.total,
        status: !validation.valid ? 'FAILED' : (statusRes.hasChanges ? 'CHANGES' : 'READY'),
        lastScanAt: new Date().toISOString(),
      };

      await databaseService.updateRepository(id, updates);
      const repos = await databaseService.getRepositories();
      set({ repositories: repos });
    } catch (err) {
      console.error(`Failed to scan repo ${repo.name}:`, err);
    }
  },

  scanAll: async () => {
    set({ isScanningAll: true });
    const repos = get().repositories;
    for (const repo of repos) {
      await get().scanRepository(repo.id);
    }
    set({ isScanningAll: false });
  },
}));
