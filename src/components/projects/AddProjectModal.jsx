import React, { useState, useEffect } from 'react';
import { X, Folder, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { gitService } from '../../services/git/gitService';

export function AddProjectModal({ isOpen, onClose }) {
  const [path, setPath] = useState('');
  const [customName, setCustomName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const { addRepository } = useProjectStore();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setValidationResult(null);
    }
  }, [isOpen]);

  // Auto-validate with debounce when user finishes typing a path
  useEffect(() => {
    if (!path.trim() || path.trim().length < 3) {
      setValidationResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      setError(null);
      try {
        const res = await gitService.validateRepository(path.trim());
        if (res.valid) {
          setValidationResult(res);
          if (!customName) {
            const name = path.trim().split(/[\\/]/).filter(Boolean).pop() || 'Repo';
            setCustomName(name);
          }
        } else {
          setValidationResult(null);
          setError(res.error || 'Path is not a valid Git repository');
        }
      } catch (err) {
        setValidationResult(null);
        setError(err.message);
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [path, customName]);

  if (!isOpen) return null;

  const handleValidateNow = async () => {
    if (!path.trim()) return null;
    setIsValidating(true);
    setError(null);

    try {
      const res = await gitService.validateRepository(path.trim());
      if (res.valid) {
        setValidationResult(res);
        if (!customName) {
          const name = path.trim().split(/[\\/]/).filter(Boolean).pop() || 'Repo';
          setCustomName(name);
        }
        return res;
      } else {
        setError(res.error || 'Path is not a valid Git repository');
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!path.trim()) return;

    // If not validated yet, validate first
    let validRes = validationResult;
    if (!validRes) {
      validRes = await handleValidateNow();
      if (!validRes) return;
    }

    try {
      await addRepository(path.trim(), customName.trim());
      onClose();
      setPath('');
      setCustomName('');
      setValidationResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickSelect = (suggestedPath) => {
    setPath(suggestedPath);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px' }}>Add Local Repository</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Register a Git repository on your machine</p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Suggestions */}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Quick suggestions:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['d:\\GitPilot', 'd:/GitPilot'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleQuickSelect(s)}
                  className="btn-ghost font-mono"
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    color: 'var(--primary-bright)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Repository Path
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. D:\GitPilot or D:\Projects\MyAwesomeApp"
                className="input-text font-mono"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleValidateNow}
                disabled={isValidating || !path.trim()}
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
              >
                {isValidating ? <Loader2 size={13} className="animate-spin" /> : 'Validate'}
              </button>
            </div>
          </div>

          {validationResult && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12.5px', fontWeight: 500, marginBottom: '8px' }}>
                <CheckCircle size={14} />
                <span>Valid Git Repository Detected</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Branch: </span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{validationResult.branch}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Remote: </span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{validationResult.remoteName}</span>
                </div>
                <div style={{ gridColumn: 'span 2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>URL: </span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{validationResult.remoteUrl}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '12px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>
              Display Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. GitPilot"
              className="input-text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-surface)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!path.trim() || isValidating}
            className="btn btn-primary"
          >
            {isValidating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader2 size={13} className="animate-spin" />
                Validating...
              </span>
            ) : (
              'Register Repository'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
