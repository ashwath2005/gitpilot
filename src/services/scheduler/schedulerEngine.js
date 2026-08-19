import { gitService } from '../git/gitService';
import { secretScanner } from '../security/secretScanner';
import { aiService } from '../ai/aiService';
import { databaseService } from '../database/databaseService';
import { desktopBridge } from '../desktopBridge';

/**
 * Scheduler & Queue Processing Engine
 * State transitions:
 * WAITING -> SCANNING -> SECURITY_CHECK -> GENERATING_COMMIT -> DRY_RUN -> STAGING -> COMMITTING -> PUSHING -> COMPLETED
 * Failure: FAILED | BLOCKED | CANCELLED
 */
class SchedulerEngine {
  constructor() {
    this.timer = null;
    this.isProcessingQueue = false;
    this.queue = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({ queue: [...this.queue], isProcessing: this.isProcessingQueue });
    }
  }

  /**
   * Start background timer check for active schedules (every 30s)
   */
  startScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.checkSchedules(), 30000);
    this.checkSchedules();
  }

  stopScheduler() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check if current time matches any active schedule
   */
  async checkSchedules() {
    const settings = await databaseService.getSettings();
    const schedules = await databaseService.getSchedules();
    const repos = await databaseService.getRepositories();

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1-5 = Weekdays, 6 = Saturday

    for (const sched of schedules) {
      if (!sched.enabled) continue;

      let shouldRun = false;
      if (sched.time === currentTimeStr) {
        if (sched.frequency === 'daily') shouldRun = true;
        else if (sched.frequency === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) shouldRun = true;
        else if (sched.frequency === 'weekends' && (dayOfWeek === 0 || dayOfWeek === 6)) shouldRun = true;
      }

      if (shouldRun) {
        await databaseService.addLog('INFO', `Schedule triggered: ${sched.name} at ${currentTimeStr}`);
        const targets =
          sched.repositoryIds === 'all'
            ? repos.filter((r) => r.enabled)
            : repos.filter((r) => r.enabled && sched.repositoryIds.includes(r.id));

        if (targets.length > 0) {
          this.enqueueRepositories(targets, {
            isDryRun: settings.dryRunMode,
            isAutonomous: settings.autonomousMode,
          });
        }
      }
    }
  }

  /**
   * Enqueue repositories for sequential processing
   */
  enqueueRepositories(repositories, options = {}) {
    for (const repo of repositories) {
      const existing = this.queue.find(
        (q) => q.repositoryId === repo.id && (q.status === 'WAITING' || q.status === 'SCANNING' || q.status === 'PROCESSING')
      );
      if (!existing) {
        this.queue.push({
          id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          repositoryId: repo.id,
          repositoryName: repo.name,
          path: repo.path,
          branch: repo.branch,
          remoteUrl: repo.remoteUrl,
          remoteName: repo.remoteName,
          status: 'WAITING', // WAITING, SCANNING, SECURITY_CHECK, GENERATING_COMMIT, DRY_RUN, STAGING, COMMITTING, PUSHING, COMPLETED, FAILED, BLOCKED, CANCELLED
          progress: 0,
          message: 'Waiting in queue...',
          logs: [],
          error: null,
          isDryRun: Boolean(options.isDryRun),
          isAutonomous: Boolean(options.isAutonomous),
          startedAt: new Date().toISOString(),
          completedAt: null,
        });
      }
    }

    this.notify();
    if (!this.isProcessingQueue) {
      this.processNextInQueue();
    }
  }

  /**
   * Cancel specific queue item
   */
  cancelQueueItem(id) {
    const item = this.queue.find((q) => q.id === id);
    if (item && item.status === 'WAITING') {
      item.status = 'CANCELLED';
      item.message = 'Cancelled by user';
      item.completedAt = new Date().toISOString();
      this.notify();
    }
  }

  /**
   * Process queue sequentially
   */
  async processNextInQueue() {
    const nextItem = this.queue.find((q) => q.status === 'WAITING');
    if (!nextItem) {
      this.isProcessingQueue = false;
      this.notify();
      return;
    }

    this.isProcessingQueue = true;
    this.notify();

    const log = (msg) => {
      const time = new Date().toLocaleTimeString();
      nextItem.logs.push(`[${time}] ${msg}`);
      nextItem.message = msg;
      databaseService.addLog('INFO', `[${nextItem.repositoryName}] ${msg}`);
    };

    try {
      // 1. SCANNING
      nextItem.status = 'SCANNING';
      nextItem.progress = 15;
      log(`Scanning repository "${nextItem.repositoryName}"...`);
      this.notify();
      await databaseService.updateRepository(nextItem.repositoryId, { status: 'ANALYZING' });

      const validation = await gitService.validateRepository(nextItem.path);
      if (!validation.valid) {
        throw new Error(validation.error || 'Repository validation failed');
      }

      const statusRes = await gitService.getStatus(nextItem.path);
      if (!statusRes.success) {
        throw new Error(statusRes.error || 'Failed to read git status');
      }

      if (!statusRes.hasChanges) {
        log('No changes detected. Working tree clean.');
        nextItem.status = 'COMPLETED';
        nextItem.progress = 100;
        nextItem.completedAt = new Date().toISOString();
        await databaseService.updateRepository(nextItem.repositoryId, {
          status: 'NO_CHANGES',
          lastScanAt: new Date().toISOString(),
          filesChanged: 0,
        });
        await databaseService.recordPushHistory({
          repositoryId: nextItem.repositoryId,
          repositoryName: nextItem.repositoryName,
          status: 'NO_CHANGES',
          filesChanged: 0,
        });
        this.notify();
        setTimeout(() => this.processNextInQueue(), 600);
        return;
      }

      log(`Detected ${statusRes.summary.total} changed file(s).`);
      await databaseService.updateRepository(nextItem.repositoryId, {
        filesChanged: statusRes.summary.total,
        status: 'CHANGES',
      });

      // 2. SECURITY_CHECK
      nextItem.status = 'SECURITY_CHECK';
      nextItem.progress = 35;
      log('Running security scan for credentials and sensitive files...');
      this.notify();

      const fileSecurity = secretScanner.checkFiles(statusRes.files);
      if (fileSecurity.hasSecrets) {
        const reason = fileSecurity.findings.map((f) => f.reason).join('; ');
        nextItem.status = 'BLOCKED';
        nextItem.error = `Security Guard: Blocked sensitive files: ${reason}`;
        await databaseService.recordPushHistory({
          repositoryId: nextItem.repositoryId,
          repositoryName: nextItem.repositoryName,
          status: 'BLOCKED',
          error: nextItem.error,
        });
        desktopBridge.sendNotification('GitPilot Push Blocked', `Sensitive file detected in ${nextItem.repositoryName}`);
        throw new Error(nextItem.error);
      }

      const diffRes = await gitService.getDiff(nextItem.path);
      const diffSecurity = secretScanner.scanDiffContent(diffRes.combinedDiff);
      if (diffSecurity.hasSecrets) {
        const rules = diffSecurity.matches.map((m) => m.rule).join(', ');
        nextItem.status = 'BLOCKED';
        nextItem.error = `Security Guard: Potential credential patterns detected in diff: ${rules}`;
        await databaseService.recordPushHistory({
          repositoryId: nextItem.repositoryId,
          repositoryName: nextItem.repositoryName,
          status: 'BLOCKED',
          error: nextItem.error,
        });
        desktopBridge.sendNotification('GitPilot Push Blocked', `Secret signature detected in ${nextItem.repositoryName}`);
        throw new Error(nextItem.error);
      }

      // 3. GENERATING_COMMIT
      nextItem.status = 'GENERATING_COMMIT';
      nextItem.progress = 55;
      log('Generating conventional commit message...');
      this.notify();

      const settings = await databaseService.getSettings();
      const commitMessage = await aiService.generateCommitMessage({
        apiKey: settings.enableAI ? settings.openaiApiKey : '',
        model: settings.aiModel,
        diffText: diffRes.combinedDiff,
        files: statusRes.files,
        diffStat: diffRes.stat,
      });

      log(`Commit message: "${commitMessage}"`);

      // 4. DRY_RUN
      if (nextItem.isDryRun) {
        nextItem.status = 'DRY_RUN';
        nextItem.progress = 100;
        log('Dry Run Mode: Staging, commit, and push skipped.');
        nextItem.completedAt = new Date().toISOString();
        await databaseService.updateRepository(nextItem.repositoryId, {
          status: 'READY',
          lastScanAt: new Date().toISOString(),
        });
        this.notify();
        setTimeout(() => this.processNextInQueue(), 600);
        return;
      }

      // 5. STAGING
      nextItem.status = 'STAGING';
      nextItem.progress = 70;
      log('Staging changes (git add -A)...');
      this.notify();
      await databaseService.updateRepository(nextItem.repositoryId, { status: 'COMMITTING' });

      const stageRes = await gitService.stageAll(nextItem.path);
      if (!stageRes.success) {
        throw new Error(stageRes.error || 'Failed to stage files');
      }

      // 6. COMMITTING
      nextItem.status = 'COMMITTING';
      nextItem.progress = 85;
      log('Creating commit...');
      this.notify();

      const commitRes = await gitService.commit(nextItem.path, commitMessage);
      if (!commitRes.success) {
        throw new Error(commitRes.error || 'Commit creation failed');
      }

      // 7. PUSHING
      const hasRemote =
        nextItem.remoteUrl && nextItem.remoteUrl !== 'local' && nextItem.remoteUrl !== 'No remote configured';
      if (hasRemote) {
        nextItem.status = 'PUSHING';
        nextItem.progress = 95;
        log(`Pushing to ${nextItem.remoteName || 'origin'} (${nextItem.branch || 'main'})...`);
        this.notify();
        await databaseService.updateRepository(nextItem.repositoryId, { status: 'PUSHING' });

        const pushRes = await gitService.push(
          nextItem.path,
          nextItem.remoteName || 'origin',
          nextItem.branch || 'main'
        );

        if (!pushRes.success) {
          throw new Error(pushRes.error || 'Git push failed');
        }
        log('Push completed successfully.');
      } else {
        log('Local commit completed (no remote configured).');
      }

      // 8. COMPLETED
      nextItem.status = 'COMPLETED';
      nextItem.progress = 100;
      nextItem.completedAt = new Date().toISOString();
      await databaseService.updateRepository(nextItem.repositoryId, {
        status: 'SUCCESS',
        lastPushAt: new Date().toISOString(),
        lastScanAt: new Date().toISOString(),
        filesChanged: 0,
      });

      await databaseService.recordPushHistory({
        repositoryId: nextItem.repositoryId,
        repositoryName: nextItem.repositoryName,
        commitMessage,
        status: 'SUCCESS',
        filesChanged: statusRes.summary.total,
      });

      if (settings.notificationPushSuccess) {
        desktopBridge.sendNotification(
          'GitPilot Push Completed',
          `${nextItem.repositoryName}: ${commitMessage}`
        );
      }
    } catch (err) {
      log(`Error: ${err.message}`);
      nextItem.error = err.message;
      if (nextItem.status !== 'BLOCKED') {
        nextItem.status = 'FAILED';
      }
      nextItem.completedAt = new Date().toISOString();

      await databaseService.updateRepository(nextItem.repositoryId, {
        status: 'FAILED',
        statusMessage: err.message,
      });

      await databaseService.recordPushHistory({
        repositoryId: nextItem.repositoryId,
        repositoryName: nextItem.repositoryName,
        status: 'FAILED',
        error: err.message,
      });

      const settings = await databaseService.getSettings();
      if (settings.notificationPushFailure && nextItem.status !== 'BLOCKED') {
        desktopBridge.sendNotification(
          'GitPilot Push Failed',
          `${nextItem.repositoryName}: ${err.message}`
        );
      }
    }

    this.notify();
    setTimeout(() => this.processNextInQueue(), 1000);
  }
}

export const schedulerEngine = new SchedulerEngine();
