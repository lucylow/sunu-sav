const { Worker } = require('bullmq');
const { redisConnection } = require('../jobs/payoutProducer');
const TontineService = require('../TontineService');

/**
 * Webhook worker for processing Lightning webhooks in the background
 * Handles webhook processing with retry logic and proper error handling
 */
class WebhookWorker {
  constructor() {
    this.tontineService = new TontineService();
    this.worker = null;
  }

  /**
   * Start the webhook worker
   * @param {number} concurrency - Number of concurrent jobs to process
   */
  start(concurrency = 5) {
    this.worker = new Worker('webhooks', this.processWebhookJob.bind(this), {
      connection: redisConnection,
      concurrency: concurrency,
      removeOnComplete: 20,
      removeOnFail: 100
    });

    // Set up event handlers
    this.worker.on('completed', (job) => {
      console.log(`✅ Webhook job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Webhook job ${job.id} failed:`, err.message);
      
      // Log webhook failures for monitoring
      if (job.attemptsMade >= job.opts.attempts) {
        this.logWebhookFailure(job, err);
      }
    });

    this.worker.on('error', (err) => {
      console.error('❌ Webhook worker error:', err);
    });

    console.log(`🚀 Webhook worker started with concurrency: ${concurrency}`);
    return this.worker;
  }

  /**
   * Process a webhook job
   * @param {Job} job - BullMQ job instance
   * @returns {Promise<Object>} - Job result
   */
  async processWebhookJob(job) {
    const { payment_hash, status, metadata = {} } = job.data;
    console.log(`Processing webhook job ${job.id} for payment ${payment_hash}, status: ${status}`);

    try {
      // Validate webhook data
      if (!payment_hash) {
        throw new Error('Missing payment_hash in webhook data');
      }

      if (!status) {
        throw new Error('Missing status in webhook data');
      }

      // Process the payment based on status
      if (status === 'settled') {
        // Payment is settled - process it
        const result = await this.tontineService.processPayment(payment_hash, metadata.ipAddress || '');
        
        console.log(`✅ Successfully processed settled payment ${payment_hash}`);
        
        return {
          success: true,
          payment_hash,
          status: 'processed',
          result: {
            contribution_id: result.id,
            group_id: result.group_id,
            amount_sats: result.amount_sats
          }
        };
        
      } else if (status === 'failed' || status === 'expired') {
        // Payment failed or expired - handle accordingly
        console.log(`Payment ${payment_hash} ${status}, handling failure`);
        
        // In a real implementation, you might want to:
        // 1. Update contribution status to failed/expired
        // 2. Send notification to user
        // 3. Handle retry logic
        
        return {
          success: true,
          payment_hash,
          status: 'handled_failure',
          action: status
        };
        
      } else {
        // Other statuses (pending, etc.) - just acknowledge
        console.log(`Acknowledged webhook for payment ${payment_hash} with status: ${status}`);
        
        return {
          success: true,
          payment_hash,
          status: 'acknowledged',
          webhook_status: status
        };
      }

    } catch (error) {
      console.error(`Webhook processing failed for job ${job.id}:`, error);
      
      // Don't retry for certain types of errors
      if (this.isNonRetryableError(error)) {
        console.log(`Non-retryable error for payment ${payment_hash}, marking as failed`);
        return {
          success: false,
          payment_hash,
          status: 'failed',
          error: error.message,
          non_retryable: true
        };
      }
      
      // Re-throw to trigger retry
      throw error;
    }
  }

  /**
   * Check if an error is non-retryable
   * @param {Error} error - Error to check
   * @returns {boolean} - True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      'Contribution not found',
      'User is not an active member',
      'Group not found or inactive',
      'Invalid payment_hash format'
    ];
    
    return nonRetryablePatterns.some(pattern => 
      error.message.includes(pattern)
    );
  }

  /**
   * Log webhook failure for monitoring
   * @param {Job} job - Failed job
   * @param {Error} error - Error that caused failure
   */
  async logWebhookFailure(job, error) {
    try {
      const failureLog = {
        type: 'WEBHOOK_FAILURE',
        jobId: job.id,
        attempts: job.attemptsMade,
        error: error.message,
        data: job.data,
        timestamp: new Date().toISOString()
      };
      
      console.error('WEBHOOK PROCESSING FAILURE:', JSON.stringify(failureLog, null, 2));
      
      // In production, you would:
      // 1. Send to monitoring system (DataDog, New Relic, etc.)
      // 2. Create incident ticket
      // 3. Alert on-call engineer
      
    } catch (logError) {
      console.error('Failed to log webhook failure:', logError);
    }
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (this.worker) {
      await this.worker.close();
      console.log('Webhook worker stopped');
    }
  }
}

module.exports = WebhookWorker;
