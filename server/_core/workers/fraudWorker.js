// server/workers/fraudWorker.js
const { Worker } = require('bullmq');
const dbManager = require('../database');
const FraudService = require('../services/FraudService');
const debugFactory = require('debug');
const debug = debugFactory('sunu:fraud-worker');

// Redis connection for BullMQ
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

const worker = new Worker('fraud-checks', async (job) => {
  const { paymentId, userId, amount, paymentHash } = job.data;
  debug(`Processing fraud check for payment ${paymentId}`);

  try {
    const db = dbManager.getDb();

    // Gather transaction features
    const recentTxs = await db('contributions')
      .where('user_id', userId)
      .andWhere('created_at', '>', db.raw("now() - interval '1 hour'"))
      .orderBy('created_at', 'desc')
      .limit(10);

    const lastTx = recentTxs[0];
    const timeSinceLast = lastTx ? 
      Math.floor((Date.now() - new Date(lastTx.created_at).getTime()) / 1000) : 
      3600; // Default to 1 hour if no recent transactions

    const invoicesLastMin = recentTxs.filter(tx => 
      (Date.now() - new Date(tx.created_at).getTime()) < 60000
    ).length;

    // Mock device and location changes (in real implementation, track these)
    const deviceChanges = Math.random() > 0.8 ? 1 : 0;
    const locationChanges = Math.random() > 0.9 ? 1 : 0;

    const txFeatures = {
      user_id: userId,
      amount_sats: amount,
      time_since_last_sec: timeSinceLast,
      invoices_last_min: invoicesLastMin,
      device_changes: deviceChanges,
      location_changes: locationChanges,
      payment_hash: paymentHash
    };

    debug('Transaction features for fraud detection:', txFeatures);

    // Check for fraud
    const fraudResult = await FraudService.checkTransaction(txFeatures);

    if (fraudResult.alert) {
      debug(`Payment ${paymentId} flagged as suspicious`);
      
      // Insert fraud alert
      await db('ai_alerts').insert({
        user_id: userId,
        alert_type: 'fraud_suspect',
        payload: JSON.stringify({
          payment_id: paymentId,
          payment_hash: paymentHash,
          fraud_score: fraudResult.score,
          features: txFeatures
        }),
        severity: fraudResult.score > 0.8 ? 'high' : 'medium',
        created_at: db.fn.now()
      });

      // Optional: Hold payment for manual review
      if (fraudResult.score > 0.8) {
        await db('contributions')
          .where('id', paymentId)
          .update({
            status: 'under_review',
            review_reason: 'fraud_detection',
            updated_at: db.fn.now()
          });

        debug(`Payment ${paymentId} held for manual review due to high fraud score`);
      }
    } else {
      debug(`Payment ${paymentId} cleared fraud check`);
      
      // Update payment status to approved
      await db('contributions')
        .where('id', paymentId)
        .update({
          status: 'approved',
          fraud_score: fraudResult.score,
          updated_at: db.fn.now()
        });
    }

    // Store fraud metrics
    await db('ai_metrics').insert({
      user_id: userId,
      metric_key: 'fraud_score',
      metric_value: fraudResult.score,
      metric_type: 'score',
      meta: JSON.stringify({ payment_id: paymentId, features: txFeatures }),
      created_at: db.fn.now()
    });

    return { 
      paymentId, 
      userId, 
      fraudDetected: fraudResult.alert, 
      score: fraudResult.score 
    };
  } catch (error) {
    debug(`Fraud check failed for payment ${paymentId}:`, error);
    throw error;
  }
}, { 
  connection, 
  concurrency: 6,
  removeOnComplete: 20,
  removeOnFail: 10
});

worker.on('completed', job => {
  debug(`Fraud check completed for job ${job.id}`);
});

worker.on('failed', (job, err) => {
  debug(`Fraud check failed for job ${job.id}:`, err.message);
});

worker.on('error', err => {
  debug('Fraud worker error:', err);
});

module.exports = worker;
