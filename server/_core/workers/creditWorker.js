// server/workers/creditWorker.js
const { Worker } = require('bullmq');
const dbManager = require('../database');
const CreditAIService = require('../services/CreditAIService');
const LightningManager = require('../services/lightningService');
const debugFactory = require('debug');
const debug = debugFactory('sunu:credit-worker');

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

const worker = new Worker('credit-checks', async (job) => {
  const { userId } = job.data;
  debug(`Processing credit check for user ${userId}`);

  try {
    const db = dbManager.getDb();

    // Gather user features from database
    const totals = await db('contributions')
      .where('user_id', userId)
      .andWhere('created_at', '>', db.raw("now() - interval '90 days'"))
      .select(
        db.raw('count(*) as cnt'),
        db.raw('sum(amount_sats) as sum_sats'),
        db.raw('avg(extract(epoch from (paid_at - created_at))/86400) as avg_delay')
      )
      .first();

    const punctualityRes = await db('contributions')
      .where('user_id', userId)
      .select(
        db.raw(`avg(case when status='paid' and paid_at <= created_at + interval '24 hours' then 1 else 0 end) as punctuality`)
      )
      .first();

    const endorsementsRow = await db('group_members')
      .where('user_id', userId)
      .andWhere('is_active', true)
      .count('id as count')
      .first();

    // Mock mobile transaction data (in real implementation, integrate with mobile money APIs)
    const mobileTxVolume = Math.random() * 500000; // Random for demo

    const features = {
      user_id: userId,
      tontine_contributions: Number(totals?.sum_sats || 0),
      punctuality_rate: Number(punctualityRes?.punctuality || 0),
      contributions_count: Number(totals?.cnt || 0),
      mobile_tx_volume: mobileTxVolume,
      avg_payment_delay_days: Number(totals?.avg_delay || 0),
      community_endorsements: Number(endorsementsRow?.count || 0),
    };

    debug('User features for credit scoring:', features);

    // Call AI model
    const score = await CreditAIService.predict(features);

    // Save score and metrics
    await db.transaction(async (trx) => {
      await trx('users').where({ id: userId }).update({
        credit_score: score,
        credit_score_updated_at: trx.fn.now()
      });

      await trx('ai_metrics').insert({
        user_id: userId,
        metric_key: 'credit_score',
        metric_value: score,
        metric_type: 'score',
        meta: JSON.stringify({ features }),
        created_at: trx.fn.now()
      });
    });

    debug(`Credit score calculated for user ${userId}: ${score}`);

    // Optional reward for good score
    if (score >= 0.9) {
      await db('ai_alerts').insert({
        user_id: userId,
        alert_type: 'credit_offer',
        payload: JSON.stringify({ 
          score, 
          message: 'Excellent credit profile! You earned a bonus.',
          bonus_amount: 5000 
        }),
        severity: 'low',
        created_at: db.fn.now()
      });

      try {
        // Send bonus via Lightning (mock for demo)
        debug(`Sending bonus to user ${userId} for excellent credit score`);
        // In real implementation: await LightningManager.sendBonus(userId, 5000);
      } catch (e) {
        debug('Bonus sending failed:', e);
      }
    }

    return { userId, score };
  } catch (error) {
    debug(`Credit check failed for user ${userId}:`, error);
    throw error;
  }
}, { 
  connection, 
  concurrency: 4,
  removeOnComplete: 10,
  removeOnFail: 5
});

worker.on('completed', job => {
  debug(`Credit check completed for job ${job.id}`);
});

worker.on('failed', (job, err) => {
  debug(`Credit check failed for job ${job.id}:`, err.message);
});

worker.on('error', err => {
  debug('Credit worker error:', err);
});

module.exports = worker;
