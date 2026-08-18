import { gitService } from '../git/gitService';
import { secretScanner } from '../security/secretScanner';
import { aiService } from '../ai/aiService';
import { databaseService } from '../database/databaseService';
import { desktopBridge } from '../desktopBridge';

/**
 * Scheduler & Queue Processing Engine
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
   * Start background timer check for active schedules
   */
  startScheduler() {
    if (this.timer) clearInterval(this.timer);
    // Check every 30 seconds
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
        const targets = sched.repositoryIds === 'all'
          ? repos.filter((r) => r.enabled)
          : repos.filter((r) => r.enabled && sched.repositoryIds.includes(r.id));

        if (targets.length > 0) {
          this.enqueueRepositories(targets, { isDryRun: settings.dryRunMode, isAutonomous: settings.autonomousMode });
        }
      }
    }
  }

  /**
   * Enqueue repositories for processing
   */
  enqueueRepositories(repositories, options = {}) {
    for (const repo of repositories) {
      const existing = this.queue.find((q) => q.repositoryId === repo.id && (q.status === 'QUEUED' || q.status === 'PROCESSING'));
      if (!existing) {
        this.queue.push({
          id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          repositoryId: repo.id,
          repositoryName: repo.name,
          path: repo.path,
          branch: repo.branch,
          remoteUrl: repo.remoteUrl,
          remoteName: repo.remoteName,
          status: 'QUEUED', // QUEUED, PROCESSING, SUCCESS, FAILED, NO_CHANGES, SKIPPED, CANCELLED
          logs: [],
          error: null,
          attempts: 0,
          isDryRun: Boolean(options.isDryRun),
          isAutonomous: Boolean(options.isAutonomous),
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.notify();
    if (!this.isProcessingQueue) {
      this.processNextInQueue();
    }
  }

  /**
   * Process queue sequentially with controlled backoff
   */
  async processNextInQueue() {
    const nextItem = this.queue.find((q) => q.status === 'QUEUED');
    if (!nextItem) {
      this.isProcessingQueue = false;
      this.notify();
      return;
    }

    this.isProcessingQueue = true;
    nextItem.status = 'PROCESSING';
    this.notify();

    const log = (msg) => {
      const time = new Date().toLocaleTimeString();
      nextItem.logs.push(`[${time}] ${msg}`);
      databaseService.addLog('INFO', `[${nextItem.repositoryName}] ${msg}`);
    };

    try {
      log(`Starting scan on repository "${nextItem.repositoryName}"...`);
      await databaseService.updateRepository(nextItem.repositoryId, { status: 'ANALYZING' });

      // Step 1: Validate repository
      const validation = await gitService.validateRepository(nextItem.path);
      if (!validation.valid) {
        throw new Error(validation.error || 'Repository validation failed');
      }

      // Step 2: Check working tree status
      const statusRes = await gitService.getStatus(nextItem.path);
      if (!statusRes.success) {
        throw new Error(statusRes.error || 'Failed to read git status');
      }

      if (!statusRes.hasChanges) {
        log('No changes detected. Nothing to commit.');
        nextItem.status = 'NO_CHANGES';
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
        this.processNextInQueue();
        return;
      }

      log(`Detected ${statusRes.summary.total} changed file(s).`);
      await databaseService.updateRepository(nextItem.repositoryId, {
        filesChanged: statusRes.summary.total,
        status: 'CHANGES',
      });

      // Step 3: Security & Secret Scan
      log('Running security scan for sensitive files and secret patterns...');
      const fileSecurity = secretScanner.checkFiles(statusRes.files);
      if (fileSecurity.hasSecrets) {
        const reason = fileSecurity.findings.map((f) => f.reason).join('; ');
        throw new Error(`Security Warning: Potential secret or sensitive file detected: ${reason}`);
      }

      const diffRes = await gitService.getDiff(nextItem.path);
      const diffSecurity = secretScanner.scanDiffContent(diffRes.combinedDiff);
      if (diffSecurity.hasSecrets) {
        const rules = diffSecurity.matches.map((m) => m.rule).join(', ');
        throw new Error(`Security Warning: Potential credential patterns detected in diff: ${rules}`);
      }

      // Step 4: Generate Commit Message
      log('Generating commit message...');
      const settings = await databaseService.getSettings();
      const commitMessage = await aiService.generateCommitMessage({
        apiKey: settings.enableAI ? settings.openaiApiKey : '',
        model: settings.aiModel,
        diffText: diffRes.combinedDiff,
        files: statusRes.files,
        diffStat: diffRes.stat,
      });

      log(`Generated commit: "${commitMessage}"`);

      // Dry Run Check
      if (nextItem.isDryRun) {
        log('Dry Run Mode: Skipped staging, committing, and pushing.');
        nextItem.status = 'SUCCESS';
        await databaseService.updateRepository(nextItem.repositoryId, {
          status: 'READY',
          lastScanAt: new Date().toISOString(),
        });
        this.processNextInQueue();
        return;
      }

      // Step 5: Stage All Changes
      await databaseService.updateRepository(nextItem.repositoryId, { status: 'COMMITTING' });
      log('Staging changes with git add -A...');
      const stageRes = await gitService.stageAll(nextItem.path);
      if (!stageRes.success) {
        throw new Error(stageRes.error || 'Failed to stage files');
      }

      // Step 6: Commit
      log('Creating commit...');
      const commitRes = await gitService.commit(nextItem.path, commitMessage);
      if (!commitRes.success) {
        throw new Error(commitRes.error || 'Commit creation failed');
      }

      // Step 7: Push
      await databaseService.updateRepository(nextItem.repositoryId, { status: 'PUSHING' });
      log(`Pushing to ${nextItem.remoteName || 'origin'} on branch ${nextItem.branch || 'main'}...`);
      const pushRes = await gitService.push(nextItem.path, nextItem.remoteName || 'origin', nextItem.branch || 'main');

      if (!pushRes.success) {
        throw new Error(pushRes.error || 'Git push failed');
      }

      log('Push successful!');
      nextItem.status = 'SUCCESS';
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
          'GitPilot Push Successful',
          `${nextItem.repositoryName}: ${commitMessage}`
        );
      }
    } catch (err) {
      log(`Error: ${err.message}`);
      nextItem.error = err.message;
      nextItem.status = 'FAILED';

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
      if (settings.notificationPushFailure) {
        desktopBridge.sendNotification(
          'GitPilot Push Failed',
          `${nextItem.repositoryName}: ${err.message}`
        );
      }
    }

    this.notify();
    // Proceed to next repository in queue
    setTimeout(() => this.processNextInQueue(), 1000);
  }
}

export const schedulerEngine = new SchedulerEngine();
