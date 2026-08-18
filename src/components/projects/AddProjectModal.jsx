import React, { useState, useEffect } from 'react';
import { X, Folder, CheckCircle, AlertCircle, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { gitService } from '../../services/git/gitService';
import { desktopBridge } from '../../services/desktopBridge';

export function AddProjectModal({ isOpen, onClose }) {
  const [path, setPath] = useState('');
  const [customName, setCustomName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [canInitGit, setCanInitGit] = useState(false);
  const { addRepository } = useProjectStore();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setValidationResult(null);
      setCanInitGit(false);
    }
  }, [isOpen]);

  // Clean path format (trim quotes and spaces)
  const cleanPath = (raw) => (raw || '').replace(/^["']|["']$/g, '').trim();

  // Auto-validate with debounce
  useEffect(() => {
    const cleaned = cleanPath(path);
    if (!cleaned || cleaned.length < 3) {
      setValidationResult(null);
      setError(null);
      setCanInitGit(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      setError(null);
      setCanInitGit(false);

      try {
        const res = await gitService.validateRepository(cleaned);
        if (res.valid) {
          setValidationResult(res);
          if (!customName) {
            const name = cleaned.split(/[\\/]/).filter(Boolean).pop() || 'Repo';
            setCustomName(name);
          }
        } else {
          setValidationResult(null);
          setError(res.error || 'Not a valid Git repository');
          setCanInitGit(true);
        }
      } catch (err) {
        setValidationResult(null);
        setError(err.message);
        setCanInitGit(true);
      } finally {
        setIsValidating(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [path, customName]);

  if (!isOpen) return null;

  const handleValidateNow = async () => {
    const cleaned = cleanPath(path);
    if (!cleaned) return null;
    setIsValidating(true);
    setError(null);
    setCanInitGit(false);

    try {
      const res = await gitService.validateRepository(cleaned);
      if (res.valid) {
        setValidationResult(res);
        if (!customName) {
          const name = cleaned.split(/[\\/]/).filter(Boolean).pop() || 'Repo';
          setCustomName(name);
        }
        return res;
      } else {
        setError(res.error || 'Not a valid Git repository');
        setCanInitGit(true);
        return null;
      }
    } catch (err) {
      setError(err.message);
      setCanInitGit(true);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const handleInitGit = async () => {
    const cleaned = cleanPath(path);
    if (!cleaned) return;
    setIsInitializing(true);
    try {
      const res = await desktopBridge.initGit(cleaned);
      if (res.success) {
        setCanInitGit(false);
        setError(null);
        await handleValidateNow();
      } else {
        setError(res.error || 'Failed to initialize Git in directory');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSave = async () => {
    const cleaned = cleanPath(path);
    if (!cleaned) return;

    let validRes = validationResult;
    if (!validRes) {
      validRes = await handleValidateNow();
      if (!validRes) return;
    }

    try {
      await addRepository(cleaned, customName.trim());
      onClose();
      setPath('');
      setCustomName('');
      setValidationResult(null);
    } catch (err) {
      setError(err.message);
    }
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
                  onClick={() => setPath(s)}
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
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{validationResult.remoteName || 'local'}</span>
                </div>
                <div style={{ gridColumn: 'span 2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>URL: </span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{validationResult.remoteUrl}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '12px' }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              {canInitGit && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Want to initialize Git in this folder?
                  </span>
                  <button
                    type="button"
                    onClick={handleInitGit}
                    disabled={isInitializing}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {isInitializing ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                    <span>Initialize (git init)</span>
                  </button>
                </div>
              )}
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
