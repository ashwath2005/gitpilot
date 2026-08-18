import React, { useEffect } from 'react';
import { ListOrdered, Play, CheckCircle2, XCircle, Clock, Loader2, AlertCircle, Terminal } from 'lucide-react';
import { useQueueStore } from '../../store/queueStore';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';

export function QueuePage() {
  const { queue, isProcessing, enqueueRepositories, initQueueListener } = useQueueStore();
  const { repositories } = useProjectStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    const unsubscribe = initQueueListener();
    return () => unsubscribe();
  }, [initQueueListener]);

  const handleEnqueueAll = () => {
    const targets = repositories.filter((r) => r.enabled);
    enqueueRepositories(targets, { isDryRun: settings.dryRunMode, isAutonomous: settings.autonomousMode });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Push Queue</h1>
            {isProcessing && (
              <span className="badge badge-changes">
                <Loader2 size={11} className="animate-spin" /> Processing Queue
              </span>
            )}
            {settings.dryRunMode && (
              <span className="badge badge-ready font-mono">DRY RUN MODE</span>
            )}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Sequential, safe execution queue to avoid network overload and race conditions
          </p>
        </div>

        <button
          onClick={handleEnqueueAll}
          disabled={isProcessing || repositories.length === 0}
          className="btn btn-primary"
        >
          <Play size={13} fill="currentColor" />
          <span>Enqueue All Active</span>
        </button>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <ListOrdered size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <p style={{ fontSize: '13px' }}>Push queue is currently empty.</p>
          <p style={{ fontSize: '11.5px', marginTop: '4px' }}>
            Items will be queued automatically at your scheduled sync times or via manual triggers.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.map((item, index) => {
            const isCurrent = item.status === 'PROCESSING';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{item.repositoryName}</h3>
                    <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      ({item.branch})
                    </span>
                  </div>

                  <div>
                    {item.status === 'QUEUED' && <span className="badge badge-ready">Waiting in queue</span>}
                    {item.status === 'PROCESSING' && (
                      <span className="badge badge-changes">
                        <Loader2 size={11} className="animate-spin" /> Processing
                      </span>
                    )}
                    {item.status === 'SUCCESS' && <span className="badge badge-success">✓ Completed</span>}
                    {item.status === 'FAILED' && <span className="badge badge-failed">✗ Failed</span>}
                    {item.status === 'NO_CHANGES' && <span className="badge badge-no-changes">— Clean (Skipped)</span>}
                  </div>
                </div>

                {/* Execution Terminal Logs for this item */}
                {item.logs && item.logs.length > 0 && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {item.logs.map((log, logIdx) => (
                      <div key={logIdx} style={{ color: log.includes('Error') ? 'var(--danger)' : log.includes('successful') ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
