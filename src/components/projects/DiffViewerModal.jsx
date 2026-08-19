import React, { useState, useEffect } from 'react';
import { X, FileText, FileCode, Loader2, Check, RefreshCw } from 'lucide-react';
import { gitService } from '../../services/git/gitService';
import { Button, Badge } from '../ui';

export function DiffViewerModal({ isOpen, onClose, repository }) {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [diffContent, setDiffContent] = useState('');
  const [diffStat, setDiffStat] = useState('');
  const [stagingFile, setStagingFile] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadDiffData = async () => {
    if (!repository) return;
    setLoading(true);
    try {
      const statusRes = await gitService.getStatus(repository.path);
      setFiles(statusRes.files || []);
      if (statusRes.files && statusRes.files.length > 0) {
        const fileToSelect = selectedFile && statusRes.files.some((f) => f.path === selectedFile)
          ? selectedFile
          : statusRes.files[0].path;
        setSelectedFile(fileToSelect);
        const diffRes = await gitService.getDiff(repository.path, fileToSelect);
        setDiffContent(diffRes.combinedDiff || 'No text changes in selected file');
        setDiffStat(diffRes.stat || '');
      } else {
        setSelectedFile(null);
        setDiffContent('No changes detected in working tree.');
        setDiffStat('');
      }
    } catch (err) {
      setDiffContent('Error loading diff: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !repository) return;
    loadDiffData();
  }, [isOpen, repository]);

  const handleSelectFile = async (filePath) => {
    setSelectedFile(filePath);
    setLoading(true);
    try {
      const diffRes = await gitService.getDiff(repository.path, filePath);
      setDiffContent(diffRes.combinedDiff || 'No text changes in selected file');
    } catch (e) {
      setDiffContent('Error loading file diff');
    } finally {
      setLoading(false);
    }
  };

  const handleStageFile = async (filePath) => {
    if (!repository) return;
    setStagingFile(filePath);
    try {
      await gitService.stageFiles(repository.path, [filePath]);
      await loadDiffData();
    } catch (e) {
      console.warn('Failed to stage file:', e.message);
    } finally {
      setStagingFile(null);
    }
  };

  const handleStageAll = async () => {
    if (!repository) return;
    setLoading(true);
    try {
      await gitService.stageFiles(repository.path, ['.']);
      await loadDiffData();
    } catch (e) {
      console.warn('Failed to stage all:', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !repository) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '92vw', height: '82vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode size={18} style={{ color: 'var(--primary-bright)' }} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Diff Viewer: {repository.name}
                <Badge variant="changes">{files.length} changed files</Badge>
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleStageAll} disabled={files.length === 0 || loading}>
              Stage All
            </Button>
            <button
              onClick={onClose}
              className="btn-close"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body (Split file list & diff view) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* File Tree Left Sidebar */}
          <div
            style={{
              width: '280px',
              borderRight: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 6px', letterSpacing: '0.04em' }}>
              Changed Files ({files.length})
            </div>

            {files.length === 0 ? (
              <div style={{ padding: '24px 8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No changes detected
              </div>
            ) : (
              files.map((file) => {
                const isSelected = selectedFile === file.path;
                return (
                  <div
                    key={file.path}
                    onClick={() => handleSelectFile(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-default)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '11.5px',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={file.path}
                      >
                        {file.path}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          backgroundColor:
                            file.status === 'added'
                              ? 'var(--success-subtle)'
                              : file.status === 'deleted'
                              ? 'var(--danger-subtle)'
                              : 'var(--warning-subtle)',
                          color:
                            file.status === 'added'
                              ? 'var(--success)'
                              : file.status === 'deleted'
                              ? 'var(--danger)'
                              : 'var(--warning)',
                        }}
                      >
                        {file.status ? file.status[0] : 'M'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Diff View Right Pane */}
          <div
            style={{
              flex: 1,
              background: 'var(--bg-base)',
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary-bright)' }} />
                <span>Loading diff...</span>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre',
                  minWidth: 'max-content',
                }}
              >
                {diffContent.split('\n').map((line, idx) => {
                  let lineClass = '';
                  let textColor = 'var(--text-secondary)';
                  let bgColor = 'transparent';

                  if (line.startsWith('@@')) {
                    lineClass = 'diff-chunk-header';
                    textColor = 'var(--info)';
                    bgColor = 'var(--bg-elevated)';
                  } else if (line.startsWith('+') && !line.startsWith('+++')) {
                    lineClass = 'diff-addition';
                    textColor = '#4ADE80';
                    bgColor = 'rgba(34, 197, 94, 0.08)';
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    lineClass = 'diff-deletion';
                    textColor = '#F87171';
                    bgColor = 'rgba(239, 68, 68, 0.08)';
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '1px 8px',
                        backgroundColor: bgColor,
                        color: textColor,
                        borderLeft: line.startsWith('+') && !line.startsWith('+++')
                          ? '2px solid var(--success)'
                          : line.startsWith('-') && !line.startsWith('---')
                          ? '2px solid var(--danger)'
                          : '2px solid transparent',
                      }}
                    >
                      {line || ' '}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {selectedFile && (
              <span className="font-mono">Viewing: {selectedFile}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedFile && (
              <Button
                variant="secondary"
                size="sm"
                loading={stagingFile === selectedFile}
                onClick={() => handleStageFile(selectedFile)}
              >
                Stage File
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
