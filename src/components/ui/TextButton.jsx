import React from 'react';

/**
 * TextButton - Clean developer-style text action.
 * Eliminates default blue browser links and underlines.
 */
export function TextButton({
  children,
  onClick,
  icon: Icon,
  iconPosition = 'right',
  disabled = false,
  color = 'var(--primary-bright)',
  hoverColor = 'var(--primary)',
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`text-action ${className}`.trim()}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        color: color,
        fontSize: '12px',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        textDecoration: 'none',
        outline: 'none',
        borderRadius: 'var(--radius-xs)',
        transition: 'color var(--transition-fast), background-color var(--transition-fast)',
        ...style,
      }}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={13} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon size={13} />}
    </button>
  );
}
