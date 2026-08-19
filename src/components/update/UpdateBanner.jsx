import React from 'react';
import { Rocket, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useUpdateStore } from '../../store/updateStore';

export function UpdateBanner() {
  const {
    status,
    latestVersion,
    isBannerDismissed,
    dismissBanner,
    openUpdateModal,
  } = useUpdateStore();

  const isAvailable = status === 'AVAILABLE';
  const isDownloaded = status === 'DOWNLOADED';

  if (isBannerDismissed || (!isAvailable && !isDownloaded)) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '36px',
        right: '24px',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${isDownloaded ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: isDownloaded ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDownloaded ? 'var(--success)' : 'var(--primary-bright)',
          flexShrink: 0,
        }}
      >
        {isDownloaded ? <CheckCircle2 size={18} /> : <Rocket size={18} />}
      </div>

      <div>
        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {isDownloaded ? `Update v${latestVersion} Ready` : `GitPilot v${latestVersion} Available`}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isDownloaded ? 'Restart application to finish install' : 'New enhancements and security fixes'}
        </div>
      </div>

      <button
        onClick={openUpdateModal}
        className="btn btn-primary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '4px',
          background: isDownloaded ? 'var(--success)' : undefined,
          borderColor: isDownloaded ? 'var(--success)' : undefined,
        }}
      >
        <span>{isDownloaded ? 'Install Now' : 'View'}</span>
        <ArrowRight size={12} />
      </button>

      <button
        onClick={dismissBanner}
        className="btn-close"
        style={{ width: '24px', height: '24px' }}
        title="Dismiss notice"
        aria-label="Dismiss notice"
      >
        <X size={13} />
      </button>
    </div>
  );
}
