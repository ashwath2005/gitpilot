/**
 * Unified Desktop Bridge Adapter
 * Provides a production-grade abstraction between React UI and desktop runtime (Tauri 2 or local dev bridge).
 */

const isTauri = typeof window !== 'undefined' && (Boolean(window.__TAURI_INTERNALS__) || Boolean(window.__TAURI__));

export const desktopBridge = {
  isTauri,

  /**
   * Check if Git is installed and get version string
   */
  async checkGit() {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke('check_git');
        if (res && res.success) {
          return { success: true, version: res.stdout.trim() };
        }
        return { success: false, error: res?.error || 'Git not found' };
      } catch (err) {
        console.error('Tauri check_git error:', err);
        return { success: false, error: err.toString() };
      }
    }

    // Local dev bridge fallback
    try {
      const res = await fetch('/api/desktop-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-git' }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Cannot connect to desktop bridge' };
    }
  },

  /**
   * Run a native Git CLI command in a given working directory
   */
  async runGit(cwd, command) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('run_git_command', { cwd, command });
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }

    try {
      const res = await fetch('/api/desktop-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'git-exec',
          payload: { cwd, command },
        }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Validate if repository is valid Git root
   */
  async validateRepository(cwd) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke('git_validate_repository', { cwd });
        return {
          valid: res.valid,
          branch: res.branch,
          remoteUrl: res.remote_url,
          remoteName: res.remote_name,
          error: res.error,
        };
      } catch (err) {
        return { valid: false, error: err.toString() };
      }
    }

    // Fallback via CLI runner
    const check = await this.runGit(cwd, 'git rev-parse --is-inside-work-tree');
    if (!check.success || !check.stdout.includes('true')) {
      return { valid: false, error: 'Not a valid Git repository' };
    }
    const branchRes = await this.runGit(cwd, 'git branch --show-current');
    const originRes = await this.runGit(cwd, 'git remote get-url origin');
    return {
      valid: true,
      branch: branchRes.stdout?.trim() || 'main',
      remoteUrl: originRes.stdout?.trim() || 'local',
      remoteName: 'origin',
    };
  },

  /**
   * Get parsed git status
   */
  async getStatus(cwd) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke('git_status', { cwd });
        return {
          success: res.success,
          hasChanges: res.has_changes,
          files: res.files || [],
          summary: res.summary || { modified: 0, added: 0, deleted: 0, untracked: 0, renamed: 0, total: 0 },
          error: res.error,
        };
      } catch (err) {
        return { success: false, error: err.toString(), files: [], summary: { total: 0 } };
      }
    }

    const res = await this.runGit(cwd, 'git status --porcelain');
    if (!res.success) {
      return {
        success: false,
        error: res.error || 'Failed to read git status',
        files: [],
        summary: { modified: 0, added: 0, deleted: 0, untracked: 0, renamed: 0, total: 0 },
      };
    }

    const lines = res.stdout.split('\n').filter(Boolean);
    const files = [];
    const summary = { modified: 0, added: 0, deleted: 0, untracked: 0, renamed: 0, total: 0 };

    for (const line of lines) {
      const code = line.substring(0, 2);
      const filePath = line.substring(3).trim();
      let status = 'modified';
      if (code.includes('?')) {
        status = 'untracked';
        summary.untracked++;
      } else if (code.includes('A')) {
        status = 'added';
        summary.added++;
      } else if (code.includes('D')) {
        status = 'deleted';
        summary.deleted++;
      } else if (code.includes('R')) {
        status = 'renamed';
        summary.renamed++;
      } else {
        summary.modified++;
      }
      summary.total++;
      files.push({
        status,
        code,
        path: filePath,
        staged: code[0] !== ' ' && code[0] !== '?',
      });
    }

    return {
      success: true,
      files,
      summary,
      hasChanges: files.length > 0,
    };
  },

  /**
   * Get diff for repository
   */
  async getDiff(cwd, targetFile = null) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke('git_diff', { cwd, targetFile: targetFile || null });
        return {
          success: res.success,
          unstagedDiff: res.unstaged_diff,
          stagedDiff: res.staged_diff,
          combinedDiff: res.combined_diff,
          stat: res.stat,
        };
      } catch (err) {
        return { success: false, error: err.toString(), unstagedDiff: '', stagedDiff: '', combinedDiff: '', stat: '' };
      }
    }

    const fileArg = targetFile ? ` -- "${targetFile}"` : '';
    const unstaged = await this.runGit(cwd, `git diff${fileArg}`);
    const staged = await this.runGit(cwd, `git diff --cached${fileArg}`);
    const statRes = await this.runGit(cwd, `git diff --stat${fileArg}`);

    return {
      success: true,
      unstagedDiff: unstaged.stdout || '',
      stagedDiff: staged.stdout || '',
      combinedDiff: (staged.stdout || '') + '\n' + (unstaged.stdout || ''),
      stat: statRes.stdout || '',
    };
  },

  /**
   * Stage all changes
   */
  async stageAll(cwd) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('git_stage_all', { cwd });
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
    return await this.runGit(cwd, 'git add -A');
  },

  /**
   * Commit with message
   */
  async commit(cwd, message) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('git_commit', { cwd, message });
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
    const sanitizedMsg = message.replace(/"/g, '\\"');
    return await this.runGit(cwd, `git commit -m "${sanitizedMsg}"`);
  },

  /**
   * Push changes
   */
  async push(cwd, remote = 'origin', branch = 'main') {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('git_push', { cwd, remote: remote || 'origin', branch: branch || 'main' });
      } catch (err) {
        return { success: false, error: err.toString() };
      }
    }
    return await this.runGit(cwd, `git push ${remote || 'origin'} ${branch || 'main'}`);
  },

  /**
   * Scan parent directory for Git workspaces
   */
  async scanWorkspace(directoryPath) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const res = await invoke('scan_workspace', { directoryPath });
        return {
          success: res.success,
          repositories: res.repositories.map((r) => ({
            name: r.name,
            path: r.path,
            isGit: r.is_git,
          })),
        };
      } catch (err) {
        return { success: false, error: err.toString(), repositories: [] };
      }
    }

    try {
      const res = await fetch('/api/desktop-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan-workspace',
          payload: { directoryPath },
        }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message, repositories: [] };
    }
  },

  /**
   * Native OS directory picker dialog
   */
  async selectDirectory() {
    if (isTauri) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Select Workspace Directory',
        });
        return selected || null;
      } catch (e) {
        console.warn('Dialog error:', e);
      }
    }
    return null;
  },

  /**
   * Secure API key storage
   */
  async setSecureApiKey(key) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('set_api_key', { key });
      } catch (e) {
        console.warn('Set API key error:', e);
      }
    }
    sessionStorage.setItem('gp_vault_token', btoa(key));
    return true;
  },

  async hasSecureApiKey() {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('has_api_key');
      } catch (e) {
        return false;
      }
    }
    return Boolean(sessionStorage.getItem('gp_vault_token'));
  },

  async removeSecureApiKey() {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('remove_api_key');
      } catch (e) {
        console.warn('Remove API key error:', e);
      }
    }
    sessionStorage.removeItem('gp_vault_token');
    return true;
  },

  /**
   * Native OS notification
   */
  async sendNotification(title, body) {
    try {
      if (isTauri) {
        const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
        let permission = await isPermissionGranted();
        if (!permission) {
          const status = await requestPermission();
          permission = status === 'granted';
        }
        if (permission) {
          sendNotification({ title, body });
          return;
        }
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/gitpilot_logo.png' });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/gitpilot_logo.png' });
          }
        });
      }
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  },

  /**
   * Auto-Updater Desktop Methods
   */
  async getUpdateStatus() {
    try {
      const res = await fetch('/api/updates/status');
      if (!res.ok) throw new Error('Status fetch failed');
      return await res.json();
    } catch (e) {
      return { status: 'IDLE', error: e.message };
    }
  },

  async checkForUpdates(manual = true) {
    try {
      const res = await fetch('/api/updates/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual }),
      });
      return await res.json();
    } catch (e) {
      return {
        success: false,
        error: 'Unable to connect to update service. GitPilot is still working normally.',
        state: { status: 'ERROR', error: e.message },
      };
    }
  },

  async downloadUpdate() {
    try {
      const res = await fetch('/api/updates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async installUpdate(force = false) {
    try {
      const res = await fetch('/api/updates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async saveUpdateConfig(config) {
    try {
      const res = await fetch('/api/updates/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return await res.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  async setGitOperationLock(locked) {
    try {
      await fetch('/api/updates/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked }),
      });
    } catch (e) {
      // Non-blocking
    }
  },
};
