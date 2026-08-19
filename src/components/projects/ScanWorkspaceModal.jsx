import React, { useState } from 'react';
import { FolderSearch, Check, CheckCircle2, XCircle, Loader2, FolderGit2 } from 'lucide-react';
import { desktopBridge } from '../../services/desktopBridge';
import { useProjectStore } from '../../store/projectStore';
import { Modal, Button, Input, Badge } from '../ui';

export function ScanWorkspaceModal({ isOpen, onClose }) {
  const [workspacePath, setWorkspacePath] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [discovered, setDiscovered] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [error, setError] = useState(null);
  const { addRepository } = useProjectStore();

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!workspacePath.trim()) return;
    setIsScanning(true);
    setError(null);
    setDiscovered([]);
    setSelectedPaths(new Set());

    try {
      const res = await desktopBridge.scanWorkspace(workspacePath.trim());
      if (res.success) {
        setDiscovered(res.repositories || []);
        // Pre-select all valid git repositories
        const initialSelected = new Set();
        (res.repositories || []).forEach((item) => {
          if (item.isGit) initialSelected.add(item.path);
        });
        setSelectedPaths(initialSelected);
      } else {
        setError(res.error || 'Failed to scan workspace folder');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelect = (path) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const handleImport = async () => {
    const toImport = discovered.filter((item) => item.isGit && selectedPaths.has(item.path));
    for (const item of toImport) {
      try {
        await addRepository({ path: item.path, name: item.name });
      } catch (e) {
        console.warn('Could not import ' + item.name + ':', e.message);
      }
    }
    onClose();
  };

  const gitCount = discovered.filter((d) => d.isGit).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Workspace Folder"
      subtitle="Automatically discover all Git repositories contained inside a parent folder"
      icon={FolderSearch}
      maxWidth="640px"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedPaths.size === 0}
            onClick={handleImport}
          >
            Import {selectedPaths.size} {selectedPaths.size === 1 ? 'Repository' : 'Repositories'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Parent Folder Path"
                type="text"
                placeholder="e.g. D:\Projects or C:\Users\ashwa\Projects"
                className="font-mono"
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                autoFocus
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              loading={isScanning}
              disabled={isScanning || !workspacePath.trim()}
              onClick={handleScan}
              icon={FolderSearch}
              style={{ marginBottom: '1px' }}
            >
              Scan
            </Button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--danger)',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        {/* Discovered List */}
        {discovered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <span>
                Found <strong>{gitCount}</strong> Git repositories ({discovered.length} total directories scanned)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedPaths.size === gitCount) setSelectedPaths(new Set());
                  else {
                    const all = new Set();
                    discovered.filter((d) => d.isGit).forEach((d) => all.add(d.path));
                    setSelectedPaths(all);
                  }
                }}
                className="text-action"
                style={{ fontSize: '11px' }}
              >
                {selectedPaths.size === gitCount ? 'Deselect All' : 'Select All Git'}
              </button>
            </div>

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-elevated)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {discovered.map((item) => {
                const isSelected = selectedPaths.has(item.path);
                return (
                  <div
                    key={item.path}
                    onClick={() => item.isGit && toggleSelect(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      border: isSelected ? '1px solid var(--primary-subtle)' : '1px solid transparent',
                      cursor: item.isGit ? 'pointer' : 'not-allowed',
                      opacity: item.isGit ? 1 : 0.45,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <Check size={12} />}
                      </div>

                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.path}
                        </div>
                      </div>
                    </div>

                    <div>
                      {item.isGit ? (
                        <Badge variant="changes">Git Repo</Badge>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Non-Git</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
