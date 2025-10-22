// server/workers/fraudWorker.js
const { Worker } = require('bullmq');
const { connection } = require('../jobs/enqueueCreditCheck');
const db = require('../_core/database');
const FraudDetectionService = require('../services/FraudDetectionService');
const NotificationService = require('../services/NotificationService');

class FraudWorker {
  constructor() {
    this.worker = new Worker('fraud-checks', this.processJob.bind(this), {
      connection,
      concurrency: 8, // Higher concurrency for fraud detection
      removeOnComplete: 20,
      removeOnFail: 10
    });

    this.setupEventHandlers();
  }

  async processJob(job) {
    const transactionData = job.data;
    console.log(`Processing fraud check for transaction: ${transactionData.payment_hash || transactionData.user_id}`);

    try {
      // 1) Extract transaction features
      const txFeatures = FraudDetectionService.extractTransactionFeatures(
        transactionData,
        await this.getUserTransactionHistory(transactionData.user_id)
      );

      // 2) Call AI fraud detection service
      const fraudResult = await FraudDetectionService.checkTransaction(txFeatures);

      // 3) Record fraud check metric
      await FraudDetectionService.recordFraudCheck(
        transactionData.user_id,
        txFeatures,
        fraudResult
      );

      // 4) Handle fraud alerts
      if (fraudResult.alert) {
        await this.handleFraudAlert(transactionData, txFeatures, fraudResult);
      }

      console.log(`Fraud check completed: alert=${fraudResult.alert}, score=${fraudResult.score}`);
      
      return {
        user_id: transactionData.user_id,
        payment_hash: transactionData.payment_hash,
        alert: fraudResult.alert,
        score: fraudResult.score,
        confidence: fraudResult.confidence,
        reason: fraudResult.reason
      };

    } catch (error) {
      console.error(`Fraud check failed for transaction ${transactionData.payment_hash}:`, error);
      throw error;
    }
  }

  async getUserTransactionHistory(userId) {
    try {
      // Get recent transaction patterns for context
      const recentTxs = await db('payments')
        .where('user_id', userId)
        .andWhere('created_at', '>', db.raw("now() - interval '1 hour'"))
        .orderBy('created_at', 'desc')
        .limit(10);

      // Calculate patterns
      const now = new Date();
      const lastTx = recentTxs[0];
      const timeSinceLastSec = lastTx ? 
        (now - new Date(lastTx.created_at)) / 1000 : 0;
      
      const invoicesLastMin = recentTxs.filter(tx => 
        (now - new Date(tx.created_at)) / 1000 < 60
      ).length;

      // Get device/location changes (simplified)
      const uniqueDevices = new Set(recentTxs.map(tx => tx.device_id)).size;
      const uniqueLocations = new Set(recentTxs.map(tx => tx.location_hash)).size;

      return {
        time_since_last_sec: timeSinceLastSec,
        invoices_last_min: invoicesLastMin,
        device_changes: Math.max(0, uniqueDevices - 1),
        location_changes: Math.max(0, uniqueLocations - 1)
      };

    } catch (error) {
      console.error('Failed to get user transaction history:', error);
      return {
        time_since_last_sec: 0,
        invoices_last_min: 0,
        device_changes: 0,
        location_changes: 0
      };
    }
  }

  async handleFraudAlert(transactionData, txFeatures, fraudResult) {
    try {
      // Create fraud alert
      await FraudDetectionService.createFraudAlert(
        transactionData.user_id,
        txFeatures,
        fraudResult
      );

      // Send immediate notification to user
      await NotificationService.sendNotification(
        transactionData.user_id,
        'fraud_alert',
        `Suspicious activity detected on your account. Please verify this transaction.`
      );

      // Log for manual review
      console.log(`FRAUD ALERT: User ${transactionData.user_id}, Score: ${fraudResult.score}, Reason: ${fraudResult.reason}`);

      // Optional: Hold transaction for manual review
      if (fraudResult.score >= 0.8) {
        await this.holdTransactionForReview(transactionData, fraudResult);
      }

    } catch (error) {
      console.error('Failed to handle fraud alert:', error);
      // Don't fail the job for alert handling errors
    }
  }

  async holdTransactionForReview(transactionData, fraudResult) {
    try {
      // Mark transaction as pending review
      await db('payments')
        .where({ payment_hash: transactionData.payment_hash })
        .update({
          status: 'pending_review',
          review_reason: 'fraud_detection',
          review_data: JSON.stringify(fraudResult),
          updated_at: db.fn.now()
        });

      console.log(`Transaction ${transactionData.payment_hash} held for review`);

    } catch (error) {
      console.error('Failed to hold transaction for review:', error);
    }
  }

  setupEventHandlers() {
    this.worker.on('completed', (job) => {
      const result = job.returnvalue;
      console.log(`Fraud worker completed job ${job.id}: alert=${result.alert}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Fraud worker failed job ${job?.id}:`, err.message);
    });

    this.worker.on('error', (err) => {
      console.error('Fraud worker error:', err);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Fraud worker job ${jobId} stalled`);
    });
  }

  async close() {
    await this.worker.close();
    console.log('Fraud worker closed');
  }
}

// Create and export worker instance
const fraudWorker = new FraudWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down fraud worker...');
  await fraudWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down fraud worker...');
  await fraudWorker.close();
  process.exit(0);
});

module.exports = fraudWorker;
