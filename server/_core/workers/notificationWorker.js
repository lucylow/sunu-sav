// server/workers/notificationWorker.js
const { Worker } = require('bullmq');
const dbManager = require('../database');
const { getUserPreferredPaymentTime, predictPaymentRisk, getUserNotificationPreferences } = require('../services/UserBehaviorService');
const debugFactory = require('debug');
const debug = debugFactory('sunu:notification-worker');

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

const worker = new Worker('notification-jobs', async (job) => {
  const { userId, notificationType, groupId, customData } = job.data;
  debug(`Processing notification for user ${userId}, type: ${notificationType}`);

  try {
    const db = dbManager.getDb();

    // Get user preferences
    const preferences = await getUserNotificationPreferences(userId);
    
    if (!preferences.sms_enabled && !preferences.push_enabled) {
      debug(`User ${userId} has notifications disabled`);
      return { userId, sent: false, reason: 'disabled' };
    }

    let message = '';
    let priority = 'normal';

    switch (notificationType) {
      case 'contribution_reminder':
        const preferredTime = await getUserPreferredPaymentTime(userId);
        const risk = await predictPaymentRisk(userId, groupId);
        
        if (risk.risk === 'high') {
          message = `🚨 URGENT: Sa jox ñu wut ko tey! Tontine bi dugg neexulam. Jëkkal ci ${preferredTime}.`;
          priority = 'high';
        } else {
          message = `📢 Fatou, jàngalekati bi, sa tontine bi dugg neexulam. Jëkkal ci ${preferredTime}.`;
        }
        break;

      case 'payment_confirmed':
        message = `✅ Jox nga ${customData.amount} sats lu baax! Jërëjëf!`;
        break;

      case 'payout_available':
        message = `🎉 Sa jox ${customData.amount} sats mi ngi pare tey! Jot ko ci portefeuille bi.`;
        priority = 'high';
        break;

      case 'group_completed':
        message = `🏆 Félicitations! Sa group "${customData.groupName}" jeex na jëf. Jëkkal ci group bu bees.`;
        break;

      case 'credit_score_update':
        const score = customData.score;
        if (score >= 0.8) {
          message = `⭐ Sa credit score am na: ${Math.round(score * 100)}%. Excellent!`;
        } else if (score >= 0.6) {
          message = `📈 Sa credit score am na: ${Math.round(score * 100)}%. Keep it up!`;
        } else {
          message = `📊 Sa credit score: ${Math.round(score * 100)}%. Jëkkal ci jox ci waxtu.`;
        }
        break;

      case 'fraud_alert':
        message = `⚠️ Xal: Feewal bu bees gis na. Seetlu ci sa kont.`;
        priority = 'high';
        break;

      default:
        message = `📱 Xibaar ci SunuSàv: ${customData.message || 'Update available'}`;
    }

    // Send notification based on preferences
    const notificationResult = {
      userId,
      type: notificationType,
      message,
      priority,
      sent: false,
      channels: []
    };

    if (preferences.sms_enabled) {
      try {
        // Mock SMS sending (in real implementation, integrate with SMS provider)
        debug(`Sending SMS to user ${userId}: ${message}`);
        notificationResult.channels.push('sms');
        notificationResult.sent = true;
      } catch (error) {
        debug(`SMS sending failed for user ${userId}:`, error);
      }
    }

    if (preferences.push_enabled) {
      try {
        // Mock push notification (in real implementation, use Firebase/APNs)
        debug(`Sending push notification to user ${userId}: ${message}`);
        notificationResult.channels.push('push');
        notificationResult.sent = true;
      } catch (error) {
        debug(`Push notification failed for user ${userId}:`, error);
      }
    }

    // Log notification in database
    await db('ai_metrics').insert({
      user_id: userId,
      metric_key: 'notification_sent',
      metric_value: notificationResult.sent ? 1 : 0,
      metric_type: 'count',
      meta: JSON.stringify({
        type: notificationType,
        message,
        priority,
        channels: notificationResult.channels
      }),
      created_at: db.fn.now()
    });

    debug(`Notification processed for user ${userId}:`, notificationResult);
    return notificationResult;
  } catch (error) {
    debug(`Notification failed for user ${userId}:`, error);
    throw error;
  }
}, { 
  connection, 
  concurrency: 8,
  removeOnComplete: 50,
  removeOnFail: 20
});

worker.on('completed', job => {
  debug(`Notification completed for job ${job.id}`);
});

worker.on('failed', (job, err) => {
  debug(`Notification failed for job ${job.id}:`, err.message);
});

worker.on('error', err => {
  debug('Notification worker error:', err);
});

module.exports = worker;
