/**
 * Local Database & Persistence Service
 * Manages SQLite / IndexedDB local-first storage for repositories, history, schedules, and settings.
 */

const STORAGE_KEYS = {
  REPOSITORIES: 'gitpilot_repositories',
  SCHEDULES: 'gitpilot_schedules',
  PUSH_HISTORY: 'gitpilot_push_history',
  SETTINGS: 'gitpilot_settings',
  QUEUE: 'gitpilot_queue',
  LOGS: 'gitpilot_system_logs',
};

const DEFAULT_SETTINGS = {
  autonomousMode: false,
  dryRunMode: false,
  enableAI: false,
  openaiApiKey: '',
  aiModel: 'gpt-4o-mini',
  launchOnStartup: false,
  startMinimized: false,
  defaultScheduleTime: '19:00',
  defaultFrequency: 'daily',
  retryCount: 3,
  notificationPushSuccess: true,
  notificationPushFailure: true,
  notificationSecurityAlert: true,
  theme: 'dark',
};

export const databaseService = {
  // --- Repositories ---
  async getRepositories() {
    const raw = localStorage.getItem(STORAGE_KEYS.REPOSITORIES);
    return raw ? JSON.parse(raw) : [];
  },

  async saveRepositories(repositories) {
    localStorage.setItem(STORAGE_KEYS.REPOSITORIES, JSON.stringify(repositories));
  },

  async addRepository(repo) {
    const repos = await this.getRepositories();
    const existing = repos.find((r) => r.path === repo.path);
    if (existing) {
      throw new Error(`Repository at path "${repo.path}" is already registered`);
    }

    const newRepo = {
      id: repo.id || `repo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: repo.name || repo.path.split(/[\\/]/).pop(),
      path: repo.path,
      remoteUrl: repo.remoteUrl || 'local',
      remoteName: repo.remoteName || 'origin',
      branch: repo.branch || 'main',
      enabled: repo.enabled !== false,
      status: 'READY', // READY, CHANGES, ANALYZING, COMMITTING, PUSHING, SUCCESS, FAILED, NO_CHANGES
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
      status: entry.status, // SUCCESS, FAILED, NO_CHANGES, SKIPPED, CANCELLED
      error: entry.error || null,
      filesChanged: entry.filesChanged || 0,
      createdAt: new Date().toISOString(),
    };

    history.unshift(newEntry);
    // Keep last 1000 history entries
    if (history.length > 1000) history.pop();
    localStorage.setItem(STORAGE_KEYS.PUSH_HISTORY, JSON.stringify(history));
    return newEntry;
  },

  // --- Schedules ---
  async getSchedules() {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      // Create initial default daily 7:00 PM schedule
      const defaultSchedule = [
        {
          id: 'sched_default_daily',
          name: 'Daily Automation',
          time: '19:00',
          frequency: 'daily', // daily, weekdays, weekends, custom
          enabled: true,
          repositoryIds: 'all', // 'all' or array of IDs
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
      level, // INFO, WARN, ERROR, SUCCESS
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
