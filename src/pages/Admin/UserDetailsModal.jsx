import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Laptop,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Loader2,
} from 'lucide-react';
import { userService, deviceService } from '../../services/cloud';
import { APP_VERSION } from '../../config/version';

export function UserDetailsModal({ user, isOpen, onClose, onUserUpdated }) {
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'free');
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user?.id && isOpen) {
      setSelectedPlan(user.plan || 'free');
      setConfirmSuspend(false);
      setConfirmDelete(false);
      setLoadingDevices(true);
      deviceService.getAllDevices(user.id).then((devs) => {
        setDevices(devs);
        setLoadingDevices(false);
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handlePlanChange = async (newPlan) => {
    setUpdating(true);
    const res = await userService.updateUserPlan(user.id, newPlan);
    setUpdating(false);
    if (res.success) {
      setSelectedPlan(newPlan);
      if (onUserUpdated) onUserUpdated();
    } else {
      alert('Failed to update plan: ' + res.error);
    }
  };

  const handleToggleSuspend = async () => {
    setUpdating(true);
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const res = await userService.updateUserStatus(user.id, nextStatus);
    setUpdating(false);
    setConfirmSuspend(false);
    if (res.success) {
      if (onUserUpdated) onUserUpdated();
      onClose();
    } else {
      alert('Failed to update status: ' + res.error);
    }
  };

  const handleDeleteProfile = async () => {
    setUpdating(true);
    const res = await userService.deleteProfile(user.id);
    setUpdating(false);
    setConfirmDelete(false);
    if (res.success) {
      if (onUserUpdated) onUserUpdated();
      onClose();
    } else {
      alert('Failed to delete profile: ' + res.error);
    }
  };

  const isSuspended = user.status === 'suspended';

  return (
    <div className="modal-overlay" style={{ zIndex: 100000 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-base)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-bright)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {(user.display_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                {user.display_name || 'Developer'}
              </h2>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '520px', overflowY: 'auto' }}>
          {/* Status & Plan Info */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>ACCOUNT STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isSuspended ? 'var(--danger)' : 'var(--success)',
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: isSuspended ? 'var(--danger)' : 'var(--success)' }}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>CURRENT PLAN</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-bright)', textTransform: 'capitalize' }}>
                {user.plan || 'Free'} Plan
              </div>
            </div>
          </div>

          {/* Change Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              CHANGE SUBSCRIPTION PLAN
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['free', 'pro', 'lifetime'].map((p) => (
                <button
                  key={p}
                  disabled={updating}
                  onClick={() => handlePlanChange(p)}
                  className={`btn ${selectedPlan === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Registered Devices */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                REGISTERED DEVICES ({devices.length})
              </label>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {loadingDevices ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                  Loading devices...
                </div>
              ) : devices.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No devices recorded yet.
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
                      <Laptop size={15} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 500 }}>{d.device_name || 'PC'}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ID: {d.device_id?.substring(0, 16)}... • v{d.app_version || APP_VERSION}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {d.last_seen ? new Date(d.last_seen).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account Metadata */}
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>Joined: {new Date(user.created_at).toLocaleString()}</div>
            <div>Last Active: {new Date(user.last_active).toLocaleString()}</div>
            <div>User ID: <code className="font-mono">{user.id}</code></div>
          </div>

          {/* Destructive Actions & Confirmations */}
          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {confirmSuspend ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
                  {isSuspended ? 'Reactivate User Account?' : 'Suspend User Account?'}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {isSuspended
                    ? 'The user will regain access to authenticated GitPilot cloud features.'
                    : 'The user will be blocked by the suspension wall. Their local Git repository files remain safe.'}
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmSuspend(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={handleToggleSuspend} disabled={updating} className="btn btn-danger btn-sm">
                    {updating ? 'Updating...' : isSuspended ? 'Reactivate User' : 'Confirm Suspend'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmSuspend(true)}
                className={`btn ${isSuspended ? 'btn-secondary' : 'btn-danger'} btn-sm`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSuspended ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span>{isSuspended ? 'Reactivate User' : 'Suspend User'}</span>
              </button>
            )}

            {confirmDelete ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
                  Delete User Profile Record?
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  This removes the user profile row from Supabase.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={handleDeleteProfile} disabled={updating} className="btn btn-danger btn-sm">
                    {updating ? 'Deleting...' : 'Delete Profile'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-ghost"
                style={{ width: '100%', fontSize: '11.5px', color: 'var(--danger)', padding: '6px' }}
              >
                Delete Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
