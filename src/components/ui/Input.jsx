import React, { forwardRef } from 'react';

/**
 * Standard GitPilot Form Input
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    rightIcon: RightIcon,
    onRightIconClick,
    className = '',
    containerStyle = {},
    required = false,
    ...props
  },
  ref
) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...containerStyle }}>
      {label && (
        <label
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon size={14} />
          </div>
        )}

        <input
          ref={ref}
          className={`input-text ${error ? 'input-error' : ''} ${className}`.trim()}
          style={{
            width: '100%',
            paddingLeft: Icon ? '34px' : '11px',
            paddingRight: RightIcon ? '34px' : '11px',
            borderColor: error ? 'var(--danger)' : undefined,
          }}
          {...props}
        />

        {RightIcon && (
          <div
            onClick={onRightIconClick}
            style={{
              position: 'absolute',
              right: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              cursor: onRightIconClick ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RightIcon size={14} />
          </div>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{helperText}</span>
      ) : null}
    </div>
  );
});
