import React, { useState, useEffect } from 'react';
import { Sparkles, GitCommit, AlertTriangle, Loader2 } from 'lucide-react';
import { gitService } from '../../services/git/gitService';
import { aiService } from '../../services/ai/aiService';
import { secretScanner } from '../../services/security/secretScanner';
import { databaseService } from '../../services/database/databaseService';
import { useSettingsStore } from '../../store/settingsStore';
import { useProjectStore } from '../../store/projectStore';
import { Modal, Button, TextButton, Input, Badge } from '../ui';

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
          setSecurityAlert('Security alert: Detected sensitive files: ' + secCheck.findings.map((f) => f.file).join(', '));
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

      // Step 3: Push (if remote is configured)
      const hasRemote = repository.remoteUrl && repository.remoteUrl !== 'local' && repository.remoteUrl !== 'No remote configured';
      if (hasRemote) {
        const pushRes = await gitService.push(repository.path, repository.remoteName || 'origin', repository.branch || 'main');
        if (!pushRes.success) throw new Error(pushRes.error || 'Failed to push commit to remote');
      }

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commit & Push Changes"
      subtitle={`${repository.name} · branch: ${repository.branch || 'main'}`}
      icon={GitCommit}
      maxWidth="600px"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isCommitting}
            disabled={loading || isCommitting || !commitMessage.trim() || Boolean(securityAlert)}
            onClick={handleCommitAndPush}
            icon={GitCommit}
          >
            {isCommitting ? 'Committing & Pushing...' : 'Commit & Push'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '8px', color: 'var(--text-muted)' }}>
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary-bright)' }} />
            <span>Analyzing repository diff...</span>
          </div>
        ) : (
          <>
            {/* Diff Summary Stat */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {files.length} files changed
                </span>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {files.slice(0, 3).map((f) => f.path).join(', ')}
                  {files.length > 3 ?  +  more : ''}
                </div>
              </div>

              {diffStat && (
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {diffStat.split('\n').pop()}
                </span>
              )}
            </div>

            {/* Security Warning */}
            {securityAlert && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: 'var(--danger)',
                  fontSize: '12px',
                }}
              >
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
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Commit Message
                </label>
                <TextButton
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGeneratingAI}
                  icon={Sparkles}
                  style={{ fontSize: '11.5px' }}
                >
                  {isGeneratingAI ? 'Regenerating...' : 'Regenerate AI'}
                </TextButton>
              </div>

              <Input
                type="text"
                className="font-mono"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. feat: implement graph traversal controls"
                autoFocus
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--danger)',
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
