import React, { useEffect } from 'react';
import { Activity as ActivityIcon, CheckCircle2, XCircle, MinusCircle, Trash2, Filter } from 'lucide-react';
import { useActivityStore } from '../../store/activityStore';

export function ActivityPage() {
  const { history, logs, filterStatus, setFilterStatus, fetchActivity, clearLogs } = useActivityStore();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredHistory = history.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Activity & Push Timeline</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Auditable history of automated and manual Git operations
          </p>
        </div>

        <button onClick={clearLogs} className="btn btn-secondary btn-sm" title="Clear system logs">
          <Trash2 size={13} />
          <span>Clear Logs</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'ALL', label: 'All Activity' },
          { id: 'SUCCESS', label: 'Successful Pushes' },
          { id: 'FAILED', label: 'Failed' },
          { id: 'NO_CHANGES', label: 'Clean / Skipped' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: filterStatus === f.id ? 'var(--bg-elevated)' : 'transparent',
              color: filterStatus === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: filterStatus === f.id ? '1px solid var(--border-focus)' : '1px solid transparent',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      {filteredHistory.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recorded activity matching this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredHistory.map((item) => {
            const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {item.status === 'SUCCESS' && <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />}
                    {item.status === 'FAILED' && <XCircle size={16} style={{ color: 'var(--danger)' }} />}
                    {item.status === 'NO_CHANGES' && <MinusCircle size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                        {item.repositoryName}
                      </span>
                      <span className={`badge ${item.status === 'SUCCESS' ? 'badge-success' : item.status === 'FAILED' ? 'badge-failed' : 'badge-no-changes'}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.commitMessage || item.error || 'No uncommitted changes detected'}
                    </div>

                    {item.filesChanged > 0 && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {item.filesChanged} files staged and pushed
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
