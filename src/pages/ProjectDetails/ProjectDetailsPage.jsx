import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Folder,
  RefreshCw,
  Play,
  FileCode,
  History,
  Settings,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { gitService } from '../../services/git/gitService';

export function ProjectDetailsPage({ onCommitPreview, onOpenDiff }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { repositories, scanRepository, deleteRepository, updateRepository } = useProjectStore();

  const [activeTab, setActiveTab] = useState('overview'); // overview, changes, history
  const [gitHistory, setGitHistory] = useState([]);
  const [statusDetails, setStatusDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const repository = repositories.find((r) => r.id === id);

  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [histRes, statusRes] = await Promise.all([
          gitService.getHistory(repository.path, 15),
          gitService.getStatus(repository.path),
        ]);

        if (histRes.success) setGitHistory(histRes.history || []);
        if (statusRes.success) setStatusDetails(statusRes);
      } catch (err) {
        console.error('Error loading project details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [repository]);

  if (!repository) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Repository not found.
        <div style={{ marginTop: '12px' }}>
          <button onClick={() => navigate('/projects')} className="btn btn-secondary">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove ${repository.name} from GitPilot? (Local files will not be deleted)`)) {
      await deleteRepository(repository.id);
      navigate('/projects');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back button & Title Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/projects')} className="btn-ghost" style={{ padding: '6px', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{repository.name}</h1>
              <span className="badge badge-ready">{repository.branch}</span>
            </div>
            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {repository.path}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => scanRepository(repository.id)} className="btn btn-secondary">
            <RefreshCw size={13} />
            <span>Scan</span>
          </button>
          <button onClick={() => onCommitPreview(repository)} className="btn btn-primary">
            <Play size={13} fill="currentColor" />
            <span>Push Changes</span>
          </button>
          <button onClick={handleDelete} className="btn btn-danger" title="Remove from GitPilot">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-default)', paddingBottom: '2px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: Folder },
          { id: 'changes', label: `Changes (${statusDetails?.summary?.total || 0})`, icon: FileCode },
          { id: 'history', label: 'Commit History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                borderRadius: 0,
                cursor: 'pointer',
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13.5px' }}>Repository Configuration</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Branch:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{repository.branch}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remote:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{repository.remoteName || 'origin'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remote URL:</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{repository.remoteUrl}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Automation Status:</span>
                <button
                  onClick={() => updateRepository(repository.id, { enabled: !repository.enabled })}
                  className="btn-ghost"
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    borderRadius: '3px',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: repository.enabled ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {repository.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13.5px' }}>Status & Diagnostics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Working Tree:</span>
                <span style={{ color: statusDetails?.hasChanges ? 'var(--warning)' : 'var(--success)' }}>
                  {statusDetails?.hasChanges ? `${statusDetails.summary.total} uncommitted changes` : 'Clean'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Scan:</span>
                <span>{repository.lastScanAt ? new Date(repository.lastScanAt).toLocaleString() : 'Never'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Push:</span>
                <span>{repository.lastPushAt ? new Date(repository.lastPushAt).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'changes' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px' }}>Working Tree Changes</h3>
            {statusDetails?.hasChanges && (
              <button onClick={() => onOpenDiff(repository)} className="btn btn-secondary btn-sm">
                Open Diff Viewer
              </button>
            )}
          </div>

          {!statusDetails || statusDetails.files.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              No changes detected. Working tree is clean.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {statusDetails.files.map((file) => (
                <div
                  key={file.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span className="font-mono" style={{ fontSize: '12px' }}>{file.path}</span>
                  <span className="badge badge-changes" style={{ textTransform: 'uppercase' }}>
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Recent Commits</h3>
          {gitHistory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              No commit history found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gitHistory.map((commit) => (
                <div
                  key={commit.hash}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div className="font-mono" style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {commit.message}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {commit.author} · {commit.date ? new Date(commit.date).toLocaleDateString() : ''}
                    </div>
                  </div>
                  <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary-bright)', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                    {commit.shortHash}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
