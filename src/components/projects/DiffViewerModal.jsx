import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Minus, FileCode, Check, Loader2 } from 'lucide-react';
import { gitService } from '../../services/git/gitService';

export function DiffViewerModal({ isOpen, onClose, repository }) {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [diffContent, setDiffContent] = useState('');
  const [diffStat, setDiffStat] = useState('');

  useEffect(() => {
    if (!isOpen || !repository) return;

    const loadDiffData = async () => {
      setLoading(true);
      try {
        const statusRes = await gitService.getStatus(repository.path);
        setFiles(statusRes.files || []);
        if (statusRes.files && statusRes.files.length > 0) {
          setSelectedFile(statusRes.files[0].path);
          const diffRes = await gitService.getDiff(repository.path, statusRes.files[0].path);
          setDiffContent(diffRes.combinedDiff || 'No text changes in selected file');
          setDiffStat(diffRes.stat || '');
        } else {
          setDiffContent('No changes detected in working tree.');
          setDiffStat('');
        }
      } catch (err) {
        setDiffContent(`Error loading diff: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

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

  if (!isOpen || !repository) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', width: '90vw', height: '80vh' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCode size={18} style={{ color: 'var(--primary-bright)' }} />
            <div>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Diff Viewer: {repository.name}
                <span className="badge badge-changes font-mono" style={{ fontSize: '11px' }}>{files.length} changed files</span>
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body (Split file list & diff view) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* File Tree Left Sidebar */}
          <div style={{ width: '260px', borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface)', overflowY: 'auto', padding: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '6px 8px', letterSpacing: '0.05em' }}>
              Changed Files
            </div>
            {files.length === 0 ? (
              <div style={{ padding: '16px 8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
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
                      border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                      marginBottom: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span className="font-mono" style={{ fontSize: '11.5px', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.path}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        backgroundColor: file.status === 'added' ? 'var(--success-subtle)' : file.status === 'deleted' ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
                        color: file.status === 'added' ? 'var(--success)' : file.status === 'deleted' ? 'var(--danger)' : 'var(--warning)',
                      }}
                    >
                      {file.status[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Diff View Right Pane */}
          <div style={{ flex: 1, background: 'var(--bg-base)', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Loading diff...</span>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
                        borderLeft: line.startsWith('+') ? '2px solid var(--success)' : line.startsWith('-') ? '2px solid var(--danger)' : '2px solid transparent',
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
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
