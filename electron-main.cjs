const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const updater = require('./electron/updater.cjs');

const execAsync = promisify(exec);

// Protect process from unhandled errors
process.on('uncaughtException', (err) => {
  console.warn('[Process] Uncaught exception:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Process] Unhandled rejection:', reason?.message || reason);
});

let mainWindow = null;
let tray = null;
let localHttpServer = null;
let serverPort = 5173;
let isQuitting = false;

// Standalone Production HTTP Bridge for Local Git Operations, Updates & Static Assets
function startEmbeddedProductionServer() {
  const distDir = path.join(__dirname, 'dist');

  localHttpServer = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Auto-Updater API
    if (req.url.startsWith('/api/updates')) {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/api/updates/status' && req.method === 'GET') {
        res.end(JSON.stringify(updater.getStatus()));
        return;
      }

      if (req.url === '/api/updates/check' && req.method === 'POST') {
        const result = await updater.checkForUpdates(true);
        res.end(JSON.stringify(result));
        return;
      }

      if (req.url === '/api/updates/download' && req.method === 'POST') {
        const result = await updater.downloadUpdate();
        res.end(JSON.stringify(result));
        return;
      }

      if (req.url === '/api/updates/install' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const { force } = JSON.parse(body || '{}');
          const result = updater.installUpdate(Boolean(force));
          res.end(JSON.stringify(result));
        });
        return;
      }

      if (req.url === '/api/updates/config' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const config = JSON.parse(body || '{}');
          const result = updater.updateConfig(config);
          res.end(JSON.stringify(result));
        });
        return;
      }

      if (req.url === '/api/updates/lock' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const { locked } = JSON.parse(body || '{}');
          updater.setGitOperationLock(locked);
          res.end(JSON.stringify({ success: true, locked: Boolean(locked) }));
        });
        return;
      }

      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
      return;
    }

    // Git Desktop Bridge API
    if (req.url === '/api/desktop-bridge' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        try {
          const { action, payload } = JSON.parse(body || '{}');

          if (action === 'git-exec') {
            let { cwd, command } = payload;
            if (cwd) cwd = path.resolve(cwd.replace(/^["']|["']$/g, '').trim());

            if (!command || !command.startsWith('git ')) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Only git commands allowed' }));
              return;
            }

            try {
              const { stdout, stderr } = await execAsync(command, {
                cwd: cwd || process.cwd(),
                maxBuffer: 10 * 1024 * 1024,
                windowsHide: true,
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, stdout, stderr }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: err.message,
                stdout: err.stdout || '',
                stderr: err.stderr || '',
                exitCode: err.code || 1,
              }));
            }
            return;
          }

          if (action === 'check-git') {
            try {
              const { stdout } = await execAsync('git --version');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, version: stdout.trim() }));
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Git not found in PATH' }));
            }
            return;
          }

          if (action === 'scan-workspace') {
            let { directoryPath } = payload;
            if (directoryPath) directoryPath = path.resolve(directoryPath.replace(/^["']|["']$/g, '').trim());

            if (!fs.existsSync(directoryPath)) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Directory does not exist' }));
              return;
            }

            const items = fs.readdirSync(directoryPath, { withFileTypes: true });
            const results = [];
            for (const item of items) {
              if (item.isDirectory()) {
                const fullPath = path.join(directoryPath, item.name);
                const isGit = fs.existsSync(path.join(fullPath, '.git'));
                results.push({ name: item.name, path: fullPath, isGit });
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, repositories: results }));
            return;
          }

          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Unknown action' }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Serve Static UI Assets
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    try {
      const data = fs.readFileSync(filePath);
      res.setHeader('Content-Type', contentType);
      res.end(data);
    } catch (e) {
      res.statusCode = 404;
      res.end('Not found');
    }
  });

  const DEFAULT_PORT = 51734;

  return new Promise((resolve, reject) => {
    function tryPort(port) {
      localHttpServer.removeAllListeners('error');
      localHttpServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${port} in use, trying ${port + 1}...`);
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });
      localHttpServer.listen(port, '127.0.0.1', () => {
        serverPort = localHttpServer.address().port;
        resolve(`http://127.0.0.1:${serverPort}`);
      });
    }

    tryPort(DEFAULT_PORT);
  });
}

async function createWindow() {
  const iconPath = path.join(__dirname, 'src-tauri', 'icons', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#050505',
    title: 'GitPilot — Your Autonomous Git Workspace',
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const appUrl = await startEmbeddedProductionServer();
  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray) {
        tray.displayBalloon({
          title: 'GitPilot Minimized',
          content: 'GitPilot is running in the background tray.',
        });
      }
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'src-tauri', 'icons', 'icon.ico');
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('GitPilot — Autonomous Git Workspace');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open GitPilot',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Check for Updates...',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
          updater.checkForUpdates(true).catch((e) => console.warn('Tray update check:', e.message));
        },
      },
      { type: 'separator' },
      {
        label: 'Quit GitPilot',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.warn('Tray init error:', e);
  }
}

app.whenReady().then(async () => {
  await createWindow();
  createTray();

  // Initialize Auto-Updater
  updater.initUpdater(mainWindow, tray);
  updater.startPeriodicChecks(6);

  // Background update check delayed after initial application load (15 seconds)
  setTimeout(() => {
    if (updater.getStatus().autoCheck) {
      updater.checkForUpdates(false).catch((e) => console.warn('[AutoUpdater] Initial check notice:', e.message));
    }
  }, 15000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (localHttpServer) {
    localHttpServer.close();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
