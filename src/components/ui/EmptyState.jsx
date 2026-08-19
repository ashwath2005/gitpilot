import React from 'react';
import { Button } from './Button';

/**
 * Standard GitPilot Empty State Display
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionVariant = 'primary',
  children,
  style = {},
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          <Icon size={22} />
        </div>
      )}

      {title && (
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}

      {description && (
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          {description}
        </p>
      )}

      {children}

      {actionLabel && onAction && (
        <Button
          variant={actionVariant}
          size="sm"
          onClick={onAction}
          icon={ActionIcon}
          style={{ marginTop: '8px' }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
