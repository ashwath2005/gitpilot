import React, { useState, useEffect } from 'react';
import { X, Sparkles, GitCommit, ArrowUpRight, AlertTriangle, Loader2 } from 'lucide-react';
import { gitService } from '../../services/git/gitService';
import { aiService } from '../../services/ai/aiService';
import { secretScanner } from '../../services/security/secretScanner';
import { databaseService } from '../../services/database/databaseService';
import { useSettingsStore } from '../../store/settingsStore';
import { useProjectStore } from '../../store/projectStore';

export function CommitPreviewModal({ isOpen, onClose, repository, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [diffStat, setDiffStat] = useState('');
  const [diffText, setDiffText] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null);
  const [error, setError] = useState(null);

  const { settings } = useSettingsStore();
  const { updateRepository } = useProjectStore();

  useEffect(() => {
    if (!isOpen || !repository) return;

    const prepareCommitPreview = async () => {
      setLoading(true);
      setError(null);
      setSecurityAlert(null);

      try {
        const statusRes = await gitService.getStatus(repository.path);
        setFiles(statusRes.files || []);

        if (!statusRes.hasChanges) {
          setError('No changes detected in working tree.');
          setLoading(false);
          return;
        }

        // Check file security
        const secCheck = secretScanner.checkFiles(statusRes.files);
        if (secCheck.hasSecrets) {
          setSecurityAlert(`Security alert: Detected sensitive files: ${secCheck.findings.map((f) => f.file).join(', ')}`);
        }

        const diffRes = await gitService.getDiff(repository.path);
        setDiffStat(diffRes.stat || '');
        setDiffText(diffRes.combinedDiff || '');

        // Generate initial commit message
        const initialMsg = await aiService.generateCommitMessage({
          apiKey: settings.enableAI ? settings.openaiApiKey : '',
          model: settings.aiModel,
          diffText: diffRes.combinedDiff,
          files: statusRes.files,
          diffStat: diffRes.stat,
        });

        setCommitMessage(initialMsg);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    prepareCommitPreview();
  }, [isOpen, repository]);

  const handleRegenerate = async () => {
    setIsGeneratingAI(true);
    try {
      const msg = await aiService.generateCommitMessage({
        apiKey: settings.enableAI ? settings.openaiApiKey : '',
        model: settings.aiModel,
        diffText,
        files,
        diffStat,
      });
      setCommitMessage(msg);
    } catch (e) {
      console.warn('Regeneration error:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCommitAndPush = async () => {
    if (!commitMessage.trim() || securityAlert) return;
    setIsCommitting(true);
    setError(null);

    try {
      // Step 1: Stage
      const stageRes = await gitService.stageAll(repository.path);
      if (!stageRes.success) throw new Error(stageRes.error || 'Failed to stage files');

      // Step 2: Commit
      const commitRes = await gitService.commit(repository.path, commitMessage.trim());
      if (!commitRes.success) throw new Error(commitRes.error || 'Failed to create commit');

      // Step 3: Push
      const pushRes = await gitService.push(repository.path, repository.remoteName || 'origin', repository.branch || 'main');
      if (!pushRes.success) throw new Error(pushRes.error || 'Failed to push commit to remote');

      await databaseService.updateRepository(repository.id, {
        status: 'SUCCESS',
        lastPushAt: new Date().toISOString(),
        lastScanAt: new Date().toISOString(),
        filesChanged: 0,
      });

      await databaseService.recordPushHistory({
        repositoryId: repository.id,
        repositoryName: repository.name,
        commitMessage: commitMessage.trim(),
        status: 'SUCCESS',
        filesChanged: files.length,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  if (!isOpen || !repository) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px' }}>Commit & Push</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {repository.name} · branch: <span className="font-mono" style={{ color: 'var(--primary-bright)' }}>{repository.branch}</span>
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '8px', color: 'var(--text-muted)' }}>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing repository diff...</span>
            </div>
          ) : (
            <>
              {/* Diff Summary Stat */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{files.length} files changed</span>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {files.slice(0, 3).map((f) => f.path).join(', ')}{files.length > 3 ? ` + ${files.length - 3} more` : ''}
                  </div>
                </div>
                {diffStat && (
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {diffStat.split('\n').pop()}
                  </div>
                )}
              </div>

              {/* Security Warning */}
              {securityAlert && (
                <div style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--danger)', fontSize: '12px' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Security Guard Alert</strong>
                    {securityAlert}
                  </div>
                </div>
              )}

              {/* Commit Message Box */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500 }}>Commit Message</label>
                  <button
                    onClick={handleRegenerate}
                    disabled={isGeneratingAI}
                    className="btn-ghost"
                    style={{ fontSize: '11.5px', color: 'var(--primary-bright)', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <Sparkles size={12} className={isGeneratingAI ? 'animate-spin' : ''} />
                    <span>{isGeneratingAI ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="input-text font-mono"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="e.g. feat: implement graph traversal controls"
                />
              </div>

              {error && (
                <div style={{ background: 'var(--danger-subtle)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--danger)', fontSize: '12px' }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-surface)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleCommitAndPush}
            disabled={loading || isCommitting || !commitMessage.trim() || Boolean(securityAlert)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isCommitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Committing & Pushing...</span>
              </>
            ) : (
              <>
                <GitCommit size={14} />
                <span>Commit & Push</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
