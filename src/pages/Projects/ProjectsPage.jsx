import React, { useState } from 'react';
import { Search, Plus, FolderSearch, RefreshCw, FolderGit2 } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Button, EmptyState } from '../../components/ui';

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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Repositories</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manage registered Git projects and check live branch statuses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            onClick={scanAll}
            disabled={isScanningAll}
            loading={isScanningAll}
            icon={RefreshCw}
          >
            Scan All
          </Button>
          <Button
            variant="secondary"
            onClick={onOpenScanModal}
            icon={FolderSearch}
          >
            Scan Folder
          </Button>
          <Button
            variant="primary"
            onClick={onOpenAddModal}
            icon={Plus}
          >
            Add Repository
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter by repository name, path, or branch..."
            className="input-text"
            style={{ border: 'none', background: 'transparent', padding: '4px 0', boxShadow: 'none' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status:</span>
          {['ALL', 'CHANGES', 'READY', 'DISABLED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className="btn-ghost"
              style={{
                fontSize: '11px',
                padding: '3px 8px',
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
        <EmptyState
          icon={FolderGit2}
          title="No Matching Repositories"
          description={repositories.length === 0 ? "You haven't registered any Git repositories yet." : "No repositories match your filter criteria."}
          actionLabel={repositories.length === 0 ? "Add Repository" : undefined}
          onAction={repositories.length === 0 ? onOpenAddModal : undefined}
          actionIcon={Plus}
        />
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
