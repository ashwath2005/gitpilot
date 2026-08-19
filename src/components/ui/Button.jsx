import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Standard GitPilot Button
 * Variants: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text' | 'icon'
 * Sizes: 'sm' | 'md' | 'lg'
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  style = {},
  type = 'button',
  onClick,
  ...props
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'ghost':
        return 'btn-ghost';
      case 'danger':
        return 'btn-danger';
      case 'text':
        return 'btn-text';
      case 'icon':
        return 'btn-icon';
      case 'secondary':
      default:
        return 'btn-secondary';
    }
  };

  const getSizeClass = () => {
    if (variant === 'icon') return '';
    switch (size) {
      case 'sm':
        return 'btn-sm';
      case 'lg':
        return 'btn-lg';
      case 'md':
      default:
        return '';
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn ${getVariantClass()} ${getSizeClass()} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 12 : 14} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 12 : 14} />}
    </button>
  );
}
