import React, { useState } from 'react';
import { Search, Plus, FolderSearch, RefreshCw, Filter } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { ProjectCard } from '../../components/projects/ProjectCard';

export function ProjectsPage({ onOpenAddModal, onOpenScanModal, onCommitPreview, onOpenDiff }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, CHANGES, READY, DISABLED

  const { repositories, scanAll, isScanningAll } = useProjectStore();

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.branch && repo.branch.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'CHANGES') return repo.status === 'CHANGES' || repo.filesChanged > 0;
    if (statusFilter === 'READY') return repo.status === 'READY' || repo.status === 'NO_CHANGES';
    if (statusFilter === 'DISABLED') return !repo.enabled;

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Repositories</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manage registered Git projects and check live branch statuses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={scanAll} disabled={isScanningAll} className="btn btn-secondary">
            <RefreshCw size={13} className={isScanningAll ? 'animate-spin' : ''} />
            <span>Scan All</span>
          </button>
          <button onClick={onOpenScanModal} className="btn btn-secondary">
            <FolderSearch size={13} />
            <span>Scan Folder</span>
          </button>
          <button onClick={onOpenAddModal} className="btn btn-primary">
            <Plus size={13} />
            <span>Add Repository</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter by repository name, path, or branch..."
            className="input-text"
            style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status:</span>
          {['ALL', 'CHANGES', 'READY', 'DISABLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="btn-ghost"
              style={{
                fontSize: '11px',
                padding: '3px 7px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                backgroundColor: statusFilter === status ? 'var(--bg-elevated)' : 'transparent',
                color: statusFilter === status ? 'var(--text-primary)' : 'var(--text-muted)',
                border: statusFilter === status ? '1px solid var(--border-focus)' : '1px solid transparent',
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Repositories Grid */}
      {filteredRepos.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No repositories matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredRepos.map((repo) => (
            <ProjectCard
              key={repo.id}
              repository={repo}
              onCommitPreview={onCommitPreview}
              onOpenDiff={onOpenDiff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
