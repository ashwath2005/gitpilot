import React from 'react';

/**
 * Standard GitPilot Status Badge
 * Variants: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'changes' | 'clean' | 'info'
 */
export function Badge({
  children,
  variant = 'default',
  icon: Icon,
  className = '',
  style = {},
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
      case 'changes':
        return 'badge-changes';
      case 'success':
      case 'clean':
        return 'badge-success';
      case 'warning':
        return 'badge-pushing';
      case 'danger':
      case 'failed':
        return 'badge-failed';
      case 'info':
      case 'analyzing':
        return 'badge-analyzing';
      case 'default':
      case 'ready':
      default:
        return 'badge-ready';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`.trim()} style={style}>
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}
