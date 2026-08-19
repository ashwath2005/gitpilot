import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

/**
 * Standard GitPilot Error State Component
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
  details,
  onRetry,
  onDismiss,
  style = {},
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <AlertCircle size={18} style={{ color: 'var(--danger)', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </h4>
            {message && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {message}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>

      {details && (
        <div style={{ marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showDetails && (
            <pre
              className="font-mono"
              style={{
                marginTop: '8px',
                padding: '8px 10px',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '140px',
                overflowY: 'auto',
              }}
            >
              {typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
