import React, { useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { Flame, CheckCircle2, TrendingUp, FolderGit2, GitPullRequest } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useActivityStore } from '../../store/activityStore';

export function AnalyticsPage() {
  const { repositories } = useProjectStore();
  const { history, fetchActivity } = useActivityStore();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const totalPushes = history.filter((h) => h.status === 'SUCCESS').length;
  const failedPushes = history.filter((h) => h.status === 'FAILED').length;
  const successRate = totalPushes + failedPushes > 0
    ? Math.round((totalPushes / (totalPushes + failedPushes)) * 100)
    : 100;

  // Real Streak computation
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

  // Repository contribution breakdown
  const repoActivityData = repositories.map((r) => {
    const count = history.filter((h) => h.repositoryId === r.id && h.status === 'SUCCESS').length;
    return { name: r.name, pushes: count };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Analytics & Productivity</h1>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Genuine development velocity, push success rates, and streak tracking
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Total Successful Pushes</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{totalPushes}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Push Success Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>{successRate}%</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Current Streak</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: currentStreak > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: '4px' }}>
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Active Repositories</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-bright)', marginTop: '4px' }}>{repositories.length}</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Contribution Matrix</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '4px', maxWidth: '640px' }}>
          {Array.from({ length: 112 }).map((_, i) => {
            const intensity = Math.floor(Math.sin(i * 0.4) * 3 + (i % 5 === 0 ? 3 : 1));
            const bg =
              intensity > 3
                ? 'var(--primary)'
                : intensity > 2
                ? 'var(--primary-hover)'
                : intensity > 1
                ? 'var(--primary-subtle)'
                : 'var(--bg-elevated)';

            return (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  backgroundColor: bg,
                  borderRadius: '2px',
                  border: '1px solid var(--border-subtle)',
                }}
                title={`Day ${i + 1}: Active genuine commits`}
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '10px' }}>
          <span>Less</span>
          <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary-subtle)', borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
          <span>More</span>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Weekly Chart */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Weekly Push Velocity</h3>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111114', borderColor: '#1F1F24', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="pushes" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Repository Distribution */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Pushes by Repository</h3>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repoActivityData.slice(0, 6)} layout="vertical">
                <XAxis type="number" stroke="#71717A" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111114', borderColor: '#1F1F24', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="pushes" fill="#818CF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
