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
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import { AuthModal } from '../components/auth/AuthModal';
import { SuspendedModal } from '../components/auth/SuspendedModal';
import { UpdateModal } from '../components/update/UpdateModal';
import { UpdateBanner } from '../components/update/UpdateBanner';
import { SplashScreen } from '../components/common/SplashScreen';

import { useProjectStore } from '../store/projectStore';
import { useSettingsStore } from '../store/settingsStore';
import { useQueueStore } from '../store/queueStore';
import { useAuthStore } from '../store/authStore';
import { useUpdateStore } from '../store/updateStore';
import { schedulerEngine } from '../services/scheduler/schedulerEngine';
import { desktopBridge } from '../services/desktopBridge';
import { databaseService } from '../services/database/databaseService';

function AppContent() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [gitStatus, setGitStatus] = useState({ valid: true, version: 'Checking...' });

  // Modal States
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeDiffRepo, setActiveDiffRepo] = useState(null);
  const [activeCommitRepo, setActiveCommitRepo] = useState(null);

  const { fetchRepositories, scanAll, isScanningAll, repositories } = useProjectStore();
  const { fetchSettings, settings } = useSettingsStore();
  const { enqueueRepositories, isProcessing: isQueueProcessing } = useQueueStore();
  const { initializeAuth, isSuspended } = useAuthStore();
  const { fetchStatus: fetchUpdateStatus } = useUpdateStore();

  // Keep updater informed of active Git operations to prevent interrupting commits/pushes
  useEffect(() => {
    desktopBridge.setGitOperationLock(isScanningAll || isQueueProcessing);
  }, [isScanningAll, isQueueProcessing]);

  useEffect(() => {
    // Initial data, cloud session, and updater load
    initializeAuth();
    fetchSettings();
    fetchUpdateStatus();

    fetchRepositories().then((repos) => {
      // Check if onboarding completed or if workspace is brand new / reset
      if (!databaseService.isOnboardingCompleted() || !repos || repos.length === 0) {
        setIsOnboardingOpen(true);
      }
    });

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
  }, [initializeAuth, fetchRepositories, fetchSettings]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when inside inputs or textareas (unless ⌘K or ⌘,)
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      // ⌘K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // ⌘, -> Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        navigate('/settings');
        return;
      }

      if (isInput) return;

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
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <Header
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

      {/* Account Suspended Wall */}
      <SuspendedModal isOpen={isSuspended} />

      {/* Auto-Updater Dialog & Floating Notice Banner */}
      <UpdateModal />
      <UpdateBanner />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* First-Launch Onboarding */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          databaseService.setOnboardingCompleted(true);
          setIsOnboardingOpen(false);
        }}
      />

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
