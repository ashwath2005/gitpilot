import React, { useState } from 'react';
import { X, FolderSearch, Check, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { desktopBridge } from '../../services/desktopBridge';
import { useProjectStore } from '../../store/projectStore';

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
        await addRepository(item.path, item.name);
      } catch (e) {
        console.warn(`Could not import ${item.name}:`, e);
      }
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px' }}>Scan Workspace Folder</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically discover all Git repositories in a directory</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Parent Folder Path
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. D:\Projects or C:\Users\ashwa\Projects"
                className="input-text font-mono"
                value={workspacePath}
                onChange={(e) => setWorkspacePath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !workspacePath.trim()}
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
              >
                {isScanning ? <Loader2 size={13} className="animate-spin" /> : <FolderSearch size={13} />}
                <span>Scan</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--danger)', fontSize: '12px' }}>
              {error}
            </div>
          )}

          {discovered.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  Found {discovered.length} folders ({discovered.filter((d) => d.isGit).length} Git repos)
                </span>
                <button
                  onClick={() => {
                    const allGit = new Set(discovered.filter((d) => d.isGit).map((d) => d.path));
                    setSelectedPaths(selectedPaths.size === allGit.size ? new Set() : allGit);
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '11px', color: 'var(--primary-bright)', cursor: 'pointer', border: 'none', background: 'transparent' }}
                >
                  Toggle All Valid
                </button>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)' }}>
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
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: item.isGit ? 'pointer' : 'not-allowed',
                        opacity: item.isGit ? 1 : 0.45,
                        backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid var(--border-focus)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? 'var(--primary)' : 'transparent' }}>
                          {isSelected && <Check size={12} color="#FFFFFF" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                          <div className="font-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{item.path}</div>
                        </div>
                      </div>

                      <div>
                        {item.isGit ? (
                          <span className="badge badge-ready" style={{ color: 'var(--success)' }}>
                            <CheckCircle2 size={11} /> Git
                          </span>
                        ) : (
                          <span className="badge badge-disabled">
                            <XCircle size={11} /> Not Git
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-surface)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={selectedPaths.size === 0}
            className="btn btn-primary"
          >
            Import Selected ({selectedPaths.size})
          </button>
        </div>
      </div>
    </div>
  );
}
