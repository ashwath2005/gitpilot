import React, { useState } from 'react';
import {
  Folder,
  FolderSearch,
  CheckCircle,
  GitBranch,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  X,
  User,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { desktopBridge } from '../../services/desktopBridge';
import { databaseService } from '../../services/database/databaseService';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Login } from '../../pages/Auth/Login';
import { Register } from '../../pages/Auth/Register';

export function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [workspacePath, setWorkspacePath] = useState('D:\\');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredRepos, setDiscoveredRepos] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [automationMode, setAutomationMode] = useState('review'); // 'manual', 'review', 'autonomous'
  const [authView, setAuthView] = useState('choice'); // 'choice', 'login', 'register'

  const { fetchRepositories } = useProjectStore();
  const { updateSettings } = useSettingsStore();
  const { isAuthenticated, user, profile } = useAuthStore();

  if (!isOpen) return null;

  const handleSkip = () => {
    databaseService.setOnboardingCompleted(true);
    onComplete();
  };

  const handlePickDirectory = async () => {
    const selected = await desktopBridge.selectDirectory();
    if (selected) {
      setWorkspacePath(selected);
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      const res = await desktopBridge.scanWorkspace(workspacePath);
      if (res && res.success && Array.isArray(res.repositories)) {
        const gitOnly = res.repositories.filter((r) => r.isGit);
        setDiscoveredRepos(gitOnly);
        setSelectedPaths(new Set(gitOnly.map((r) => r.path)));
      } else {
        setDiscoveredRepos([]);
        setSelectedPaths(new Set());
      }
      setStep(4);
    } catch (e) {
      console.warn('Scan error:', e);
      setDiscoveredRepos([]);
      setSelectedPaths(new Set());
      setStep(4);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleRepoSelection = (path) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const toggleSelectAll = () => {
    if (selectedPaths.size === discoveredRepos.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(discoveredRepos.map((r) => r.path)));
    }
  };

  const handleFinish = async () => {
    // 1. Import selected repositories
    for (const repo of discoveredRepos) {
      if (selectedPaths.has(repo.path)) {
        await databaseService.addRepository({
          name: repo.name,
          path: repo.path,
          enabled: true,
        });
      }
    }

    // 2. Save automation preference
    await updateSettings({
      autonomousMode: automationMode === 'autonomous',
      dryRunMode: false,
    });

    // 3. Mark onboarding completed
    databaseService.setOnboardingCompleted(true);
    await fetchRepositories();
    onComplete();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '640px',
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-base)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                style={{
                  height: '4px',
                  flex: 1,
                  borderRadius: '2px',
                  background:
                    s < step
                      ? 'var(--success)'
                      : s === step
                      ? 'var(--primary-bright)'
                      : 'var(--border-default)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px' }}>
            Step {step} of 5
          </span>
          <button
            onClick={handleSkip}
            className="btn-close"
            style={{ marginLeft: '8px' }}
            title="Skip onboarding"
            aria-label="Skip onboarding"
          >
            <X size={15} />
          </button>
        </div>

        {/* Step Content */}
        <div style={{ padding: '28px' }}>
          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--primary-bright)',
                }}
              >
                <GitBranch size={28} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                Welcome to GitPilot
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 24px' }}>
                Your local-first autonomous Git command center. Monitor genuine project changes, detect secrets before commits, generate clean conventional commits, and safely push.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <Shield size={16} style={{ color: 'var(--success)', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Secret Guard</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Blocks .env & tokens</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <Sparkles size={16} style={{ color: 'var(--primary-bright)', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Smart Commits</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conventional diff analysis</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--accent)', marginBottom: '6px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Zero Fake Activity</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Genuine workflows only</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  onClick={handleSkip}
                  className="btn btn-ghost"
                  style={{ width: '100%', padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  Skip Onboarding
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>
                Select Workspace Directory
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '20px' }}>
                Select the parent directory where your projects reside (e.g. <code className="font-mono">D:\</code> or <code className="font-mono">D:\Development</code>). GitPilot will discover all Git repositories.
              </p>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="text"
                  className="input-text font-mono"
                  value={workspacePath}
                  onChange={(e) => setWorkspacePath(e.target.value)}
                  placeholder="e.g. D:\Projects"
                  style={{ flex: 1 }}
                />
                <button onClick={handlePickDirectory} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Folder size={14} />
                  <span>Browse</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!workspacePath.trim()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                  GitPilot Cloud Account (Optional)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', maxWidth: '440px', margin: '0 auto' }}>
                  Connect an account to sync device metadata and subscription features.
                </p>
              </div>

              {/* Privacy Notice Card */}
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>100% Local Privacy:</strong> Your repositories, source code, Git diffs, and credentials remain on your computer. GitPilot only uses your account to manage application access and optional product information.
                </div>
              </div>

              {isAuthenticated ? (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <CheckCircle size={15} /> Signed in as {profile?.display_name || user?.email}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Plan: <strong style={{ color: 'var(--primary-bright)', textTransform: 'capitalize' }}>{profile?.plan || 'Free'}</strong> • Ready for workspace scan
                  </div>
                </div>
              ) : authView === 'login' ? (
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                  <Login
                    onSuccess={() => setAuthView('choice')}
                    onSwitchToRegister={() => setAuthView('register')}
                  />
                </div>
              ) : authView === 'register' ? (
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                  <Register
                    onSuccess={() => setAuthView('choice')}
                    onSwitchToLogin={() => setAuthView('login')}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  <button
                    onClick={() => setAuthView('register')}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <User size={15} />
                    <span>Create Free Cloud Account</span>
                  </button>
                  <button
                    onClick={() => setAuthView('login')}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <LogIn size={14} />
                    <span>Sign in with Existing Account</span>
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Scanning Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>{isAuthenticated ? 'Continue to Scan' : 'Continue with GitPilot'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 600 }}>Repositories Discovered</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    Found {discoveredRepos.length} Git repositories in <span className="font-mono">{workspacePath}</span>
                  </p>
                </div>
                <button onClick={toggleSelectAll} className="btn-ghost" style={{ fontSize: '12px', color: 'var(--primary-bright)' }}>
                  {selectedPaths.size === discoveredRepos.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-elevated)',
                  marginBottom: '20px',
                }}
              >
                {discoveredRepos.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                    No Git repositories found in this directory.
                  </div>
                ) : (
                  discoveredRepos.map((repo) => {
                    const isSelected = selectedPaths.has(repo.path);
                    return (
                      <div
                        key={repo.path}
                        onClick={() => toggleRepoSelection(repo.path)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `1px solid ${isSelected ? 'var(--primary-bright)' : 'var(--border-default)'}`,
                            background: isSelected ? 'var(--primary-bright)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{repo.name}</div>
                          <div className="font-mono text-truncate" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {repo.path}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={14} />
                  <span>Back to Browse</span>
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {discoveredRepos.length === 0 ? (
                    <button
                      onClick={handleSkip}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Skip & Start Empty</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(5)}
                      disabled={selectedPaths.size === 0}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>Continue ({selectedPaths.size})</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>
                Choose Automation Mode
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '16px' }}>
                Select how GitPilot should monitor and manage your {selectedPaths.size} repositories. You can adjust this anytime in Settings.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  {
                    id: 'manual',
                    title: 'Manual Mode',
                    desc: 'Trigger repository scans and commit pushes exclusively on-demand.',
                  },
                  {
                    id: 'review',
                    title: 'Review Before Commit (Recommended)',
                    desc: 'GitPilot detects changes, runs secret checks, and presents commit previews for quick approval.',
                  },
                  {
                    id: 'autonomous',
                    title: 'Fully Autonomous Mode',
                    desc: 'GitPilot runs in background, performs secret scans, auto-commits with conventional messages, and pushes.',
                  },
                ].map((mode) => {
                  const isSelected = automationMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setAutomationMode(mode.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--primary-bright)' : 'var(--border-default)'}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `1px solid ${isSelected ? 'var(--primary-bright)' : 'var(--border-default)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px',
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-bright)' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {mode.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {mode.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setStep(4)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleFinish}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px' }}
                >
                  <CheckCircle size={15} />
                  <span>Launch GitPilot Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
