import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Custom local dev bridge plugin to execute real Git CLI commands and local filesystem operations
function localDesktopBridgePlugin() {
  return {
    name: 'gitpilot-desktop-bridge',
    configureServer(server) {
      server.middlewares.use('/api/desktop-bridge', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { action, payload } = JSON.parse(body || '{}');

            if (action === 'git-exec') {
              const { cwd, command } = payload;
              // Validate that git executable is used safely
              if (!command.startsWith('git ')) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'Only git commands are allowed' }));
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

            if (action === 'scan-workspace') {
              const { directoryPath } = payload;
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
                  results.push({
                    name: item.name,
                    path: fullPath,
                    isGit,
                  });
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, repositories: results }));
              return;
            }

            if (action === 'check-git') {
              try {
                const { stdout } = await execAsync('git --version');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, version: stdout.trim() }));
              } catch (err) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Git is not installed or not in PATH' }));
              }
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Unknown action' }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localDesktopBridgePlugin()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
});
