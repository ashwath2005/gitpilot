import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard GitPilot Loading State
 */
export function LoadingState({
  message = 'Loading...',
  spinnerSize = 20,
  height = '200px',
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        height,
        color: 'var(--text-muted)',
        ...style,
      }}
    >
      <Loader2 size={spinnerSize} className="animate-spin" style={{ color: 'var(--primary-bright)' }} />
      {message && <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{message}</span>}
    </div>
  );
}
