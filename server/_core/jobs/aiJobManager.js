// server/jobs/aiJobManager.js
const { Queue } = require('bullmq');
const debugFactory = require('debug');
const debug = debugFactory('sunu:ai-jobs');

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

// Create queues for different AI tasks
const creditQueue = new Queue('credit-checks', { connection });
const fraudQueue = new Queue('fraud-checks', { connection });
const notificationQueue = new Queue('notification-jobs', { connection });

/**
 * Enqueue credit score check for a user
 */
async function enqueueCreditCheck(userId, priority = 'normal') {
  try {
    const job = await creditQueue.add('credit-check', { userId }, {
      priority: priority === 'high' ? 1 : 5,
      delay: priority === 'high' ? 0 : 5000, // Delay low priority jobs
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5
    });
    
    debug(`Credit check enqueued for user ${userId}, job ${job.id}`);
    return job.id;
  } catch (error) {
    debug(`Failed to enqueue credit check for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Enqueue fraud detection check for a payment
 */
async function enqueueFraudCheck(paymentId, userId, amount, paymentHash, priority = 'high') {
  try {
    const job = await fraudQueue.add('fraud-check', { 
      paymentId, 
      userId, 
      amount, 
      paymentHash 
    }, {
      priority: priority === 'high' ? 1 : 5,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 20,
      removeOnFail: 10
    });
    
    debug(`Fraud check enqueued for payment ${paymentId}, job ${job.id}`);
    return job.id;
  } catch (error) {
    debug(`Failed to enqueue fraud check for payment ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Enqueue notification for a user
 */
async function enqueueNotification(userId, notificationType, groupId = null, customData = {}) {
  try {
    const job = await notificationQueue.add('notification', { 
      userId, 
      notificationType, 
      groupId, 
      customData 
    }, {
      priority: notificationType === 'fraud_alert' || notificationType === 'payout_available' ? 1 : 5,
      delay: notificationType === 'contribution_reminder' ? 30000 : 0, // Delay reminders by 30 seconds
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 50,
      removeOnFail: 20
    });
    
    debug(`Notification enqueued for user ${userId}, type: ${notificationType}, job ${job.id}`);
    return job.id;
  } catch (error) {
    debug(`Failed to enqueue notification for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Schedule recurring credit checks for all active users
 */
async function scheduleRecurringCreditChecks() {
  try {
    const dbManager = require('../database');
    const db = dbManager.getDb();
    
    const activeUsers = await db('users')
      .whereNotNull('credit_score_updated_at')
      .orWhereNull('credit_score_updated_at')
      .select('id');

    debug(`Scheduling credit checks for ${activeUsers.length} users`);

    for (const user of activeUsers) {
      await enqueueCreditCheck(user.id, 'normal');
    }

    return activeUsers.length;
  } catch (error) {
    debug('Failed to schedule recurring credit checks:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const [creditStats, fraudStats, notificationStats] = await Promise.all([
      creditQueue.getJobCounts(),
      fraudQueue.getJobCounts(),
      notificationQueue.getJobCounts()
    ]);

    return {
      credit: creditStats,
      fraud: fraudStats,
      notification: notificationStats,
      total: {
        waiting: creditStats.waiting + fraudStats.waiting + notificationStats.waiting,
        active: creditStats.active + fraudStats.active + notificationStats.active,
        completed: creditStats.completed + fraudStats.completed + notificationStats.completed,
        failed: creditStats.failed + fraudStats.failed + notificationStats.failed
      }
    };
  } catch (error) {
    debug('Failed to get queue stats:', error);
    throw error;
  }
}

/**
 * Clean up old completed jobs
 */
async function cleanupOldJobs() {
  try {
    await Promise.all([
      creditQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'), // Clean completed jobs older than 24 hours
      fraudQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'),
      notificationQueue.clean(24 * 60 * 60 * 1000, 100, 'completed')
    ]);
    
    debug('Cleaned up old completed jobs');
  } catch (error) {
    debug('Failed to cleanup old jobs:', error);
  }
}

module.exports = {
  enqueueCreditCheck,
  enqueueFraudCheck,
  enqueueNotification,
  scheduleRecurringCreditChecks,
  getQueueStats,
  cleanupOldJobs,
  queues: {
    credit: creditQueue,
    fraud: fraudQueue,
    notification: notificationQueue
  }
};
