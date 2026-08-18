import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useProjectStore } from '../../store/projectStore';
import { useQueueStore } from '../../store/queueStore';

export function SchedulesPage() {
  const { schedules, fetchSchedules, saveSchedule, deleteSchedule } = useScheduleStore();
  const { repositories } = useProjectStore();
  const { enqueueRepositories } = useQueueStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('19:00');
  const [newFrequency, setNewFrequency] = useState('daily');
  const [newName, setNewName] = useState('Evening Sync');

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleAddSchedule = async () => {
    await saveSchedule({
      name: newName,
      time: newTime,
      frequency: newFrequency,
      enabled: true,
      repositoryIds: 'all',
    });
    setIsAdding(false);
  };

  const handleTriggerNow = (schedule) => {
    const targets = repositories.filter((r) => r.enabled);
    enqueueRepositories(targets);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Automation Schedules</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure recurring background Git scans and automated pushes
          </p>
        </div>

        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary">
          <Plus size={13} />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Add Schedule Box */}
      {isAdding && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px' }}>Create Automation Schedule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', marginBottom: '4px' }}>Schedule Name</label>
              <input
                type="text"
                className="input-text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', marginBottom: '4px' }}>Execution Time</label>
              <input
                type="time"
                className="input-text font-mono"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', marginBottom: '4px' }}>Frequency</label>
              <select
                className="input-text"
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                style={{ height: '34px' }}
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                <option value="weekends">Weekends Only</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button onClick={() => setIsAdding(false)} className="btn btn-secondary btn-sm">Cancel</button>
            <button onClick={handleAddSchedule} className="btn btn-primary btn-sm">Save Schedule</button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} style={{ color: 'var(--primary-bright)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{schedule.name}</h3>
                  <span className="badge badge-changes font-mono">{schedule.time}</span>
                  <span className="badge badge-ready">{schedule.frequency}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Applies to {schedule.repositoryIds === 'all' ? `all active repositories (${repositories.filter(r => r.enabled).length})` : 'custom selection'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleTriggerNow(schedule)}
                className="btn btn-secondary btn-sm"
                title="Run this schedule immediately"
              >
                <Play size={11} fill="currentColor" />
                <span>Run Now</span>
              </button>

              <button
                onClick={() => saveSchedule({ ...schedule, enabled: !schedule.enabled })}
                className="btn-ghost"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: schedule.enabled ? 'var(--success)' : 'var(--text-muted)',
                }}
              >
                {schedule.enabled ? 'Enabled' : 'Disabled'}
              </button>

              {schedules.length > 1 && (
                <button onClick={() => deleteSchedule(schedule.id)} className="btn btn-danger btn-sm">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
