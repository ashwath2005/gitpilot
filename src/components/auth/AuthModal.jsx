import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Login } from '../../pages/Auth/Login';
import { Register } from '../../pages/Auth/Register';
import { ForgotPassword } from '../../pages/Auth/ForgotPassword';

export function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '28px',
          position: 'relative',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <button
          onClick={onClose}
          className="btn-close"
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
          }}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {view === 'login' && (
          <Login
            onSuccess={onClose}
            onSwitchToRegister={() => setView('register')}
            onSwitchToForgot={() => setView('forgot')}
          />
        )}

        {view === 'register' && (
          <Register
            onSuccess={onClose}
            onSwitchToLogin={() => setView('login')}
          />
        )}

        {view === 'forgot' && (
          <ForgotPassword
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  );
}
