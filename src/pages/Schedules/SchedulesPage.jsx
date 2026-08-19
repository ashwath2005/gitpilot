import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Play } from 'lucide-react';
import { useScheduleStore } from '../../store/scheduleStore';
import { useProjectStore } from '../../store/projectStore';
import { useQueueStore } from '../../store/queueStore';
import { Button, Card, Badge, EmptyState, Input } from '../../components/ui';

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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Automation Schedules</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure recurring background Git scans and automated pushes
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAdding(!isAdding)}
          icon={Plus}
        >
          New Schedule
        </Button>
      </div>

      {/* Add Schedule Box */}
      {isAdding && (
        <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Create Automation Schedule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Input
              label="Schedule Name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              label="Execution Time"
              type="time"
              className="font-mono"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Frequency
              </label>
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
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddSchedule}>Save Schedule</Button>
          </div>
        </Card>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Active Schedules"
          description="Create a schedule to automate repository scanning and pushes at regular intervals."
          actionLabel="Create Schedule"
          onAction={() => setIsAdding(true)}
          actionIcon={Plus}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              style={{
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
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{schedule.name}</h3>
                    <Badge variant="primary">{schedule.time}</Badge>
                    <Badge variant="default">{schedule.frequency}</Badge>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Applies to {schedule.repositoryIds === 'all' ? `all active repositories (${repositories.filter(r => r.enabled).length})` : 'custom selection'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleTriggerNow(schedule)}
                  icon={Play}
                  title="Run this schedule immediately"
                >
                  Run Now
                </Button>

                <button
                  type="button"
                  onClick={() => saveSchedule({ ...schedule, enabled: !schedule.enabled })}
                  className="btn-ghost"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: schedule.enabled ? 'var(--success)' : 'var(--text-muted)',
                  }}
                >
                  {schedule.enabled ? 'Enabled' : 'Disabled'}
                </button>

                {schedules.length > 1 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteSchedule(schedule.id)}
                    icon={Trash2}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
