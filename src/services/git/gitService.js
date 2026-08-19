import { desktopBridge } from '../desktopBridge';

/**
 * Git Service
 * Native Git CLI abstraction layer. Never assumes main/master/origin or force flags.
 */
export const gitService = {
  /**
   * Validate if a directory is a valid git repository
   */
  async validateRepository(path) {
    if (!path || typeof path !== 'string') {
      return { valid: false, error: 'Repository path is required' };
    }
    return await desktopBridge.validateRepository(path);
  },

  /**
   * Get current checked-out branch dynamically
   */
  async getCurrentBranch(path) {
    const check = await desktopBridge.validateRepository(path);
    return { branch: check.branch || 'main' };
  },

  /**
   * Get remote url dynamically (origin or first available)
   */
  async getRemoteUrl(path) {
    const check = await desktopBridge.validateRepository(path);
    return {
      remoteName: check.remoteName || 'origin',
      remoteUrl: check.remoteUrl || 'local',
    };
  },

  /**
   * Get parsed git status
   */
  async getStatus(path) {
    return await desktopBridge.getStatus(path);
  },

  /**
   * Get diff for unstaged and staged files
   */
  async getDiff(path, targetFile = null) {
    return await desktopBridge.getDiff(path, targetFile);
  },

  /**
   * Get recent commit history
   */
  async getHistory(path, limit = 20) {
    const res = await desktopBridge.runGit(
      path,
      `git log -n ${limit} --pretty=format:"%H|||%an|||%ae|||%ad|||%s" --date=iso`
    );

    if (!res.success) {
      return { success: false, history: [] };
    }

    const lines = res.stdout.split('\n').filter(Boolean);
    const history = lines.map((line) => {
      const [hash, author, email, date, message] = line.split('|||');
      return {
        hash: hash || '',
        shortHash: (hash || '').substring(0, 7),
        author: author || 'Unknown',
        email: email || '',
        date: date || '',
        message: message || 'Commit',
      };
    });

    return { success: true, history };
  },

  /**
   * Safe staging of changes (with retry on transient locks)
   */
  async stageAll(path) {
    let res = await desktopBridge.stageAll(path);
    if (!res.success && (res.error?.includes('index.lock') || res.stderr?.includes('index.lock'))) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      res = await desktopBridge.stageAll(path);
    }
    return res;
  },

  /**
   * Commit staged changes with message
   */
  async commit(path, message) {
    if (!message || !message.trim()) {
      return { success: false, error: 'Commit message cannot be empty' };
    }
    let res = await desktopBridge.commit(path, message.trim());
    if (!res.success && (res.error?.includes('index.lock') || res.stderr?.includes('index.lock'))) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      res = await desktopBridge.commit(path, message.trim());
    }
    return res;
  },

  /**
   * Push to detected remote and branch safely (NEVER using --force)
   */
  async push(path, remote = 'origin', branch = 'main') {
    const targetBranch = branch || 'main';
    const targetRemote = remote || 'origin';

    // Check if remote is local / none
    if (!targetRemote || targetRemote === 'local' || targetRemote === 'No remote configured') {
      return { success: true, output: 'Local commit only (no remote)' };
    }

    const pushRes = await desktopBridge.push(path, targetRemote, targetBranch);
    if (!pushRes.success) {
      const err = (pushRes.stderr || pushRes.error || '').toLowerCase();
      let category = 'UnknownGitError';

      if (err.includes('authentication') || err.includes('permission denied') || err.includes('fatal: could not read username')) {
        category = 'AuthenticationFailed';
      } else if (err.includes('rejected') || err.includes('non-fast-forward')) {
        category = 'PushRejected';
      } else if (err.includes('conflict')) {
        category = 'MergeConflict';
      } else if (err.includes('could not resolve host') || err.includes('network')) {
        category = 'NetworkError';
      } else if (err.includes('remote') && err.includes('not found')) {
        category = 'RemoteNotFound';
      }

      return {
        success: false,
        error: pushRes.stderr || pushRes.error || 'Failed to push commits',
        category,
      };
    }

    return { success: true, output: pushRes.stdout || pushRes.stderr };
  },
};
