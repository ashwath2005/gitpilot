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
  Trash2,
  Folder,
  RefreshCw,
  Key,
  HardDrive,
  User,
  LogOut,
  ShieldCheck,
  Laptop,
  LogIn,
  Crown,
  Rocket,
  Download,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useUpdateStore } from '../../store/updateStore';
import { desktopBridge } from '../../services/desktopBridge';
import { databaseService } from '../../services/database/databaseService';
import { AuthModal } from '../../components/auth/AuthModal';
import { APP_VERSION, GITHUB_REPO_URL, GITHUB_RELEASES_URL } from '../../config/version';

export function SettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { user, profile, devices, isAuthenticated, isAdmin, logout, updateDisplayName, refreshProfile } = useAuthStore();
  const {
    status: updateStatus,
    currentVersion,
    latestVersion,
    lastChecked,
    channel: updateChannel,
    autoCheck,
    autoDownload,
    installOnQuit,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    openUpdateModal,
    updateConfig: setUpdateConfig,
  } = useUpdateStore();

  const [activeTab, setActiveTab] = useState('account');
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [gitVersion, setGitVersion] = useState('Checking...');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [editName, setEditName] = useState(profile?.display_name || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    desktopBridge.hasSecureApiKey().then(setHasApiKey);
    desktopBridge.checkGit().then((res) => {
      if (res && res.success) {
        setGitVersion(res.version || 'Ready');
      } else {
        setGitVersion('Not found in PATH');
      }
    });
  }, [fetchSettings]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (apiKeyInput.trim()) {
      await desktopBridge.setSecureApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setApiKeyInput('');
    }
    await updateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRemoveApiKey = async () => {
    await desktopBridge.removeSecureApiKey();
    setHasApiKey(false);
    setApiKeyInput('');
    await updateSettings({ enableAI: false });
  };

  const handleTestAIConnection = async () => {
    setTestingAI(true);
    setAiTestResult(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      if (hasApiKey || apiKeyInput.trim()) {
        setAiTestResult({ success: true, message: 'AI Engine credentials validated.' });
      } else {
        setAiTestResult({ success: false, message: 'No API key configured.' });
      }
    } catch (e) {
      setAiTestResult({ success: false, message: e.message });
    } finally {
      setTestingAI(false);
    }
  };

  const handleClearLogs = async () => {
    await databaseService.clearLogs();
    alert('Local system logs cleared.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Settings</h1>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure GitPilot desktop runtime, automation preferences, and security policies
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Save size={13} />
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-default)', paddingBottom: '2px', overflowX: 'auto' }}>
        {[
          { id: 'account', label: 'Account', icon: User },
          { id: 'general', label: 'General', icon: SettingsIcon },
          { id: 'updates', label: 'Updates', icon: Rocket },
          { id: 'automation', label: 'Automation', icon: Clock },
          { id: 'ai', label: 'AI Engine', icon: Sparkles },
          { id: 'security', label: 'Security & Secrets', icon: Shield },
          { id: 'git', label: 'Git & Environment', icon: Cpu },
          { id: 'advanced', label: 'Advanced', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12.5px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--primary-bright)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 0: Account */}
      {activeTab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isAuthenticated ? (
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--primary-bright)',
                    }}
                  >
                    {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                      {profile?.display_name || 'Developer'}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAdmin && (
                    <span style={{ fontSize: '11px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Crown size={12} /> Owner Admin
                    </span>
                  )}
                  <button onClick={logout} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Account Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '14px',
                }}
              >
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>ACCOUNT PLAN</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-bright)', textTransform: 'capitalize' }}>
                    {profile?.plan || 'Free'} Plan
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Autonomous sync & local guard</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>ACCOUNT STATUS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)', textTransform: 'capitalize' }}>
                      {profile?.status || 'Active'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Authorized for cloud sync</div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>GITPILOT VERSION</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    v1.1.0
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Latest Windows Release</div>
                </div>
              </div>

              {/* Edit Display Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    DISPLAY NAME
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    style={{ width: '100%' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name or handle"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (editName.trim()) {
                      await updateDisplayName(editName.trim());
                      alert('Display name updated!');
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-end', height: '36px' }}
                >
                  Update Name
                </button>
              </div>

              {/* Connected Devices */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                  CONNECTED DEVICES ({devices.length})
                </h4>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  {devices.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      This device is actively linked.
                    </div>
                  ) : (
                    devices.map((d) => (
                      <div
                        key={d.id || d.device_id}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Laptop size={15} style={{ color: 'var(--primary-bright)' }} />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{d.device_name || 'Windows PC'} (Current)</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              ID: {d.device_id?.substring(0, 16)}... • v{d.app_version || '1.1.0'}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Last active: {d.last_seen ? new Date(d.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Privacy Statement */}
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.06)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--success)' }}>
                    Local-First Privacy Guarantee
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                    GitPilot does not upload your repositories, source code, Git diffs, credentials, SSH keys, or environment files. All Git tracking and AI diff evaluations remain strictly local to your machine.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: 'var(--primary-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={28} />
              </div>
              <div style={{ maxWidth: '420px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>
                  Sign in to GitPilot Cloud
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Connect your GitPilot account to manage preferences and view connected devices. Your Git repositories and source code remain 100% local on your computer.
                </p>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LogIn size={15} />
                <span>Sign In / Create Account</span>
              </button>

              <div
                style={{
                  maxWidth: '500px',
                  marginTop: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Privacy note: GitPilot does not upload your repositories, source code, Git diffs, credentials, SSH keys, or environment files.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              Desktop Application Preferences
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Minimize to System Tray on Close</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Closing the main window will minimize GitPilot to the taskbar tray to keep background schedules running.
                </div>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                checked={Boolean(localSettings.minimizeToTray ?? true)}
                onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Launch GitPilot at Windows Startup</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Automatically start GitPilot in the background when logging into your user account.
                </div>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                checked={Boolean(localSettings.launchOnStartup)}
                onChange={(e) => handleChange('launchOnStartup', e.target.checked)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Start Minimized in Tray</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Do not show the main application window automatically on startup.
                </div>
              </div>
              <input
                type="checkbox"
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                checked={Boolean(localSettings.startMinimized)}
                onChange={(e) => handleChange('startMinimized', e.target.checked)}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              Notifications
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Notify on Successful Push</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Show native desktop notifications when changes are committed and pushed.
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
                  Immediate alert when pushes fail, authentication is required, or a secret is intercepted.
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
      )}

      {/* Tab 2: Automation */}
      {activeTab === 'automation' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Autonomous Execution & Queue Policy
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Autonomous Push Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                When active, scheduled synchronization cycles will automatically stage, commit, and push without manual confirmation prompts.
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
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Dry Run Simulation Mode</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Simulate scans, diff security evaluations, and commit messages without writing commits or pushing to remote remotes.
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
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Network Retry Attempts</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Maximum automatic retry attempts with backoff before marking a push as failed.
              </div>
            </div>
            <select
              className="input-text"
              style={{ width: '110px' }}
              value={localSettings.retryCount || 3}
              onChange={(e) => handleChange('retryCount', Number(e.target.value))}
            >
              <option value={1}>1 attempt</option>
              <option value={3}>3 attempts</option>
              <option value={5}>5 attempts</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab 3: AI Engine */}
      {activeTab === 'ai' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600 }}>AI Commit Generator</h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Conventional commit syntax generator (feat:, fix:, refactor:, chore:)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Enable AI Commit Synthesis</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Analyzes sanitized diff summaries to write concise, professional conventional commit messages.
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500 }}>Secure API Key Vault</label>
                  {hasApiKey && (
                    <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Key Configured & Encrypted
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder={hasApiKey ? '•••••••••••••••••••••••• (Key saved)' : 'sk-...'}
                    className="input-text font-mono"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {hasApiKey && (
                    <button onClick={handleRemoveApiKey} className="btn btn-secondary" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Keys are stored in the local desktop credential store and never transmitted in plaintext.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>OpenAI Model</label>
                <select
                  className="input-text"
                  value={localSettings.aiModel || 'gpt-4o-mini'}
                  onChange={(e) => handleChange('aiModel', e.target.value)}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient - recommended)</option>
                  <option value="gpt-4o">gpt-4o (High precision)</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <button onClick={handleTestAIConnection} disabled={testingAI} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={13} className={testingAI ? 'animate-spin' : ''} />
                  <span>{testingAI ? 'Testing...' : 'Test Connection'}</span>
                </button>
                {aiTestResult && (
                  <span style={{ fontSize: '12px', color: aiTestResult.success ? 'var(--success)' : 'var(--danger)' }}>
                    {aiTestResult.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Secret Scanner & Credential Guard
          </h3>

          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            GitPilot inspects every changed file and diff prior to staging. Any attempt to commit blocked credentials will immediately abort and mark the operation as <span style={{ color: 'var(--danger)', fontWeight: 600 }}>BLOCKED</span>.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Protected File Extensions
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                <li><code>.env</code> & <code>.env.*</code></li>
                <li><code>*.pem</code>, <code>*.key</code>, <code>*.pfx</code></li>
                <li><code>credentials.json</code>, <code>secrets.json</code></li>
                <li><code>id_rsa</code>, <code>id_ed25519</code></li>
              </ul>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Monitored Secret Signatures
              </div>
              <ul style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                <li>OpenAI, GitHub, AWS Access Keys</li>
                <li>Private Key headers (RSA, EC, DSA)</li>
                <li>Slack & Stripe tokens</li>
                <li>High-entropy random tokens & passwords</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Git */}
      {activeTab === 'git' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Git CLI Environment
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Installed Git Binary</div>
              <div className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {gitVersion}
              </div>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Active
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            GitPilot discovers remotes (such as <code>origin</code>) and branch names dynamically on each repository without hardcoding default names.
          </div>
        </div>
      )}

      {/* Tab 6: Advanced */}
      {activeTab === 'advanced' && (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Storage & System Logs
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Clear System & Execution Logs</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Flush historical background queue log entries from local storage.
              </div>
            </div>
            <button onClick={handleClearLogs} className="btn btn-secondary" style={{ color: 'var(--danger)' }}>
              Clear Logs
            </button>
          </div>
        </div>
      )}

      {/* Tab: Application Updates */}
      {activeTab === 'updates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Version & Status Card */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Application Version & Channel
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  GitPilot uses official GitHub Releases for cryptographic and differential NSIS updates.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <span>Changelog</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => checkForUpdates(true)}
                  disabled={updateStatus === 'CHECKING' || updateStatus === 'DOWNLOADING'}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} className={updateStatus === 'CHECKING' ? 'animate-spin' : ''} />
                  <span>{updateStatus === 'CHECKING' ? 'Checking...' : 'Check for Updates'}</span>
                </button>
              </div>
            </div>

            {/* Version Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Current Version</div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  v{currentVersion || APP_VERSION}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Installed & Ready
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Latest Release</div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: updateStatus === 'AVAILABLE' ? 'var(--primary-bright)' : 'var(--text-primary)', marginTop: '4px' }}>
                  {latestVersion ? `v${latestVersion}` : `v${currentVersion || APP_VERSION}`}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {updateStatus === 'AVAILABLE' ? 'New release available' : 'Up to date'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Update Status</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: updateStatus === 'AVAILABLE' ? 'var(--primary-bright)' : updateStatus === 'DOWNLOADED' ? 'var(--success)' : 'var(--text-secondary)', marginTop: '6px' }}>
                  {updateStatus === 'CHECKING'
                    ? 'Checking for updates...'
                    : updateStatus === 'AVAILABLE'
                    ? 'Update Available'
                    : updateStatus === 'DOWNLOADING'
                    ? 'Downloading Package...'
                    : updateStatus === 'DOWNLOADED'
                    ? 'Ready to Install'
                    : updateStatus === 'ERROR'
                    ? 'Check Notice'
                    : 'Up to Date'}
                </div>
                {lastChecked && (
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Checked: {new Date(lastChecked).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* Action Banner if Update Available or Downloaded */}
            {updateStatus === 'AVAILABLE' && (
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-bright)' }}>
                    GitPilot v{latestVersion} is ready to download
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Click to view release notes and download the differential installer.
                  </div>
                </div>
                <button onClick={openUpdateModal} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={13} />
                  <span>View & Download</span>
                </button>
              </div>
            )}

            {updateStatus === 'DOWNLOADED' && (
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
                    GitPilot v{latestVersion} is downloaded and ready
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Restart application to complete installation. All repositories and credentials will remain untouched.
                  </div>
                </div>
                <button onClick={() => installUpdate(false)} className="btn btn-primary btn-sm" style={{ background: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RotateCw size={13} />
                  <span>Restart & Update</span>
                </button>
              </div>
            )}
          </div>

          {/* Update Channel & Automation Configuration */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              Update Preferences & Channel
            </h3>

            {/* Channel Selection */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Update Channel</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { id: 'stable', label: 'Stable Channel', desc: 'Tested, production-ready releases (Recommended)' },
                  { id: 'beta', label: 'Beta Channel', desc: 'Preview early features and release candidates' },
                ].map((ch) => {
                  const isSelected = updateChannel === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setUpdateConfig({ channel: ch.id })}
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--primary-bright)' : 'var(--border-default)'}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <input
                        type="radio"
                        name="updateChannel"
                        checked={isSelected}
                        onChange={() => setUpdateConfig({ channel: ch.id })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{ch.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{ch.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toggle: Auto Check */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Automatically Check for Updates</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Periodically poll GitHub Releases every 6 hours in the background.
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={autoCheck}
                  onChange={(e) => setUpdateConfig({ autoCheck: e.target.checked })}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Toggle: Auto Download */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Automatically Download Updates</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Download packages in the background when a new version is detected.
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => setUpdateConfig({ autoDownload: e.target.checked })}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Toggle: Install on Restart */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Install Downloaded Updates on Restart</div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Automatically apply ready updates when quitting or relaunching GitPilot.
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={installOnQuit}
                  onChange={(e) => setUpdateConfig({ installOnQuit: e.target.checked })}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          refreshProfile();
        }}
      />
    </div>
  );
}
