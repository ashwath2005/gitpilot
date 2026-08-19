import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, TextButton, Input } from '../../components/ui';

export function Login({ onSuccess, onSwitchToRegister, onSwitchToForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login, isCloudConfigured } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      else navigate('/');
    } else {
      setErrorMsg(res.error || 'Invalid email or password');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Sign in to GitPilot
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Manage your account profile, sync preferences & connected devices
        </p>
      </div>

      {!isCloudConfigured && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            marginBottom: '18px',
            fontSize: '12px',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Cloud Not Configured</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Set <code className="font-mono">VITE_SUPABASE_URL</code> to enable cloud sync. Local Git operations remain 100% active.
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Password
            </label>
            <TextButton
              type="button"
              onClick={onSwitchToForgot || (() => navigate('/auth/forgot-password'))}
              style={{ fontSize: '11.5px' }}
            >
              Forgot password?
            </TextButton>
          </div>

          <Input
            type="password"
            icon={Lock}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !email || !password || !isCloudConfigured}
          icon={ArrowRight}
          iconPosition="right"
          style={{ width: '100%', marginTop: '6px', padding: '10px 16px' }}
        >
          Sign In
        </Button>
      </form>

      {/* Privacy Notice */}
      <div
        style={{
          marginTop: '20px',
          padding: '10px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <ShieldCheck size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Git repositories, diffs, and credentials remain 100% local on your computer.
        </span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <span>Don't have an account?</span>
        <TextButton
          type="button"
          onClick={onSwitchToRegister || (() => navigate('/auth/register'))}
          style={{ fontWeight: 600 }}
        >
          Create account →
        </TextButton>
      </div>
    </div>
  );
}
