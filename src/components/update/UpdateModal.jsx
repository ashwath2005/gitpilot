import React from 'react';
import {
  Rocket,
  Download,
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useUpdateStore } from '../../store/updateStore';
import { GITHUB_RELEASES_URL } from '../../config/version';

export function UpdateModal() {
  const {
    status,
    currentVersion,
    latestVersion,
    releaseNotes,
    releaseDate,
    downloadProgress,
    error,
    isModalOpen,
    closeUpdateModal,
    downloadUpdate,
    installUpdate,
    checkForUpdates,
  } = useUpdateStore();

  if (!isModalOpen) return null;

  const isDownloading = status === 'DOWNLOADING';
  const isDownloaded = status === 'DOWNLOADED';
  const isError = status === 'ERROR';

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec === 0) return '';
    const mbps = bytesPerSec / (1024 * 1024);
    return `${mbps.toFixed(1)} MB/s`;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }} onClick={closeUpdateModal}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: isDownloaded ? 'rgba(34, 197, 94, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                border: `1px solid ${isDownloaded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDownloaded ? 'var(--success)' : 'var(--primary-bright)',
              }}
            >
              {isDownloaded ? <CheckCircle2 size={22} /> : <Rocket size={22} />}
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {isDownloaded
                  ? `GitPilot v${latestVersion || ''} Ready to Install`
                  : isDownloading
                  ? `Downloading GitPilot v${latestVersion || ''}`
                  : isError
                  ? 'Update Check Notice'
                  : `GitPilot Update Available`}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Currently installed: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>v{currentVersion}</span>
                {latestVersion && latestVersion !== currentVersion && (
                  <span>
                    {' '}→ <strong className="font-mono" style={{ color: 'var(--primary-bright)' }}>v{latestVersion}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={closeUpdateModal}
            className="btn-close"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Download Progress Bar when Downloading */}
          {isDownloading && (
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--primary-bright)' }} />
                  Downloading Update...
                </span>
                <span className="font-mono" style={{ color: 'var(--primary-bright)', fontWeight: 700 }}>
                  {downloadProgress.percent}%
                </span>
              </div>

              {/* Progress Track */}
              <div
                style={{
                  height: '8px',
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${downloadProgress.percent}%`,
                    background: 'var(--primary-bright)',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>
                  {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                  {downloadProgress.bytesPerSecond > 0 && ` • ${formatSpeed(downloadProgress.bytesPerSecond)}`}
                </span>
                {downloadProgress.estimatedRemainingSec > 0 && (
                  <span>~{downloadProgress.estimatedRemainingSec}s remaining</span>
                )}
              </div>
            </div>
          )}

          {/* Downloaded Ready State */}
          {isDownloaded && (
            <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)', marginBottom: '4px' }}>
                Download Complete!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                GitPilot v{latestVersion} is ready. Restart GitPilot now to apply the update. Your repositories, settings, and credentials will remain completely untouched.
              </div>
            </div>
          )}

          {/* Error Notice */}
          {isError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                <AlertCircle size={16} />
                <span>Unable to complete update check</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {error || 'Could not connect to GitHub release server.'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Your current GitPilot installation remains intact and 100% operational.
              </div>
            </div>
          )}

          {/* What's New / Release Notes */}
          {!isError && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                  What's New in v{latestVersion || currentVersion}
                </span>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11.5px', color: 'var(--primary-bright)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>GitHub Release</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {releaseNotes ? (
                  releaseNotes
                ) : (
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    <li>Performance improvements for rapid local Git monitoring</li>
                    <li>Enhanced secret scanning and credential protection</li>
                    <li>Improved scheduler reliability and background queue processing</li>
                    <li>Windows system notifications & tray synchronization</li>
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--bg-base)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          {isDownloaded ? (
            <>
              <button onClick={closeUpdateModal} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Update Later
              </button>
              <button
                onClick={() => installUpdate(false)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'var(--success)', borderColor: 'var(--success)' }}
              >
                <RotateCw size={14} />
                <span>Restart & Install Update</span>
              </button>
            </>
          ) : isDownloading ? (
            <button disabled className="btn btn-secondary" style={{ opacity: 0.7 }}>
              <span>Downloading in background...</span>
            </button>
          ) : isError ? (
            <>
              <button onClick={closeUpdateModal} className="btn btn-secondary">
                Close
              </button>
              <button onClick={() => checkForUpdates(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCw size={13} />
                <span>Retry Check</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={closeUpdateModal} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Later
              </button>
              <button
                onClick={downloadUpdate}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px' }}
              >
                <Download size={14} />
                <span>Update Now</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
