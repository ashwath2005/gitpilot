import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Bell,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export function SettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Settings</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure GitPilot automation rules, security guards, and AI integration
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary">
          <Save size={13} />
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Section 1: Automation & Autonomous Mode */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <Shield size={16} style={{ color: 'var(--primary-bright)' }} />
          <h3 style={{ fontSize: '14px' }}>Automation Mode & Safety</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Autonomous Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                When enabled, scheduled runs will automatically commit and push changed repositories without manual confirmation.
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              checked={Boolean(localSettings.autonomousMode)}
              onChange={(e) => handleChange('autonomousMode', e.target.checked)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Dry Run Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Simulate scans, diff analysis, and commit generation without creating actual commits or pushing to remotes.
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              checked={Boolean(localSettings.dryRunMode)}
              onChange={(e) => handleChange('dryRunMode', e.target.checked)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Retry Attempts on Network Error</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Maximum automatic retry attempts for transient network issues (stops immediately on authentication errors).
              </div>
            </div>
            <select
              className="input-text"
              style={{ width: '100px' }}
              value={localSettings.retryCount || 3}
              onChange={(e) => handleChange('retryCount', Number(e.target.value))}
            >
              <option value={1}>1 time</option>
              <option value={3}>3 times</option>
              <option value={5}>5 times</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: AI Commit Suggestions */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <Sparkles size={16} style={{ color: 'var(--primary-bright)' }} />
          <h3 style={{ fontSize: '14px' }}>AI Commit Engine (Optional)</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Enable AI Commit Messages</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Uses OpenAI models to analyze sanitized diffs and generate conventional commit messages.
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              checked={Boolean(localSettings.enableAI)}
              onChange={(e) => handleChange('enableAI', e.target.checked)}
            />
          </div>

          {localSettings.enableAI && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>OpenAI API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="input-text font-mono"
                  value={localSettings.openaiApiKey || ''}
                  onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Stored strictly in your local client. Secrets are never transmitted.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Model</label>
                <select
                  className="input-text"
                  value={localSettings.aiModel || 'gpt-4o-mini'}
                  onChange={(e) => handleChange('aiModel', e.target.value)}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient)</option>
                  <option value="gpt-4o">gpt-4o (High precision)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Desktop Notifications */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <Bell size={16} style={{ color: 'var(--primary-bright)' }} />
          <h3 style={{ fontSize: '14px' }}>Notifications</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Notify on Successful Push</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Show native desktop notification when a repository is committed and pushed.
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              checked={Boolean(localSettings.notificationPushSuccess)}
              onChange={(e) => handleChange('notificationPushSuccess', e.target.checked)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Notify on Failure & Security Alerts</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Immediate warning when push fails, authentication is required, or a secret is detected.
              </div>
            </div>
            <input
              type="checkbox"
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              checked={Boolean(localSettings.notificationPushFailure)}
              onChange={(e) => handleChange('notificationPushFailure', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
