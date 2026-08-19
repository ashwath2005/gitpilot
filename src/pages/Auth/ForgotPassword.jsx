import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';

export function ForgotPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword, isCloudConfigured } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);

    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.error || 'Failed to send reset link');
    }
  };

  if (submitted) {
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
          Reset Link Sent
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password.
        </p>
        <Button
          variant="secondary"
          onClick={onSwitchToLogin}
          icon={ArrowLeft}
          style={{ width: '100%' }}
        >
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Reset Password
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Enter your registered email address to receive a secure password recovery link.
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
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !email || !isCloudConfigured}
          style={{ width: '100%', marginTop: '6px', padding: '10px 16px' }}
        >
          Send Reset Link
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onSwitchToLogin}
          icon={ArrowLeft}
          style={{ width: '100%' }}
        >
          Back to Sign In
        </Button>
      </form>
    </div>
  );
}
