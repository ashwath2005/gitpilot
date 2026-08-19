/**
 * Local Database & Persistence Service
 * Manages local storage for repositories, history, schedules, onboarding, and settings.
 */

const STORAGE_KEYS = {
  REPOSITORIES: 'gitpilot_repositories',
  SCHEDULES: 'gitpilot_schedules',
  PUSH_HISTORY: 'gitpilot_push_history',
  SETTINGS: 'gitpilot_settings',
  QUEUE: 'gitpilot_queue',
  LOGS: 'gitpilot_system_logs',
  ONBOARDING_COMPLETED: 'gitpilot_onboarding_completed',
};

const DEFAULT_SETTINGS = {
  autonomousMode: false,
  dryRunMode: false,
  enableAI: false,
  openaiApiKey: '',
  aiModel: 'gpt-4o-mini',
  launchOnStartup: false,
  startMinimized: false,
  minimizeToTray: true,
  defaultScheduleTime: '19:00',
  defaultFrequency: 'daily',
  retryCount: 3,
  notificationPushSuccess: true,
  notificationPushFailure: true,
  notificationSecurityAlert: true,
  theme: 'dark',
};

// Known legacy developer demo IDs from pre-v1.2 builds to purge from existing local storage
const LEGACY_DEV_REPO_IDS = new Set([
  'repo_dsa_vis',
  'repo_anburajan_uncle',
  'repo_portfolio',
  'repo_genai_capstone',
  'repo_final_year',
  'repo_gitpilot',
]);

export const databaseService = {
  // --- Onboarding ---
  isOnboardingCompleted() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
  },

  setOnboardingCompleted(completed = true) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, String(completed));
  },

  // --- Repositories ---
  async getRepositories() {
    const raw = localStorage.getItem(STORAGE_KEYS.REPOSITORIES);
    if (!raw) return [];
    try {
      const repos = JSON.parse(raw);
      if (Array.isArray(repos)) {
        // Automatically clean up previously cached development repositories
        const filtered = repos.filter((r) => !LEGACY_DEV_REPO_IDS.has(r.id));
        if (filtered.length !== repos.length) {
          localStorage.setItem(STORAGE_KEYS.REPOSITORIES, JSON.stringify(filtered));
          if (filtered.length === 0) {
            localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
          }
          return filtered;
        }
        return repos;
      }
      return [];
    } catch {
      return [];
    }
  },

  async clearAllRepositories() {
    localStorage.removeItem(STORAGE_KEYS.REPOSITORIES);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    return [];
  },

  async saveRepositories(repositories) {
    localStorage.setItem(STORAGE_KEYS.REPOSITORIES, JSON.stringify(repositories));
  },

  async addRepository(repo) {
    const repos = await this.getRepositories();
    const existing = repos.find((r) => r.path.toLowerCase() === repo.path.toLowerCase());
    if (existing) {
      return await this.updateRepository(existing.id, repo);
    }

    const newRepo = {
      id: repo.id || `repo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: repo.name || repo.path.split(/[\\/]/).filter(Boolean).pop() || 'Repository',
      path: repo.path,
      remoteUrl: repo.remoteUrl || 'local',
      remoteName: repo.remoteName || 'origin',
      branch: repo.branch || 'main',
      enabled: repo.enabled !== false,
      status: 'READY',
      statusMessage: '',
      filesChanged: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastScanAt: null,
      lastPushAt: null,
    };

    repos.push(newRepo);
    await this.saveRepositories(repos);
    return newRepo;
  },

  async updateRepository(id, updates) {
    const repos = await this.getRepositories();
    const index = repos.findIndex((r) => r.id === id);
    if (index !== -1) {
      repos[index] = { ...repos[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveRepositories(repos);
      return repos[index];
    }
    return null;
  },

  async deleteRepository(id) {
    const repos = await this.getRepositories();
    const filtered = repos.filter((r) => r.id !== id);
    await this.saveRepositories(filtered);
  },

  // --- Push History ---
  async getPushHistory() {
    const raw = localStorage.getItem(STORAGE_KEYS.PUSH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  },

  async recordPushHistory(entry) {
    const history = await this.getPushHistory();
    const newEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      repositoryId: entry.repositoryId,
      repositoryName: entry.repositoryName,
      commitHash: entry.commitHash || null,
      commitMessage: entry.commitMessage || '',
      status: entry.status,
      error: entry.error || null,
      filesChanged: entry.filesChanged || 0,
      createdAt: new Date().toISOString(),
    };

    history.unshift(newEntry);
    if (history.length > 1000) history.pop();
    localStorage.setItem(STORAGE_KEYS.PUSH_HISTORY, JSON.stringify(history));
    return newEntry;
  },

  // --- Schedules ---
  async getSchedules() {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      const defaultSchedule = [
        {
          id: 'sched_default_daily',
          name: 'Daily Evening Sync',
          time: '19:00',
          frequency: 'daily',
          enabled: true,
          repositoryIds: 'all',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(defaultSchedule));
      return defaultSchedule;
    }
    return JSON.parse(raw);
  },

  async saveSchedules(schedules) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  },

  // --- Settings ---
  async getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  },

  async saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // --- System Logs ---
  async getLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  async addLog(level, message, metadata = {}) {
    const logs = await this.getLogs();
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };
    logs.unshift(entry);
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    return entry;
  },

  async clearLogs() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  },
};
