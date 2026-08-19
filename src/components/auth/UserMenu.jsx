import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  LogOut,
  Settings,
  ChevronDown,
  Sparkles,
  Laptop,
  CheckCircle2,
  LogIn,
  Crown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function UserMenu({ onOpenAuthModal }) {
  const { user, profile, isAuthenticated, isAdmin, logout, isCloudConfigured } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
        }}
        title="Sign in to GitPilot Cloud"
      >
        <LogIn size={13} />
        <span>Sign In</span>
      </button>
    );
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const plan = (profile?.plan || 'free').toUpperCase();
  const isPro = profile?.plan === 'pro' || profile?.plan === 'lifetime';

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: isPro ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-elevated)',
            border: `1px solid ${isPro ? 'var(--primary-bright)' : 'var(--border-default)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
            color: isPro ? 'var(--primary-bright)' : 'var(--text-secondary)',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '1px 5px',
              borderRadius: '4px',
              background: isPro ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
              color: isPro ? 'var(--primary-bright)' : 'var(--text-muted)',
              border: `1px solid ${isPro ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
              fontWeight: 600,
            }}
          >
            {plan}
          </span>
        </div>

        <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '240px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
            padding: '6px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* User Info Header */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ fontSize: '10.5px', color: 'var(--success)', fontWeight: 500 }}>
                {profile?.status === 'active' ? 'Active Account' : profile?.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setMenuOpen(false);
              navigate('/settings');
            }}
            className="btn-ghost"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              color: 'var(--text-secondary)',
            }}
          >
            <Settings size={14} />
            <span>Account & Preferences</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/admin');
              }}
              className="btn-ghost"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                fontSize: '12px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                color: 'var(--primary-bright)',
                background: 'rgba(99, 102, 241, 0.08)',
                fontWeight: 600,
              }}
            >
              <Crown size={14} />
              <span>Owner Admin Console</span>
            </button>
          )}

          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

          <button
            onClick={async () => {
              setMenuOpen(false);
              await logout();
            }}
            className="btn-ghost"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              color: 'var(--danger)',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
