// server/workers/creditWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../jobs/enqueueCreditCheck');
const db = require('../_core/database');
const CreditAI = require('../services/CreditAIService');
const LightningService = require('../services/LightningService');
const NotificationService = require('../services/NotificationService');

class CreditWorker {
  constructor() {
    this.worker = new Worker('credit-checks', this.processJob.bind(this), {
      connection,
      concurrency: 4,
      removeOnComplete: 10,
      removeOnFail: 5
    });

    this.setupEventHandlers();
  }

  async processJob(job) {
    const { userId } = job.data;
    console.log(`Processing credit check for user ${userId}`);

    try {
      // 1) Gather recent metrics and compute features
      const features = await this.computeUserFeatures(userId);
      
      // 2) Call AI microservice
      const aiResult = await CreditAI.predict(features);
      
      // 3) Persist score transactionally
      await CreditAI.saveScore(
        userId, 
        aiResult.credit_score, 
        aiResult.confidence, 
        aiResult.model_version
      );

      // 4) Handle high credit scores (rewards, alerts)
      if (aiResult.credit_score >= 0.8) {
        await this.handleHighCreditScore(userId, aiResult);
      }

      console.log(`Credit check completed for user ${userId}: score=${aiResult.credit_score}`);
      
      return { 
        userId, 
        credit_score: aiResult.credit_score,
        confidence: aiResult.confidence,
        model_version: aiResult.model_version
      };

    } catch (error) {
      console.error(`Credit check failed for user ${userId}:`, error);
      throw error; // This will trigger retry logic
    }
  }

  async computeUserFeatures(userId) {
    try {
      // Get contribution totals from last 90 days
      const totals = await db('contributions')
        .where('user_id', userId)
        .andWhere('created_at', '>', db.raw("now() - interval '90 days'"))
        .select(
          db.raw('count(*) as cnt'),
          db.raw('sum(amount_sats) as sum_sats'),
          db.raw('avg(extract(epoch from now()-created_at))/86400 as avg_delay')
        )
        .first();

      // Calculate punctuality rate
      const punctualityRes = await db('contributions')
        .where('user_id', userId)
        .andWhere('created_at', '>', db.raw("now() - interval '90 days'"))
        .avg(db.raw(`(case when status='on_time' then 1 else 0 end)`))
        .first();

      // Get community endorsements
      const endorsementsRow = await db('peer_endorsements')
        .where({ to_user_id: userId })
        .count()
        .first();

      // Get mobile transaction volume
      const mobileTxRow = await db('mobile_transactions')
        .where('user_id', userId)
        .andWhere('created_at', '>', db.raw("now() - interval '90 days'"))
        .sum('amount_xof as total')
        .first();

      // Fallback values if null
      const contributionsCount = parseInt(totals?.cnt || 0);
      const tontineContributions = parseFloat(totals?.sum_sats || 0);
      const avgDelayDays = parseFloat(totals?.avg_delay || 0);
      const punctualityRate = parseFloat(punctualityRes?.avg || 0);
      const communityEndorsements = parseInt(endorsementsRow?.count || 0);
      const mobileTxVolume = parseFloat(mobileTxRow?.total || 0);

      return {
        user_id: userId,
        tontine_contributions: tontineContributions,
        punctuality_rate: punctualityRate,
        contributions_count: contributionsCount,
        mobile_tx_volume: mobileTxVolume,
        avg_payment_delay_days: avgDelayDays,
        community_endorsements: communityEndorsements
      };

    } catch (error) {
      console.error('Failed to compute user features:', error);
      throw error;
    }
  }

  async handleHighCreditScore(userId, aiResult) {
    try {
      // Create credit offer alert
      const loanAmount = Math.round(aiResult.credit_score * 100000); // XOF
      await CreditAI.createCreditAlert(userId, aiResult.credit_score, loanAmount);

      // Send small reward (testnet only)
      if (process.env.NODE_ENV === 'development' || process.env.LIGHTNING_NETWORK === 'testnet') {
        const rewardSats = Math.round(aiResult.credit_score * 10000); // 0-10k sats
        
        try {
          await LightningService.autoSendSatsToUser(
            userId, 
            rewardSats, 
            { reason: 'AI reward: excellent credit score' }
          );
          
          // Send notification
          await NotificationService.sendNotification(
            userId,
            'credit_reward',
            `Congratulations! You earned ${rewardSats} sats for your excellent credit score (${Math.round(aiResult.credit_score * 100)}%).`
          );
          
          console.log(`Credit reward sent to user ${userId}: ${rewardSats} sats`);
        } catch (lightningError) {
          console.error('Lightning reward failed:', lightningError);
          // Don't fail the job for Lightning errors
        }
      }

    } catch (error) {
      console.error('Failed to handle high credit score:', error);
      // Don't fail the job for reward/alert errors
    }
  }

  setupEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`Credit worker completed job ${job.id} for user ${job.data.userId}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Credit worker failed job ${job?.id}:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('Credit worker error:', err);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Credit worker job ${jobId} stalled`);
    });
  }

  async close() {
    await this.worker.close();
    console.log('Credit worker closed');
  }
}

// Create and export worker instance
const creditWorker = new CreditWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down credit worker...');
  await creditWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down credit worker...');
  await creditWorker.close();
  process.exit(0);
});

module.exports = creditWorker;
