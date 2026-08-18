import React, { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { StatusBar } from '../components/layout/StatusBar';
import { AppRoutes } from './routes';
import { AddProjectModal } from '../components/projects/AddProjectModal';
import { ScanWorkspaceModal } from '../components/projects/ScanWorkspaceModal';
import { DiffViewerModal } from '../components/projects/DiffViewerModal';
import { CommitPreviewModal } from '../components/projects/CommitPreviewModal';
import { CommandPaletteModal } from '../components/command-palette/CommandPaletteModal';

import { useProjectStore } from '../store/projectStore';
import { useSettingsStore } from '../store/settingsStore';
import { useQueueStore } from '../store/queueStore';
import { schedulerEngine } from '../services/scheduler/schedulerEngine';
import { desktopBridge } from '../services/desktopBridge';

function AppContent() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gitStatus, setGitStatus] = useState({ valid: true, version: 'Checking...' });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [activeDiffRepo, setActiveDiffRepo] = useState(null);
  const [activeCommitRepo, setActiveCommitRepo] = useState(null);

  const { fetchRepositories, scanAll, isScanningAll, repositories } = useProjectStore();
  const { fetchSettings, settings } = useSettingsStore();
  const { enqueueRepositories } = useQueueStore();

  useEffect(() => {
    // Initial data load
    fetchRepositories();
    fetchSettings();

    // Check Git environment
    desktopBridge.checkGit().then((res) => {
      if (res && res.success) {
        setGitStatus({ valid: true, version: res.version || 'Ready' });
      } else {
        setGitStatus({ valid: false, version: 'Not Found' });
      }
    });

    // Start background scheduler
    schedulerEngine.startScheduler();
    return () => schedulerEngine.stopScheduler();
  }, [fetchRepositories, fetchSettings]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }

      // ⌘, -> Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
      }

      // ⌘+Shift+S -> Scan All
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        scanAll();
      }

      // ⌘+Shift+P -> Push Changed
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const changed = repositories.filter((r) => r.status === 'CHANGES' || r.filesChanged > 0);
        enqueueRepositories(changed, { isDryRun: settings.dryRunMode, isAutonomous: settings.autonomousMode });
      }

      // ⌘1, ⌘2, ⌘3, ⌘4 -> Quick Nav
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        navigate('/');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        navigate('/projects');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        navigate('/activity');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '4') {
        e.preventDefault();
        navigate('/analytics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, scanAll, repositories, enqueueRepositories, settings]);

  const handlePushChanged = () => {
    const changed = repositories.filter((r) => r.status === 'CHANGES' || r.filesChanged > 0);
    enqueueRepositories(changed, { isDryRun: settings.dryRunMode, isAutonomous: settings.autonomousMode });
  };

  return (
    <div className="app-shell">
      <Header
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onScanAll={scanAll}
        onPushChanged={handlePushChanged}
        isScanningAll={isScanningAll}
      />

      <div className="app-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          gitStatus={gitStatus}
        />

        <main className="app-main">
          <AppRoutes
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanModal={() => setIsScanModalOpen(true)}
            onCommitPreview={(repo) => setActiveCommitRepo(repo)}
            onOpenDiff={(repo) => setActiveDiffRepo(repo)}
          />
        </main>
      </div>

      <StatusBar gitVersion={gitStatus.version} />

      {/* Global Modals */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ScanWorkspaceModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      <DiffViewerModal
        isOpen={Boolean(activeDiffRepo)}
        onClose={() => setActiveDiffRepo(null)}
        repository={activeDiffRepo}
      />

      <CommitPreviewModal
        isOpen={Boolean(activeCommitRepo)}
        onClose={() => setActiveCommitRepo(null)}
        repository={activeCommitRepo}
        onSuccess={() => fetchRepositories()}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
export default App;
