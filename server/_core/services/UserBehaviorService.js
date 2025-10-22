// server/services/UserBehaviorService.js
const dbManager = require('./database');
const debugFactory = require('debug');
const debug = debugFactory('sunu:behavior');

/**
 * Analyzes past contribution timestamps to predict preferred daily pay time
 */
async function getUserPreferredPaymentTime(userId) {
  try {
    const db = dbManager.getDb();
    
    const result = await db('contributions')
      .where('user_id', userId)
      .andWhere('status', 'paid')
      .select(db.raw('EXTRACT(HOUR FROM created_at) as hour'))
      .orderBy('created_at', 'desc')
      .limit(100);

    if (result.length === 0) {
      // Default to evening if no history
      return '18:00';
    }

    const hourCounts = {};
    for (const row of result) {
      const hour = Math.floor(row.hour);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const maxHour = Object.entries(hourCounts).reduce((a, b) =>
      b[1] > a[1] ? b : a,
      [18, 0] // Default to 6 PM
    )[0];

    // Prefer reminder 15 mins before usual time
    const reminderHour = (parseInt(maxHour) + 23) % 24; // wraps around midnight
    const reminderMinute = Math.max(0, parseInt(maxHour) === parseInt(reminderHour) ? 45 : 0);

    // Format as hh:mm string
    return `${reminderHour.toString().padStart(2, '0')}:${reminderMinute.toString().padStart(2, '0')}`;
  } catch (error) {
    debug('Error getting user preferred payment time:', error);
    return '18:00'; // Default fallback
  }
}

/**
 * Get user's contribution patterns and preferences
 */
async function getUserContributionPatterns(userId) {
  try {
    const db = dbManager.getDb();
    
    const patterns = await db('contributions')
      .where('user_id', userId)
      .andWhere('status', 'paid')
      .select(
        db.raw('AVG(amount_sats) as avg_amount'),
        db.raw('COUNT(*) as total_contributions'),
        db.raw('AVG(EXTRACT(EPOCH FROM (paid_at - created_at))/3600) as avg_delay_hours'),
        db.raw('MAX(created_at) as last_contribution')
      )
      .first();

    return {
      avgAmount: parseFloat(patterns.avg_amount || 0),
      totalContributions: parseInt(patterns.total_contributions || 0),
      avgDelayHours: parseFloat(patterns.avg_delay_hours || 0),
      lastContribution: patterns.last_contribution,
      preferredTime: await getUserPreferredPaymentTime(userId)
    };
  } catch (error) {
    debug('Error getting user contribution patterns:', error);
    return {
      avgAmount: 0,
      totalContributions: 0,
      avgDelayHours: 0,
      lastContribution: null,
      preferredTime: '18:00'
    };
  }
}

/**
 * Predict if user is likely to miss next payment
 */
async function predictPaymentRisk(userId, groupId) {
  try {
    const db = dbManager.getDb();
    
    // Get recent payment history
    const recentPayments = await db('contributions')
      .where('user_id', userId)
      .andWhere('group_id', groupId)
      .orderBy('created_at', 'desc')
      .limit(5);

    if (recentPayments.length === 0) {
      return { risk: 'unknown', confidence: 0 };
    }

    let lateCount = 0;
    let totalDelay = 0;

    for (const payment of recentPayments) {
      if (payment.paid_at && payment.created_at) {
        const delayHours = (new Date(payment.paid_at) - new Date(payment.created_at)) / (1000 * 60 * 60);
        if (delayHours > 24) {
          lateCount++;
        }
        totalDelay += delayHours;
      }
    }

    const lateRate = lateCount / recentPayments.length;
    const avgDelay = totalDelay / recentPayments.length;

    let risk = 'low';
    if (lateRate > 0.5 || avgDelay > 48) {
      risk = 'high';
    } else if (lateRate > 0.2 || avgDelay > 24) {
      risk = 'medium';
    }

    return {
      risk,
      confidence: Math.min(0.9, recentPayments.length / 5),
      lateRate,
      avgDelayHours: avgDelay
    };
  } catch (error) {
    debug('Error predicting payment risk:', error);
    return { risk: 'unknown', confidence: 0 };
  }
}

/**
 * Get personalized notification preferences
 */
async function getUserNotificationPreferences(userId) {
  try {
    const db = dbManager.getDb();
    
    const preferences = await db('users')
      .where('id', userId)
      .select('notification_preferences')
      .first();

    if (preferences && preferences.notification_preferences) {
      return JSON.parse(preferences.notification_preferences);
    }

    // Default preferences
    return {
      sms_enabled: true,
      email_enabled: false,
      push_enabled: true,
      reminder_frequency: 'daily',
      preferred_language: 'wo'
    };
  } catch (error) {
    debug('Error getting notification preferences:', error);
    return {
      sms_enabled: true,
      email_enabled: false,
      push_enabled: true,
      reminder_frequency: 'daily',
      preferred_language: 'wo'
    };
  }
}

module.exports = {
  getUserPreferredPaymentTime,
  getUserContributionPatterns,
  predictPaymentRisk,
  getUserNotificationPreferences
};
