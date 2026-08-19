import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

/**
 * Standard GitPilot Modal Dialog
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  maxWidth = '560px',
  children,
  footer,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-card ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {/* Modal Header */}
        {(title || Icon) && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {Icon && <Icon size={18} style={{ color: 'var(--primary-bright)', flexShrink: 0 }} />}
              <div>
                {title && <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>}
                {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-close"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
