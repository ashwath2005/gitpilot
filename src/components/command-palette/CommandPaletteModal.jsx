import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FolderGit2,
  Play,
  RefreshCw,
  Plus,
  Settings,
  Shield,
  Trash2,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useActivityStore } from '../../store/activityStore';

export function CommandPaletteModal({ isOpen, onClose, onOpenAddModal, onOpenScanModal }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { repositories, scanAll } = useProjectStore();
  const { settings, updateSettings } = useSettingsStore();
  const { clearLogs } = useActivityStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultActions = [
    {
      id: 'push-all',
      title: 'Push all changed repositories',
      subtitle: 'Enqueue all modified projects',
      icon: Play,
      action: () => {
        const changed = repositories.filter((r) => r.status === 'CHANGES' || r.filesChanged > 0);
        useProjectStore.getState().scanAll();
        onClose();
      },
    },
    {
      id: 'scan-all',
      title: 'Scan all repositories',
      subtitle: 'Check git status on all registered projects',
      icon: RefreshCw,
      action: () => {
        scanAll();
        onClose();
      },
    },
    {
      id: 'add-repo',
      title: 'Add new repository',
      subtitle: 'Register a local Git project',
      icon: Plus,
      action: () => {
        onClose();
        onOpenAddModal();
      },
    },
    {
      id: 'scan-workspace',
      title: 'Scan workspace folder',
      subtitle: 'Discover git repos in parent directory',
      icon: FolderGit2,
      action: () => {
        onClose();
        onOpenScanModal();
      },
    },
    {
      id: 'toggle-autonomous',
      title: `Toggle Autonomous Mode (${settings.autonomousMode ? 'Currently ON' : 'Currently OFF'})`,
      subtitle: 'Enable or disable autonomous background commits',
      icon: Shield,
      action: () => {
        updateSettings({ autonomousMode: !settings.autonomousMode });
        onClose();
      },
    },
    {
      id: 'toggle-dry-run',
      title: `Toggle Dry Run Mode (${settings.dryRunMode ? 'Currently ON' : 'Currently OFF'})`,
      subtitle: 'Simulate git operations without pushing',
      icon: Clock,
      action: () => {
        updateSettings({ dryRunMode: !settings.dryRunMode });
        onClose();
      },
    },
    {
      id: 'toggle-ai',
      title: `Toggle AI Commit Suggestions (${settings.enableAI ? 'Currently ON' : 'Currently OFF'})`,
      subtitle: 'Use OpenAI to generate conventional commits',
      icon: Sparkles,
      action: () => {
        updateSettings({ enableAI: !settings.enableAI });
        onClose();
      },
    },
    {
      id: 'goto-settings',
      title: 'Open Settings',
      subtitle: 'Configure Git, schedules, and AI credentials',
      icon: Settings,
      action: () => {
        navigate('/settings');
        onClose();
      },
    },
    {
      id: 'clear-logs',
      title: 'Clear System Logs',
      subtitle: 'Reset internal execution activity history',
      icon: Trash2,
      action: () => {
        clearLogs();
        onClose();
      },
    },
  ];

  // Map repositories to searchable command items
  const repoItems = repositories.map((r) => ({
    id: `repo-${r.id}`,
    title: r.name,
    subtitle: `${r.branch} · ${r.path}`,
    icon: FolderGit2,
    action: () => {
      navigate(`/projects/${r.id}`);
      onClose();
    },
  }));

  const allItems = [...defaultActions, ...repoItems];
  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', marginTop: '10vh', alignSelf: 'flex-start' }}
      >
        {/* Search Input Box */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-default)', gap: '10px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search repository..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              No commands or repositories found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: isSelected ? 'var(--primary-bright)' : 'var(--text-secondary)' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <kbd style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>↵</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Execute</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={11} />
            <span>GitPilot Actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
