import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, TextButton, Input } from '../../components/ui';

export function Register({ onSuccess, onSwitchToLogin }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successNotice, setSuccessNotice] = useState(false);

  const { register, isCloudConfigured } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await register({ email, password, displayName });
    setLoading(false);

    if (res.success) {
      if (res.requiresEmailVerification) {
        setSuccessNotice(true);
      } else {
        if (onSuccess) onSuccess();
        else navigate('/');
      }
    } else {
      setErrorMsg(res.error || 'Registration failed');
    }
  };

  if (successNotice) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'var(--success)',
          }}
        >
          <CheckCircle size={26} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
          Verification Email Sent
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          We sent a confirmation link to <strong>{email}</strong>. Please verify your email to activate your account.
        </p>
        <Button
          variant="primary"
          onClick={onSwitchToLogin || (() => navigate('/auth/login'))}
          style={{ width: '100%' }}
        >
          Proceed to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Create GitPilot Account
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Start with Free plan. Sync account preferences & devices.
        </p>
      </div>

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
          label="Display Name"
          type="text"
          icon={User}
          placeholder="e.g. Ashwath"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="Minimum 6 characters recommended"
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !email || !password || !isCloudConfigured}
          icon={ArrowRight}
          iconPosition="right"
          style={{ width: '100%', marginTop: '6px', padding: '10px 16px' }}
        >
          Create Account
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
        <span>Already have an account?</span>
        <TextButton
          type="button"
          onClick={onSwitchToLogin || (() => navigate('/auth/login'))}
          style={{ fontWeight: 600 }}
        >
          Sign in →
        </TextButton>
      </div>
    </div>
  );
}
