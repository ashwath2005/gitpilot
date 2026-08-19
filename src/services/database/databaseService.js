/**
 * Local Database & Persistence Service
 * Manages local storage for repositories, history, schedules, onboarding, and settings.
 */

const STORAGE_KEYS = {
  REPOSITORIES: 'gitpilot_repositories',
  REMOVED_REPOS: 'gitpilot_removed_repos',
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

// Default discovered user project configurations
const DEFAULT_USER_REPOSITORIES = [
  {
    id: 'repo_dsa_vis',
    name: 'DSA VIS (ALGO3D)',
    path: 'D:\\DSA VIS',
    remoteUrl: 'git@github.com:ashwath2005/ALGO3D-.git',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'READY',
    filesChanged: 0,
  },
  {
    id: 'repo_anburajan_uncle',
    name: 'Anburajan Uncle',
    path: 'D:\\Anburajan Uncle',
    remoteUrl: 'https://github.com/ashwath2005/anburajan-uncle.git',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'CHANGES',
    filesChanged: 136,
  },
  {
    id: 'repo_portfolio',
    name: 'Portfolio',
    path: 'D:\\Portfolio',
    remoteUrl: 'git@github.com:ashwath2005/portfolio.git',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'READY',
    filesChanged: 0,
  },
  {
    id: 'repo_genai_capstone',
    name: 'FRESH GENAI CAPSTONE PROJECT',
    path: 'D:\\FRESH GENAI CAPSTONE PROJECT',
    remoteUrl: 'git@github.com:ashwath2005/archon-ai-governance-hub.git',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'CHANGES',
    filesChanged: 1,
  },
  {
    id: 'repo_final_year',
    name: 'Final Year',
    path: 'D:\\FInal Year',
    remoteUrl: 'local',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'READY',
    filesChanged: 0,
  },
  {
    id: 'repo_gitpilot',
    name: 'GitPilot',
    path: 'd:\\GitPilot',
    remoteUrl: 'local',
    remoteName: 'origin',
    branch: 'main',
    enabled: true,
    status: 'READY',
    filesChanged: 0,
  },
];

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
    const removedRaw = localStorage.getItem(STORAGE_KEYS.REMOVED_REPOS);
    const removedSet = new Set(removedRaw ? JSON.parse(removedRaw) : []);

    let repos = raw ? JSON.parse(raw) : [];

    // Automatically ensure discovered user workspaces are included unless explicitly deleted
    let updated = false;
    for (const defaultRepo of DEFAULT_USER_REPOSITORIES) {
      if (removedSet.has(defaultRepo.id) || removedSet.has(defaultRepo.path.toLowerCase())) {
        continue;
      }
      const exists = repos.some(
        (r) => (r.path || '').toLowerCase() === defaultRepo.path.toLowerCase()
      );
      if (!exists) {
        repos.push({
          ...defaultRepo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastScanAt: new Date().toISOString(),
          lastPushAt: null,
        });
        updated = true;
      }
    }

    if (updated || !raw) {
      localStorage.setItem(STORAGE_KEYS.REPOSITORIES, JSON.stringify(repos));
    }

    return repos;
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

    // Un-mark from removed list if user re-adds
    const removedRaw = localStorage.getItem(STORAGE_KEYS.REMOVED_REPOS);
    if (removedRaw) {
      const list = JSON.parse(removedRaw).filter(
        (p) => p !== repo.id && p !== repo.path.toLowerCase()
      );
      localStorage.setItem(STORAGE_KEYS.REMOVED_REPOS, JSON.stringify(list));
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
    const target = repos.find((r) => r.id === id);
    const filtered = repos.filter((r) => r.id !== id);

    if (target) {
      const removedRaw = localStorage.getItem(STORAGE_KEYS.REMOVED_REPOS);
      const list = removedRaw ? JSON.parse(removedRaw) : [];
      list.push(target.id);
      if (target.path) list.push(target.path.toLowerCase());
      localStorage.setItem(STORAGE_KEYS.REMOVED_REPOS, JSON.stringify(list));
    }

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
