/**
 * Desktop Bridge Adapter
 * Provides unified interface between UI and Desktop runtime (Tauri or Local Dev Bridge).
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
        return await invoke('check_git');
      } catch (err) {
        console.error('Tauri check_git error:', err);
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
   * Scan parent directory for subfolders that are Git repositories
   */
  async scanWorkspace(directoryPath) {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke('scan_workspace', { directoryPath });
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
        new Notification(title, { body, icon: '/logo.svg' });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, { body, icon: '/logo.svg' });
          }
        });
      }
    } catch (e) {
      console.warn('Notification failed:', e);
    }
  },
};
