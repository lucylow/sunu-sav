// server/jobs/enqueueCreditCheck.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Redis connection
const connection = new IORedis({ 
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100
});

// Create queues
const creditQueue = new Queue('credit-checks', { connection });
const fraudQueue = new Queue('fraud-checks', { connection });

// Credit scoring job producer
async function enqueueCreditCheck(userId, priority = 'normal') {
  try {
    const jobOptions = {
      attempts: 3,
      backoff: { 
        type: 'exponential', 
        delay: 2000 
      },
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 5, // Keep last 5 failed jobs
      priority: priority === 'high' ? 1 : 0
    };

    const job = await creditQueue.add('check-credit', { userId }, jobOptions);
    console.log(`Credit check job enqueued for user ${userId}: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue credit check:', error);
    throw error;
  }
}

// Batch credit check for multiple users
async function enqueueBatchCreditCheck(userIds, priority = 'normal') {
  try {
    const jobs = [];
    for (const userId of userIds) {
      const job = await enqueueCreditCheck(userId, priority);
      jobs.push(job);
    }
    console.log(`Batch credit check enqueued for ${userIds.length} users`);
    return jobs;
  } catch (error) {
    console.error('Failed to enqueue batch credit check:', error);
    throw error;
  }
}

// Fraud detection job producer
async function enqueueFraudCheck(transactionData, priority = 'high') {
  try {
    const jobOptions = {
      attempts: 2, // Fewer retries for fraud detection
      backoff: { 
        type: 'exponential', 
        delay: 1000 
      },
      removeOnComplete: 20, // Keep more fraud checks for audit
      removeOnFail: 10,
      priority: priority === 'high' ? 1 : 0
    };

    const job = await fraudQueue.add('check-fraud', transactionData, jobOptions);
    console.log(`Fraud check job enqueued: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue fraud check:', error);
    throw error;
  }
}

// Batch fraud check for multiple transactions
async function enqueueBatchFraudCheck(transactions, priority = 'high') {
  try {
    const jobs = [];
    for (const tx of transactions) {
      const job = await enqueueFraudCheck(tx, priority);
      jobs.push(job);
    }
    console.log(`Batch fraud check enqueued for ${transactions.length} transactions`);
    return jobs;
  } catch (error) {
    console.error('Failed to enqueue batch fraud check:', error);
    throw error;
  }
}

// Queue monitoring functions
async function getQueueStats() {
  try {
    const creditStats = await creditQueue.getJobCounts();
    const fraudStats = await fraudQueue.getJobCounts();
    
    return {
      credit: creditStats,
      fraud: fraudStats
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return null;
  }
}

// Clean up old jobs
async function cleanupOldJobs() {
  try {
    await creditQueue.clean(24 * 60 * 60 * 1000, 10, 'completed'); // 24 hours
    await creditQueue.clean(7 * 24 * 60 * 60 * 1000, 5, 'failed'); // 7 days
    await fraudQueue.clean(24 * 60 * 60 * 1000, 20, 'completed'); // 24 hours
    await fraudQueue.clean(7 * 24 * 60 * 60 * 1000, 10, 'failed'); // 7 days
    
    console.log('Queue cleanup completed');
  } catch (error) {
    console.error('Queue cleanup failed:', error);
  }
}

// Graceful shutdown
async function closeQueues() {
  try {
    await creditQueue.close();
    await fraudQueue.close();
    await connection.quit();
    console.log('Queues closed gracefully');
  } catch (error) {
    console.error('Error closing queues:', error);
  }
}

module.exports = {
  enqueueCreditCheck,
  enqueueBatchCreditCheck,
  enqueueFraudCheck,
  enqueueBatchFraudCheck,
  getQueueStats,
  cleanupOldJobs,
  closeQueues,
  creditQueue,
  fraudQueue,
  connection
};
