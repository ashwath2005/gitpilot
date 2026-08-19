import React from 'react';
import { Search, Play, RefreshCw, Plus, FolderSearch, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { UserMenu } from '../auth/UserMenu';

export function Header({
  onOpenCommandPalette,
  onOpenAddModal,
  onOpenScanModal,
  onOpenAuthModal,
  onScanAll,
  onPushChanged,
  isScanningAll,
}) {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <header className="app-header">
      {/* Search / Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-muted)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          width: '280px',
          cursor: 'pointer',
          fontSize: '12px',
          outline: 'none',
        }}
      >
        <Search size={14} />
        <span style={{ flex: 1, textAlign: 'left' }}>Search repositories or commands...</span>
        <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          ⌘K
        </kbd>
      </button>

      {/* Global Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Autonomous Mode Toggle */}
        <button
          onClick={() => updateSettings({ autonomousMode: !settings.autonomousMode })}
          className={`btn ${settings.autonomousMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          title={settings.autonomousMode ? 'Autonomous committing and pushing is ON' : 'Autonomous mode is OFF (manual approval required)'}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: settings.autonomousMode ? '#4ADE80' : 'var(--text-muted)' }} className={settings.autonomousMode ? 'pulse-dot' : ''} />
          <span>{settings.autonomousMode ? 'Autonomous ON' : 'Autonomous OFF'}</span>
        </button>

        {/* Dry Run Indicator Toggle */}
        {settings.dryRunMode && (
          <div className="badge badge-changes" style={{ fontSize: '11px', padding: '4px 8px' }}>
            DRY RUN ACTIVE
          </div>
        )}

        <button
          onClick={onScanAll}
          disabled={isScanningAll}
          className="btn btn-secondary btn-sm"
          title="Scan all registered repositories for local changes"
        >
          <RefreshCw size={13} className={isScanningAll ? 'animate-spin' : ''} />
          <span>{isScanningAll ? 'Scanning...' : 'Scan All'}</span>
        </button>

        <button
          onClick={onPushChanged}
          className="btn btn-primary btn-sm"
          title="Push all repositories with pending detected changes"
        >
          <Play size={13} fill="currentColor" />
          <span>Push Changed</span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 4px' }} />

        <button
          onClick={onOpenScanModal}
          className="btn btn-secondary btn-sm"
          title="Scan directory for Git repositories"
        >
          <FolderSearch size={13} />
          <span>Scan Folder</span>
        </button>

        <button
          onClick={onOpenAddModal}
          className="btn btn-secondary btn-sm"
          title="Add single Git repository"
        >
          <Plus size={13} />
          <span>Add Repo</span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 4px' }} />

        {/* User Account Menu */}
        <UserMenu onOpenAuthModal={onOpenAuthModal} />
      </div>
    </header>
  );
}
