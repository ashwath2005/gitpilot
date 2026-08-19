import React, { useEffect } from 'react';
import {
  ListOrdered,
  Play,
  Loader2,
  Shield,
  Sparkles,
  GitCommit,
  ArrowUpRight,
  Ban,
} from 'lucide-react';
import { useQueueStore } from '../../store/queueStore';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Button, Card, Badge, EmptyState } from '../../components/ui';

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
      case 'QUEUED':
        return <Badge variant="default">WAITING</Badge>;
      case 'SCANNING':
        return (
          <Badge variant="changes" icon={Loader2}>
            SCANNING
          </Badge>
        );
      case 'SECURITY_CHECK':
        return (
          <Badge variant="primary" icon={Shield}>
            SECURITY CHECK
          </Badge>
        );
      case 'GENERATING_COMMIT':
        return (
          <Badge variant="primary" icon={Sparkles}>
            AI GENERATION
          </Badge>
        );
      case 'STAGING':
      case 'COMMITTING':
        return (
          <Badge variant="changes" icon={GitCommit}>
            COMMITTING
          </Badge>
        );
      case 'PUSHING':
        return (
          <Badge variant="warning" icon={ArrowUpRight}>
            PUSHING
          </Badge>
        );
      case 'DRY_RUN':
        return <Badge variant="default">DRY RUN OK</Badge>;
      case 'COMPLETED':
      case 'SUCCESS':
        return <Badge variant="success">✓ COMPLETED</Badge>;
      case 'BLOCKED':
        return (
          <Badge variant="danger" icon={Ban}>
            BLOCKED
          </Badge>
        );
      case 'FAILED':
        return <Badge variant="danger">✗ FAILED</Badge>;
      case 'NO_CHANGES':
        return <Badge variant="default">— CLEAN</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Push Queue</h1>
            {isProcessing && (
              <Badge variant="changes" icon={Loader2}>
                Live Processing
              </Badge>
            )}
            {settings.dryRunMode && (
              <Badge variant="default">DRY RUN MODE</Badge>
            )}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Controlled, sequential execution pipeline with pre-commit credential guards
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleEnqueueAll}
          disabled={isProcessing || repositories.length === 0}
          icon={Play}
        >
          Enqueue All Active
        </Button>
      </div>

      {/* Queue List */}
      {queue.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Push queue is currently empty"
          description="Repositories will be queued automatically at scheduled sync times or via manual triggers."
          actionLabel="Enqueue Repositories"
          onAction={handleEnqueueAll}
          actionIcon={Play}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.map((item, index) => {
            const isCurrent = !['COMPLETED', 'SUCCESS', 'FAILED', 'BLOCKED', 'NO_CHANGES', 'DRY_RUN'].includes(item.status);

            return (
              <Card
                key={item.id}
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  border: isCurrent ? '1px solid var(--primary-bright)' : '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.repositoryName}</h3>
                    <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      ({item.branch || 'main'})
                    </span>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Progress bar if active */}
                {isCurrent && typeof item.progress === 'number' && item.progress > 0 && (
                  <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.progress}%`, height: '100%', background: 'var(--primary-bright)', transition: 'width 0.3s ease' }} />
                  </div>
                )}

                {/* Live execution logs */}
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
                      <div
                        key={logIdx}
                        style={{
                          color: log.includes('Error') || log.includes('BLOCKED')
                            ? 'var(--danger)'
                            : log.includes('completed') || log.includes('successful')
                            ? 'var(--success)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
