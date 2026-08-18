import React from 'react';
import { ShieldCheck, Cpu, GitCommit } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useQueueStore } from '../../store/queueStore';
import { useSettingsStore } from '../../store/settingsStore';

export function StatusBar({ gitVersion }) {
  const { repositories } = useProjectStore();
  const { queue, isProcessing } = useQueueStore();
  const { settings } = useSettingsStore();

  const changedCount = repositories.filter((r) => r.status === 'CHANGES' || (r.filesChanged && r.filesChanged > 0)).length;
  const queuedCount = queue.filter((q) => q.status === 'QUEUED' || q.status === 'PROCESSING').length;

  return (
    <footer className="app-statusbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
          <span>Git Engine: {gitVersion || 'Ready'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <ShieldCheck size={12} style={{ color: 'var(--primary-bright)' }} />
          <span>Secret Guard Active</span>
        </div>

        {settings.enableAI && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--info)' }}>
            <Cpu size={12} />
            <span>AI Assist: {settings.aiModel || 'gpt-4o-mini'}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <span>{repositories.length} Repositories</span>
          {changedCount > 0 && (
            <span style={{ color: 'var(--primary-bright)', marginLeft: '6px' }}>
              ({changedCount} with changes)
            </span>
          )}
        </div>

        {queuedCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }}>
            <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} />
            <span>Queue: {queuedCount} active</span>
          </div>
        )}

        <div>
          <span>Autonomous: </span>
          <span style={{ color: settings.autonomousMode ? 'var(--success)' : 'var(--text-muted)' }}>
            {settings.autonomousMode ? 'ENABLED' : 'OFF'}
          </span>
        </div>
      </div>
    </footer>
  );
}
