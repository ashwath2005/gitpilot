import { desktopBridge } from '../desktopBridge';

/**
 * Git Service
 * Native Git CLI abstraction layer. Never assumes main/master/origin.
 */
export const gitService = {
  /**
   * Validate if a directory is a valid git repository
   */
  async validateRepository(path) {
    if (!path || typeof path !== 'string') {
      return { valid: false, error: 'Repository path is required' };
    }

    const check = await desktopBridge.runGit(path, 'git rev-parse --is-inside-work-tree');
    if (!check.success || !check.stdout.includes('true')) {
      return { valid: false, error: 'Not a valid Git repository' };
    }

    const branchRes = await this.getCurrentBranch(path);
    const remoteRes = await this.getRemoteUrl(path);

    return {
      valid: true,
      branch: branchRes.branch || 'HEAD',
      remoteUrl: remoteRes.remoteUrl || 'local',
      remoteName: remoteRes.remoteName || 'origin',
    };
  },

  /**
   * Get current checked-out branch dynamically
   */
  async getCurrentBranch(path) {
    const res = await desktopBridge.runGit(path, 'git branch --show-current');
    if (res.success && res.stdout.trim()) {
      return { branch: res.stdout.trim() };
    }

    // Fallback if in detached head
    const headRes = await desktopBridge.runGit(path, 'git rev-parse --abbrev-ref HEAD');
    if (headRes.success && headRes.stdout.trim()) {
      return { branch: headRes.stdout.trim() };
    }

    return { branch: 'main' };
  },

  /**
   * Get remote url dynamically (origin or first available)
   */
  async getRemoteUrl(path) {
    const originRes = await desktopBridge.runGit(path, 'git remote get-url origin');
    if (originRes.success && originRes.stdout.trim()) {
      return { remoteName: 'origin', remoteUrl: originRes.stdout.trim() };
    }

    // Get list of remotes
    const listRes = await desktopBridge.runGit(path, 'git remote');
    if (listRes.success && listRes.stdout.trim()) {
      const firstRemote = listRes.stdout.trim().split('\n')[0].trim();
      const urlRes = await desktopBridge.runGit(path, `git remote get-url ${firstRemote}`);
      if (urlRes.success && urlRes.stdout.trim()) {
        return { remoteName: firstRemote, remoteUrl: urlRes.stdout.trim() };
      }
    }

    return { remoteName: null, remoteUrl: 'No remote configured' };
  },

  /**
   * Get parsed git status
   */
  async getStatus(path) {
    const res = await desktopBridge.runGit(path, 'git status --porcelain');
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
        status = 'modified';
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
   * Get diff for unstaged and staged files
   */
  async getDiff(path, targetFile = null) {
    const fileArg = targetFile ? ` -- "${targetFile}"` : '';
    const unstaged = await desktopBridge.runGit(path, `git diff${fileArg}`);
    const staged = await desktopBridge.runGit(path, `git diff --cached${fileArg}`);
    const statRes = await desktopBridge.runGit(path, `git diff --stat${fileArg}`);

    return {
      success: true,
      unstagedDiff: unstaged.stdout || '',
      stagedDiff: staged.stdout || '',
      combinedDiff: (staged.stdout || '') + '\n' + (unstaged.stdout || ''),
      stat: statRes.stdout || '',
    };
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
   * Safe staging of changes (respecting secrets and gitignore)
   */
  async stageAll(path) {
    return await desktopBridge.runGit(path, 'git add -A');
  },

  /**
   * Commit staged changes with message
   */
  async commit(path, message) {
    if (!message || !message.trim()) {
      return { success: false, error: 'Commit message cannot be empty' };
    }
    // Safe escaping for command line
    const sanitizedMsg = message.replace(/"/g, '\\"');
    return await desktopBridge.runGit(path, `git commit -m "${sanitizedMsg}"`);
  },

  /**
   * Push to detected remote and branch safely (NEVER using --force)
   */
  async push(path, remote = 'origin', branch = 'main') {
    const targetBranch = branch || 'main';
    const targetRemote = remote || 'origin';

    // First check if remote exists
    const checkRemote = await desktopBridge.runGit(path, `git remote get-url ${targetRemote}`);
    if (!checkRemote.success) {
      return {
        success: false,
        error: `Remote "${targetRemote}" not configured or unreachable`,
        category: 'RemoteNotFound',
      };
    }

    const pushRes = await desktopBridge.runGit(path, `git push ${targetRemote} ${targetBranch}`);
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
