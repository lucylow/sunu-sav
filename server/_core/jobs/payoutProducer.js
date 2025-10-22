const { Queue } = require('bullmq');
const IORedis = require('ioredis');

/**
 * Redis connection configuration
 */
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
  lazyConnect: true
});

/**
 * Payout queue for processing Lightning payments
 */
const payoutQueue = new Queue('payouts', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { 
      type: 'exponential', 
      delay: 2000 
    }, // 2s -> 4s -> 8s -> 16s -> 32s
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    timeout: 10 * 60 * 1000 // 10 minutes timeout
  }
});

/**
 * Webhook processing queue for handling Lightning webhooks
 */
const webhookQueue = new Queue('webhooks', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { 
      type: 'exponential', 
      delay: 1000 
    }, // 1s -> 2s -> 4s
    removeOnComplete: 20,
    removeOnFail: 100,
    timeout: 5 * 60 * 1000 // 5 minutes timeout
  }
});

/**
 * Enqueue a payout job for background processing
 * @param {Object} payload - Payout job data
 * @param {string} payload.payoutId - Payment attempt ID
 * @param {string} payload.groupId - Group ID
 * @param {number} payload.cycleNumber - Cycle number
 * @param {Array} payload.recipients - Array of recipients with amounts
 * @param {string} payload.idempotencyKey - Idempotency key
 * @returns {Promise<Job>} - The enqueued job
 */
async function enqueuePayoutWorker(payload) {
  try {
    const job = await payoutQueue.add('payout', payload, {
      jobId: payload.payoutId, // Use payoutId as job ID for idempotency
      priority: 10, // High priority for payouts
      delay: 0 // Process immediately
    });
    
    console.log(`Enqueued payout job ${job.id} for group ${payload.groupId}, cycle ${payload.cycleNumber}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue payout job:', error);
    throw error;
  }
}

/**
 * Enqueue a webhook processing job
 * @param {Object} payload - Webhook data
 * @param {string} payload.payment_hash - Payment hash
 * @param {string} payload.status - Payment status
 * @param {Object} payload.metadata - Additional metadata
 * @returns {Promise<Job>} - The enqueued job
 */
async function enqueueWebhookProcessingJob(payload) {
  try {
    const job = await webhookQueue.add('webhook', payload, {
      jobId: `webhook_${payload.payment_hash}`, // Use payment_hash for idempotency
      priority: 5, // Medium priority for webhooks
      delay: 0
    });
    
    console.log(`Enqueued webhook job ${job.id} for payment ${payload.payment_hash}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue webhook job:', error);
    throw error;
  }
}

/**
 * Get queue statistics for monitoring
 * @returns {Promise<Object>} - Queue statistics
 */
async function getQueueStats() {
  try {
    const [payoutStats, webhookStats] = await Promise.all([
      payoutQueue.getJobCounts(),
      webhookQueue.getJobCounts()
    ]);
    
    return {
      payouts: payoutStats,
      webhooks: webhookStats,
      redis: {
        status: redisConnection.status,
        host: redisConnection.options.host,
        port: redisConnection.options.port
      }
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return {
      payouts: { waiting: 0, active: 0, completed: 0, failed: 0 },
      webhooks: { waiting: 0, active: 0, completed: 0, failed: 0 },
      redis: { status: 'error', error: error.message }
    };
  }
}

/**
 * Clean up old jobs from queues
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {Promise<void>}
 */
async function cleanOldJobs(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  try {
    const cutoff = Date.now() - maxAge;
    
    await Promise.all([
      payoutQueue.clean(cutoff, 100, 'completed'),
      payoutQueue.clean(cutoff, 100, 'failed'),
      webhookQueue.clean(cutoff, 100, 'completed'),
      webhookQueue.clean(cutoff, 100, 'failed')
    ]);
    
    console.log(`Cleaned jobs older than ${maxAge}ms`);
  } catch (error) {
    console.error('Failed to clean old jobs:', error);
  }
}

/**
 * Close all queue connections
 * @returns {Promise<void>}
 */
async function closeQueues() {
  try {
    await Promise.all([
      payoutQueue.close(),
      webhookQueue.close(),
      redisConnection.disconnect()
    ]);
    console.log('All queue connections closed');
  } catch (error) {
    console.error('Error closing queue connections:', error);
  }
}

// Handle Redis connection events
redisConnection.on('connect', () => {
  console.log('✅ Redis connected for job queues');
});

redisConnection.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redisConnection.on('close', () => {
  console.log('🔌 Redis connection closed');
});

module.exports = { 
  payoutQueue,
  webhookQueue,
  redisConnection,
  enqueuePayoutWorker,
  enqueueWebhookProcessingJob,
  getQueueStats,
  cleanOldJobs,
  closeQueues
};
