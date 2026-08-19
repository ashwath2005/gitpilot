import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  RefreshCw,
  FileCode,
  Clock,
  MoreHorizontal,
  Play,
  Trash2,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { Button, Badge } from '../ui';

export function ProjectCard({ repository, onCommitPreview, onOpenDiff }) {
  const navigate = useNavigate();
  const { updateRepository, scanRepository, deleteRepository } = useProjectStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getStatusBadge = () => {
    switch (repository.status) {
      case 'CHANGES':
        return <Badge variant="changes">● {repository.filesChanged || 'Active'} Changes</Badge>;
      case 'ANALYZING':
        return <Badge variant="info">Analyzing...</Badge>;
      case 'COMMITTING':
        return <Badge variant="warning">Committing...</Badge>;
      case 'PUSHING':
        return <Badge variant="warning">Pushing...</Badge>;
      case 'SUCCESS':
        return <Badge variant="success">✓ Pushed</Badge>;
      case 'FAILED':
        return <Badge variant="danger">✗ Failed</Badge>;
      case 'NO_CHANGES':
        return <Badge variant="default">— Clean</Badge>;
      default:
        return <Badge variant="default">Ready</Badge>;
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

  const handleCopyPath = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(repository.path);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setMenuOpen(false);
    }, 1200);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteRepository(repository.id);
    setMenuOpen(false);
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
        transition: 'border-color var(--transition-fast)',
        position: 'relative',
      }}
      className="project-card"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: repository.enabled ? 'var(--primary-bright)' : 'var(--text-disabled)',
              flexShrink: 0,
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
          
          {/* Automation Switch */}
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

          {/* Context Menu Dropdown */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="btn-ghost"
              style={{
                padding: '4px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                color: menuOpen ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: menuOpen ? 'var(--bg-elevated)' : 'transparent',
              }}
              title="More actions"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '4px',
                  minWidth: '170px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 120ms ease',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    scanRepository(repository.id);
                    setMenuOpen(false);
                  }}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Scan for changes</span>
                </button>

                <button
                  onClick={handleCopyPath}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                  <span>{copied ? 'Path copied!' : 'Copy path'}</span>
                </button>

                <button
                  onClick={() => {
                    navigate(`/projects/${repository.id}`);
                    setMenuOpen(false);
                  }}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Project details</span>
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '3px 0' }} />

                <button
                  onClick={handleDelete}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    width: '100%',
                    justifyContent: 'flex-start',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove repository</span>
                </button>
              </div>
            )}
          </div>
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
