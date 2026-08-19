import React from 'react';

/**
 * Standard GitPilot Surface Card
 */
export function Card({
  children,
  elevation = 'surface', // 'surface' | 'elevated' | 'higher'
  className = '',
  style = {},
  onClick,
  ...props
}) {
  const getElevationClass = () => {
    switch (elevation) {
      case 'elevated':
        return 'card-elevated';
      case 'higher':
        return 'card-higher';
      case 'surface':
      default:
        return 'card';
    }
  };

  return (
    <div
      className={`${getElevationClass()} ${className}`.trim()}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, children, style = {}, className = '' }) {
  return (
    <div className={`card-header ${className}`.trim()} style={{ ...style }}>
      {children || (
        <>
          <div>
            {title && <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </>
      )}
    </div>
  );
}

export function CardBody({ children, style = {}, className = '' }) {
  return (
    <div className={`card-body ${className}`.trim()} style={{ ...style }}>
      {children}
    </div>
  );
}

export function CardFooter({ children, style = {}, className = '' }) {
  return (
    <div className={`card-footer ${className}`.trim()} style={{ ...style }}>
      {children}
    </div>
  );
}
