const { app } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

/**
 * Production Auto-Updater Service for GitPilot
 * Uses electron-updater with GitHub Releases provider.
 */

let mainWindowRef = null;
let trayRef = null;
let checkTimer = null;
let isGitLocked = false;

// In-Memory Update State Machine
let updateState = {
  status: 'IDLE', // IDLE | CHECKING | AVAILABLE | NOT_AVAILABLE | DOWNLOADING | DOWNLOADED | INSTALLING | ERROR
  currentVersion: (app && app.getVersion && app.getVersion()) || require('../package.json').version || '1.0.0',
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
};

function initUpdater(mainWindow, tray) {
  mainWindowRef = mainWindow;
  trayRef = tray;

  try {
    // Configure GitHub Releases provider feed
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'ashwath2005',
      repo: 'GitPilot',
    });

    // Configure autoUpdater for seamless automatic updates
    autoUpdater.logger = console;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = updateState.channel === 'beta' || updateState.channel === 'alpha';
    autoUpdater.allowDowngrade = false;
    autoUpdater.forceDevUpdateConfig = true;
  } catch (err) {
    console.warn('[AutoUpdater] Config warning:', err?.message || err);
  }

  // Event Listeners
  autoUpdater.on('checking-for-update', () => {
    updateState.status = 'CHECKING';
    updateState.error = null;
    broadcastStatus();
  });

  autoUpdater.on('update-available', (info) => {
    updateState.status = 'AVAILABLE';
    updateState.latestVersion = info.version;
    updateState.releaseNotes = typeof info.releaseNotes === 'string' 
      ? info.releaseNotes 
      : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((n) => n.note).join('\n')
        : '';
    updateState.releaseDate = info.releaseDate || new Date().toISOString();
    updateState.lastChecked = new Date().toISOString();
    broadcastStatus();

    // Notify via Tray balloon if available
    if (trayRef) {
      trayRef.displayBalloon({
        title: `GitPilot Update Available (v${info.version})`,
        content: `A new version of GitPilot is available. Click to open and view release details.`,
      });
    }

    // Auto-download if enabled
    if (updateState.autoDownload) {
      downloadUpdate();
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    updateState.status = 'NOT_AVAILABLE';
    updateState.latestVersion = info?.version || updateState.currentVersion;
    updateState.lastChecked = new Date().toISOString();
    updateState.error = null;
    broadcastStatus();
  });

  autoUpdater.on('download-progress', (progressObj) => {
    updateState.status = 'DOWNLOADING';
    const percent = Math.round(progressObj.percent || 0);
    const bytesPerSecond = progressObj.bytesPerSecond || 0;
    const total = progressObj.total || 0;
    const transferred = progressObj.transferred || 0;
    const remainingBytes = Math.max(0, total - transferred);
    const estimatedRemainingSec = bytesPerSecond > 0 ? Math.round(remainingBytes / bytesPerSecond) : 0;

    updateState.downloadProgress = {
      percent,
      bytesPerSecond,
      transferred,
      total,
      estimatedRemainingSec,
    };
    broadcastStatus();
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateState.status = 'DOWNLOADED';
    updateState.latestVersion = info.version;
    broadcastStatus();

    if (trayRef) {
      trayRef.displayBalloon({
        title: `GitPilot Update Ready (v${info.version})`,
        content: `Update downloaded successfully. Restart GitPilot to complete the installation.`,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    // Graceful error handling - never crash or block the application
    console.warn('[AutoUpdater] Update check notice:', err?.message || err);
    updateState.status = 'ERROR';
    updateState.error = err?.message || 'Unable to check for updates. GitPilot is still working normally.';
    updateState.lastChecked = new Date().toISOString();
    broadcastStatus();
  });
}

function broadcastStatus() {
  try {
    if (mainWindowRef && !mainWindowRef.isDestroyed() && mainWindowRef.webContents && !mainWindowRef.webContents.isDestroyed()) {
      mainWindowRef.webContents.send('update-status-changed', updateState);
    }
  } catch (err) {
    console.warn('[AutoUpdater] Broadcast warning:', err?.message || err);
  }
}

async function checkForUpdates(manual = false) {
  if (updateState.status === 'CHECKING' || updateState.status === 'DOWNLOADING') {
    return { success: false, message: 'Update check or download already in progress', state: updateState };
  }

  updateState.status = 'CHECKING';
  updateState.error = null;
  broadcastStatus();

  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, result, state: updateState };
  } catch (err) {
    updateState.status = 'ERROR';
    updateState.error = err.message || 'Unable to connect to update server';
    updateState.lastChecked = new Date().toISOString();
    broadcastStatus();
    return { success: false, error: updateState.error, state: updateState };
  }
}

async function downloadUpdate() {
  if (updateState.status === 'DOWNLOADING') {
    return { success: false, message: 'Download already running', state: updateState };
  }

  try {
    updateState.status = 'DOWNLOADING';
    broadcastStatus();
    await autoUpdater.downloadUpdate();
    return { success: true, state: updateState };
  } catch (err) {
    updateState.status = 'ERROR';
    updateState.error = err.message || 'Failed to download update package';
    broadcastStatus();
    return { success: false, error: updateState.error, state: updateState };
  }
}

function installUpdate(force = false) {
  if (updateState.status !== 'DOWNLOADED') {
    return { success: false, message: 'No update downloaded yet', state: updateState };
  }

  // Safe timing guard: Check if active Git operations are in flight
  if (isGitLocked && !force) {
    return {
      success: false,
      deferred: true,
      message: 'Git operation in progress (commit, push, or scan). Update will install after completion.',
      state: updateState,
    };
  }

  updateState.status = 'INSTALLING';
  broadcastStatus();

  // Quit and install with silent = false, isForceRunAfter = true
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 500);

  return { success: true, message: 'Restarting to install update...', state: updateState };
}

function getStatus() {
  return updateState;
}

function setGitOperationLock(locked) {
  isGitLocked = Boolean(locked);
}

function updateConfig(newConfig = {}) {
  if (typeof newConfig.autoCheck === 'boolean') {
    updateState.autoCheck = newConfig.autoCheck;
  }
  if (typeof newConfig.autoDownload === 'boolean') {
    updateState.autoDownload = newConfig.autoDownload;
  }
  if (typeof newConfig.installOnQuit === 'boolean') {
    updateState.installOnQuit = newConfig.installOnQuit;
    autoUpdater.autoInstallOnAppQuit = newConfig.installOnQuit;
  }
  if (newConfig.channel && ['stable', 'beta', 'alpha'].includes(newConfig.channel)) {
    updateState.channel = newConfig.channel;
    autoUpdater.allowPrerelease = newConfig.channel === 'beta' || newConfig.channel === 'alpha';
  }
  return updateState;
}

function startPeriodicChecks(intervalHours = 6) {
  if (checkTimer) clearInterval(checkTimer);
  const ms = intervalHours * 60 * 60 * 1000;

  // Run silent check 6 seconds after launch
  setTimeout(() => {
    if (updateState.autoCheck) {
      checkForUpdates(false).catch((e) => console.warn('[AutoUpdater] Startup check:', e.message));
    }
  }, 6000);

  checkTimer = setInterval(() => {
    if (updateState.autoCheck) {
      checkForUpdates(false).catch((e) => console.warn('[AutoUpdater] Periodic check:', e.message));
    }
  }, ms);
}

module.exports = {
  initUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getStatus,
  setGitOperationLock,
  updateConfig,
  startPeriodicChecks,
};
