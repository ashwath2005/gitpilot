import React from 'react';
import { AlertOctagon, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function SuspendedModal({ isOpen }) {
  const { logout, profile } = useAuthStore();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 100000, background: 'rgba(0, 0, 0, 0.88)' }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--danger)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Account Suspended
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>
          Your GitPilot account <strong style={{ color: 'var(--text-primary)' }}>{profile?.email}</strong> is currently suspended.
        </p>

        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Local Repositories Safe
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Your local repository files, Git commits, branches, and diffs on this machine remain completely untouched.
          </p>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Please contact support or your organization administrator for assistance.
        </p>

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <LogOut size={15} />
          <span>Log Out of GitPilot</span>
        </button>
      </div>
    </div>
  );
}
