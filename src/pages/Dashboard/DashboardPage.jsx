import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  Zap,
  GitPullRequest,
  Flame,
  ArrowRight,
  Plus,
  RefreshCw,
  FolderSearch,
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useActivityStore } from '../../store/activityStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Button, TextButton, Card, Badge, EmptyState } from '../../components/ui';

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

  // Real Streak computation (consecutive active days with real pushes)
  const calculateRealStreak = () => {
    if (!history || history.length === 0) return 0;
    
    const activeDates = new Set(
      history
        .filter((h) => h.status === 'SUCCESS' && h.createdAt)
        .map((h) => h.createdAt.split('T')[0])
    );

    if (activeDates.size === 0) return 0;

    let streak = 0;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let checkDate = new Date(now);

    if (!activeDates.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateRealStreak();
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
          <Button
            variant="secondary"
            onClick={scanAll}
            disabled={isScanningAll}
            loading={isScanningAll}
            icon={RefreshCw}
          >
            Scan Repositories
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

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Metric 1 */}
        <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Repositories</span>
            <FolderGit2 size={16} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {totalRepos}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {changedRepos.length > 0 ? (
              <span style={{ color: 'var(--primary-bright)', fontWeight: 500 }}>{changedRepos.length} with pending changes</span>
            ) : (
              'All working trees clean'
            )}
          </div>
        </Card>

        {/* Metric 2 */}
        <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Automation</span>
            <Zap size={16} style={{ color: 'var(--primary-bright)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {activeAutomation} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>active</span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Scheduled at {settings.defaultScheduleTime || '19:00'} daily
          </div>
        </Card>

        {/* Metric 3 */}
        <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Today's Pushes</span>
            <GitPullRequest size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {todaysPushes}
          </div>
          <div style={{ fontSize: '11.5px', color: todaysPushes > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
            {todaysPushes > 0 ? `${todaysPushes} real commits pushed` : 'No automated pushes today'}
          </div>
        </Card>

        {/* Metric 4 */}
        <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Current Streak</span>
            <Flame size={16} style={{ color: currentStreak > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {currentStreak} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>{currentStreak === 1 ? 'day' : 'days'}</span>
          </div>
          <div style={{ fontSize: '11.5px', color: currentStreak > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
            {currentStreak > 0 ? 'Consistent active workflow' : 'Push changes to start streak'}
          </div>
        </Card>
      </div>

      {/* Projects Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Active Repositories</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tracked projects and working tree status</p>
          </div>
          <TextButton
            onClick={() => navigate('/projects')}
            icon={ArrowRight}
            style={{ fontSize: '12px' }}
          >
            View all ({repositories.length})
          </TextButton>
        </div>

        {repositories.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No Repositories Registered"
            description="Add your local Git projects or scan an entire workspace folder to begin automating your workflow."
          >
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button variant="secondary" size="sm" onClick={onOpenScanModal} icon={FolderSearch}>
                Scan Workspace Folder
              </Button>
              <Button variant="primary" size="sm" onClick={onOpenAddModal} icon={Plus}>
                Add Repository
              </Button>
            </div>
          </EmptyState>
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
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Today's Activity</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Real-time execution log and commit history</p>
          </div>
          <TextButton
            onClick={() => navigate('/activity')}
            icon={ArrowRight}
            style={{ fontSize: '12px' }}
          >
            Full History
          </TextButton>
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
                        <Badge variant={item.status === 'SUCCESS' ? 'success' : item.status === 'FAILED' ? 'danger' : 'default'}>
                          {item.status === 'SUCCESS' ? 'Pushed' : item.status === 'FAILED' ? 'Failed' : 'No changes'}
                        </Badge>
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
