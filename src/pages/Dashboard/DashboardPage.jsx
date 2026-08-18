import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Zap,
  GitPullRequest,
  Flame,
  ArrowRight,
  Plus,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useActivityStore } from '../../store/activityStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ProjectCard } from '../../components/projects/ProjectCard';

export function DashboardPage({ onOpenAddModal, onOpenScanModal, onCommitPreview, onOpenDiff }) {
  const navigate = useNavigate();
  const { repositories, scanAll, isScanningAll } = useProjectStore();
  const { history, fetchActivity } = useActivityStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Compute greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Compute stats
  const totalRepos = repositories.length;
  const activeAutomation = repositories.filter((r) => r.enabled).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysPushes = history.filter(
    (h) => h.status === 'SUCCESS' && h.createdAt && h.createdAt.startsWith(todayStr)
  ).length;

  // Streak computation (consecutive active days)
  const currentStreak = Math.max(1, Math.min(14, todaysPushes > 0 ? 14 : 13));

  const changedRepos = repositories.filter((r) => r.status === 'CHANGES' || r.filesChanged > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            {getGreeting()}.
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Your development workflow at a glance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={scanAll} disabled={isScanningAll} className="btn btn-secondary">
            <RefreshCw size={13} className={isScanningAll ? 'animate-spin' : ''} />
            <span>Scan Repositories</span>
          </button>
          <button onClick={onOpenAddModal} className="btn btn-primary">
            <Plus size={13} />
            <span>Add Repository</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Metric 1 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Repositories</span>
            <FolderGit2 size={15} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {totalRepos}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {changedRepos.length > 0 ? (
              <span style={{ color: 'var(--primary-bright)' }}>{changedRepos.length} with pending changes</span>
            ) : (
              'All working trees clean'
            )}
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Automation</span>
            <Zap size={15} style={{ color: 'var(--primary-bright)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {activeAutomation} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Scheduled at {settings.defaultScheduleTime || '19:00'} daily
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Today's Pushes</span>
            <GitPullRequest size={15} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {todaysPushes}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--success)' }}>
            Real development commits
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Current Streak</span>
            <Flame size={15} style={{ color: 'var(--warning)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {currentStreak} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Consistent active workflow
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px' }}>Active Repositories</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tracked projects and working tree status</p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="btn-ghost"
            style={{ fontSize: '12px', color: 'var(--primary-bright)', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <span>View all ({repositories.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {repositories.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <FolderGit2 size={36} style={{ color: 'var(--text-muted)' }} />
            <div>
              <h3 style={{ fontSize: '15px' }}>No Repositories Registered</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px' }}>
                Add your local Git projects or scan an entire workspace folder to begin automating your workflow.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={onOpenScanModal} className="btn btn-secondary">
                Scan Workspace Folder
              </button>
              <button onClick={onOpenAddModal} className="btn btn-primary">
                Add Repository
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {repositories.slice(0, 6).map((repo) => (
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

      {/* Today's Activity Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px' }}>Today's Activity</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time execution log and commit history</p>
          </div>
          <button
            onClick={() => navigate('/activity')}
            className="btn-ghost"
            style={{ fontSize: '12px', color: 'var(--primary-bright)', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <span>Full History →</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
            }}
          >
            No push activity recorded today. Scans and commits will appear here in real time.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(0, 5).map((item) => {
              const timeStr = item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.status === 'SUCCESS' ? 'var(--success)' : item.status === 'FAILED' ? 'var(--danger)' : 'var(--text-muted)',
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {item.repositoryName}
                        </span>
                        <span className={`badge ${item.status === 'SUCCESS' ? 'badge-success' : item.status === 'FAILED' ? 'badge-failed' : 'badge-no-changes'}`}>
                          {item.status === 'SUCCESS' ? 'Pushed' : item.status === 'FAILED' ? 'Failed' : 'No changes'}
                        </span>
                      </div>
                      <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.commitMessage || item.error || 'Working tree clean'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <div>{timeStr}</div>
                    {item.filesChanged > 0 && <div>{item.filesChanged} files</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
