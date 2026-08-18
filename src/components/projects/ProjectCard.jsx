import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Folder,
  ArrowUpRight,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Play,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

export function ProjectCard({ repository, onCommitPreview, onOpenDiff }) {
  const navigate = useNavigate();
  const { updateRepository, scanRepository, deleteRepository } = useProjectStore();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const getStatusBadge = () => {
    switch (repository.status) {
      case 'CHANGES':
        return <span className="badge badge-changes">● {repository.filesChanged || 'Active'} Changes</span>;
      case 'ANALYZING':
        return <span className="badge badge-analyzing">Analyzing...</span>;
      case 'COMMITTING':
        return <span className="badge badge-committing">Committing...</span>;
      case 'PUSHING':
        return <span className="badge badge-pushing">Pushing...</span>;
      case 'SUCCESS':
        return <span className="badge badge-success">✓ Pushed</span>;
      case 'FAILED':
        return <span className="badge badge-failed">✗ Failed</span>;
      case 'NO_CHANGES':
        return <span className="badge badge-no-changes">— Clean</span>;
      default:
        return <span className="badge badge-ready">Ready</span>;
    }
  };

  const formatLastAction = () => {
    if (repository.lastPushAt) {
      const date = new Date(repository.lastPushAt);
      return `Pushed ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (repository.lastScanAt) {
      const date = new Date(repository.lastScanAt);
      return `Scanned ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return 'Not scanned yet';
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteRepository(repository.id);
    setShowConfirmDelete(false);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
        position: 'relative',
      }}
      className="project-card"
    >
      {/* Delete Confirmation Overlay */}
      {showConfirmDelete && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(11, 11, 13, 0.95)',
            backdropFilter: 'blur(2px)',
            borderRadius: 'var(--radius-md)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            textAlign: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Remove from GitPilot?
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Your local files on disk will NOT be deleted.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(false);
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: repository.enabled ? 'var(--primary-bright)' : 'var(--text-disabled)',
            }}
          />
          <h3
            onClick={() => navigate(`/projects/${repository.id}`)}
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={repository.name}
          >
            {repository.name}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getStatusBadge()}
          <button
            onClick={() => updateRepository(repository.id, { enabled: !repository.enabled })}
            className="btn-ghost"
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              borderRadius: '3px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: repository.enabled ? 'var(--success)' : 'var(--text-muted)',
            }}
            title={repository.enabled ? 'Automation is Enabled' : 'Automation is Disabled'}
          >
            {repository.enabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmDelete(true);
            }}
            className="btn-ghost"
            style={{
              padding: '3px 5px',
              borderRadius: '3px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            title="Remove repository from GitPilot"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Path & Branch details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          className="font-mono"
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={repository.path}
        >
          {repository.path}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <GitBranch size={12} style={{ color: 'var(--primary)' }} />
            <span className="font-mono">{repository.branch || 'main'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '11px' }}>{formatLastAction()}</span>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => scanRepository(repository.id)}
            className="btn btn-secondary btn-sm"
            title="Scan this repository"
          >
            <RefreshCw size={12} />
            <span>Scan</span>
          </button>

          {repository.filesChanged > 0 && (
            <button
              onClick={() => onOpenDiff(repository)}
              className="btn btn-secondary btn-sm"
              title="Inspect file diffs"
            >
              <FileCode size={12} />
              <span>Diff</span>
            </button>
          )}
        </div>

        <div>
          {repository.filesChanged > 0 ? (
            <button
              onClick={() => onCommitPreview(repository)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Play size={11} fill="currentColor" />
              <span>Push Now</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(`/projects/${repository.id}`)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px' }}
            >
              <span>Details →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
