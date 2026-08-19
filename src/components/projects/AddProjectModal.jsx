import React, { useState, useEffect } from 'react';
import { Folder, CheckCircle, AlertCircle, Loader2, PlusCircle, Check } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { gitService } from '../../services/git/gitService';
import { desktopBridge } from '../../services/desktopBridge';
import { Modal, Button, Input, Badge } from '../ui';

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
      const res = await gitService.initRepository(cleaned);
      if (res.success) {
        await handleValidateNow();
      } else {
        setError(res.error || 'Failed to initialize git repository');
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

    let res = validationResult;
    if (!res) {
      res = await handleValidateNow();
    }

    if (!res || !res.valid) return;

    try {
      const repoName = customName.trim() || cleaned.split(/[\\/]/).filter(Boolean).pop() || 'Repo';
      await addRepository({
        name: repoName,
        path: cleaned,
        branch: res.branch || 'main',
        remoteUrl: res.remoteUrl || 'local',
        remoteName: res.remoteName || 'local',
        enabled: true,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Local Repository"
      subtitle="Register an existing Git directory to monitor changes and enable automated synchronization"
      icon={Folder}
      maxWidth="560px"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!path.trim() || isValidating}
            loading={isValidating}
            onClick={handleSave}
          >
            Register Repository
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Suggestions */}
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Repository Path"
                type="text"
                placeholder="e.g. D:\GitPilot or D:\Projects\MyAwesomeApp"
                className="font-mono"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <Button
              variant="secondary"
              size="md"
              loading={isValidating}
              disabled={isValidating || !path.trim()}
              onClick={handleValidateNow}
              style={{ marginBottom: '1px' }}
            >
              Validate
            </Button>
          </div>
        </div>

        {validationResult && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>
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
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '12px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
            {canInitGit && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(239, 68, 68, 0.15)', paddingTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Want to initialize Git in this folder?
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isInitializing}
                  disabled={isInitializing}
                  onClick={handleInitGit}
                  icon={PlusCircle}
                >
                  Initialize (git init)
                </Button>
              </div>
            )}
          </div>
        )}

        <Input
          label="Display Name (Optional)"
          type="text"
          placeholder="e.g. GitPilot"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>
    </Modal>
  );
}
