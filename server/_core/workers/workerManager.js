const PayoutWorker = require('./workers/payoutWorker');
const WebhookWorker = require('./workers/webhookWorker');
const { getQueueStats, cleanOldJobs, closeQueues } = require('./jobs/payoutProducer');

/**
 * Worker manager for starting and managing background workers
 */
class WorkerManager {
  constructor() {
    this.payoutWorker = null;
    this.webhookWorker = null;
    this.isRunning = false;
  }

  /**
   * Start all workers
   * @param {Object} options - Worker configuration options
   * @param {number} options.payoutConcurrency - Payout worker concurrency (default: 2)
   * @param {number} options.webhookConcurrency - Webhook worker concurrency (default: 5)
   */
  async start(options = {}) {
    if (this.isRunning) {
      console.log('Workers are already running');
      return;
    }

    const { 
      payoutConcurrency = 2, 
      webhookConcurrency = 5 
    } = options;

    try {
      console.log('🚀 Starting background workers...');

      // Start payout worker
      this.payoutWorker = new PayoutWorker();
      this.payoutWorker.start(payoutConcurrency);

      // Start webhook worker
      this.webhookWorker = new WebhookWorker();
      this.webhookWorker.start(webhookConcurrency);

      this.isRunning = true;
      console.log('✅ All workers started successfully');

      // Set up periodic cleanup
      this.setupPeriodicCleanup();

    } catch (error) {
      console.error('❌ Failed to start workers:', error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop all workers
   */
  async stop() {
    if (!this.isRunning) {
      console.log('Workers are not running');
      return;
    }

    try {
      console.log('🛑 Stopping background workers...');

      // Stop workers
      if (this.payoutWorker) {
        await this.payoutWorker.stop();
        this.payoutWorker = null;
      }

      if (this.webhookWorker) {
        await this.webhookWorker.stop();
        this.webhookWorker = null;
      }

      // Close queue connections
      await closeQueues();

      this.isRunning = false;
      console.log('✅ All workers stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping workers:', error);
      throw error;
    }
  }

  /**
   * Get worker and queue statistics
   * @returns {Promise<Object>} - Statistics object
   */
  async getStats() {
    try {
      const queueStats = await getQueueStats();
      
      return {
        workers: {
          payout: this.payoutWorker ? 'running' : 'stopped',
          webhook: this.webhookWorker ? 'running' : 'stopped',
          isRunning: this.isRunning
        },
        queues: queueStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get worker stats:', error);
      return {
        workers: {
          payout: 'error',
          webhook: 'error',
          isRunning: false
        },
        queues: { error: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Setup periodic cleanup of old jobs
   */
  setupPeriodicCleanup() {
    // Clean old jobs every hour
    setInterval(async () => {
      try {
        await cleanOldJobs(24 * 60 * 60 * 1000); // 24 hours
        console.log('🧹 Cleaned old jobs from queues');
      } catch (error) {
        console.error('Failed to clean old jobs:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Log queue stats every 5 minutes
    setInterval(async () => {
      try {
        const stats = await this.getStats();
        console.log('📊 Queue stats:', {
          payouts: stats.queues.payouts,
          webhooks: stats.queues.webhooks
        });
      } catch (error) {
        console.error('Failed to log queue stats:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Health check for workers
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const stats = await this.getStats();
      
      const isHealthy = this.isRunning && 
        stats.workers.payout === 'running' && 
        stats.workers.webhook === 'running' &&
        stats.queues.redis.status === 'ready';

      return {
        healthy: isHealthy,
        workers: stats.workers,
        queues: stats.queues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const workerManager = new WorkerManager();

module.exports = workerManager;
