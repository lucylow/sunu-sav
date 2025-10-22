const { Worker } = require('bullmq');
const { redisConnection } = require('./payoutProducer');
const dbManager = require('../database');
const LightningService = require('../LightningService');
const NotificationService = require('../NotificationService');

/**
 * Payout worker for processing Lightning payments
 * Handles the actual payment execution with retry logic and error handling
 */
class PayoutWorker {
  constructor() {
    this.db = dbManager.getDb();
    this.lightningService = new LightningService();
    this.notificationService = new NotificationService();
    this.worker = null;
  }

  /**
   * Start the payout worker
   * @param {number} concurrency - Number of concurrent jobs to process
   */
  start(concurrency = 2) {
    this.worker = new Worker('payouts', this.processPayoutJob.bind(this), {
      connection: redisConnection,
      concurrency: concurrency,
      removeOnComplete: 10,
      removeOnFail: 50
    });

    // Set up event handlers
    this.worker.on('completed', (job) => {
      console.log(`✅ Payout job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Payout job ${job.id} failed:`, err.message);
      
      // Alert administrators on final failure
      if (job.attemptsMade >= job.opts.attempts) {
        this.alertAdministrators(job, err);
      }
    });

    this.worker.on('error', (err) => {
      console.error('❌ Payout worker error:', err);
    });

    console.log(`🚀 Payout worker started with concurrency: ${concurrency}`);
    return this.worker;
  }

  /**
   * Process a payout job
   * @param {Job} job - BullMQ job instance
   * @returns {Promise<Object>} - Job result
   */
  async processPayoutJob(job) {
    const { payoutId, groupId, cycleNumber } = job.data;
    console.log(`Processing payout job ${job.id} for group ${groupId}, cycle ${cycleNumber}`);

    const client = await this.db.transaction();
    
    try {
      await client.query('BEGIN');

      // Acquire advisory lock per group for safety inside worker
      await client.query('SELECT pg_advisory_xact_lock(hashtext(?))', [groupId]);

      // Fetch payment_attempt row and lock it to ensure single processing
      const res = await client.query(
        'SELECT * FROM payment_attempts WHERE id = $1 FOR UPDATE', 
        [payoutId]
      );
      
      if (res.rowCount === 0) {
        console.warn('Payment attempt not found, skipping', payoutId);
        await client.query('COMMIT');
        return { success: false, reason: 'not_found' };
      }
      
      const attempt = res.rows[0];
      
      if (attempt.status === 'success') {
        console.info('Already completed attempt', payoutId);
        await client.query('COMMIT');
        return { success: true, reason: 'already_completed' };
      }

      if (attempt.status === 'failed' && attempt.lnd_attempts >= 5) {
        console.warn('Attempt exceeded max retries, skipping', payoutId);
        await client.query('COMMIT');
        return { success: false, reason: 'max_retries_exceeded' };
      }

      // Get group and payout details
      const groupRes = await client.query(
        'SELECT * FROM tontine_groups WHERE id = $1',
        [groupId]
      );
      
      if (groupRes.rowCount === 0) {
        throw new Error('Group not found');
      }
      
      const group = groupRes.rows[0];

      // Get payout details
      const payoutRes = await client.query(
        'SELECT * FROM payouts WHERE group_id = $1 AND cycle_number = $2',
        [groupId, cycleNumber]
      );
      
      if (payoutRes.rowCount === 0) {
        throw new Error('Payout record not found');
      }
      
      const payout = payoutRes.rows[0];

      // Get winner's Lightning address
      const winnerRes = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [payout.winner_user_id]
      );
      
      if (winnerRes.rowCount === 0) {
        throw new Error('Winner user not found');
      }
      
      const winner = winnerRes.rows[0];

      // Update attempt status to processing
      await client.query(
        'UPDATE payment_attempts SET status = $1, lnd_attempts = lnd_attempts + 1, updated_at = now() WHERE id = $2',
        ['processing', payoutId]
      );

      // Create Lightning invoice for winner (in real implementation)
      // For now, we'll simulate the payment
      const mockInvoice = `mock_invoice_from_${winner.phone_number}_${payoutId}`;
      
      // Attempt to pay the invoice
      const paymentResult = await this.lightningService.payInvoice(
        mockInvoice,
        payout.amount_sats
      );

      if (!paymentResult.success) {
        // Update attempt with failure
        await client.query(
          'UPDATE payment_attempts SET status = $1, error_message = $2, updated_at = now() WHERE id = $3',
          ['failed', paymentResult.error || 'Payment failed', payoutId]
        );
        
        await client.query('COMMIT');
        
        // Throw error to trigger retry
        throw new Error(`LND payment failed: ${paymentResult.error || 'Unknown error'}`);
      }

      // Payment successful - update all records
      await client.query(
        'UPDATE payment_attempts SET status = $1, preimage = $2, fee_sat = $3, updated_at = now() WHERE id = $4',
        ['success', paymentResult.preimage, paymentResult.fee_sat, payoutId]
      );

      await client.query(
        'UPDATE payouts SET status = $1, paid_at = now(), payment_hash = $2 WHERE id = $3',
        ['paid', paymentResult.payment_hash, payout.id]
      );

      await client.query('COMMIT');

      // Send notification to winner
      await this.notificationService.sendPayoutNotification(
        groupId,
        payout.winner_user_id,
        payout.amount_sats,
        cycleNumber
      );

      console.log(`✅ Successfully processed payout ${payoutId} for group ${groupId}`);

      return { 
        success: true, 
        payoutId,
        preimage: paymentResult.preimage,
        fee: paymentResult.fee_sat,
        amount: payout.amount_sats
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Payout worker failed for job ${job.id}:`, error);
      
      // Update attempt status to failed
      try {
        await client.query(
          'UPDATE payment_attempts SET status = $1, error_message = $2, updated_at = now() WHERE id = $3',
          ['failed', error.message, payoutId]
        );
      } catch (updateError) {
        console.error('Failed to update payment attempt status:', updateError);
      }
      
      throw error; // Re-throw to trigger retry
    } finally {
      client.release();
    }
  }

  /**
   * Alert administrators about failed payout
   * @param {Job} job - Failed job
   * @param {Error} error - Error that caused failure
   */
  async alertAdministrators(job, error) {
    try {
      console.error(`🚨 CRITICAL: Payout job ${job.id} failed after ${job.attemptsMade} attempts:`, error.message);
      
      // In production, you would:
      // 1. Send email/SMS to administrators
      // 2. Create incident ticket
      // 3. Log to monitoring system
      // 4. Trigger manual intervention workflow
      
      // For now, just log the critical error
      const criticalError = {
        type: 'PAYOUT_FAILURE',
        jobId: job.id,
        attempts: job.attemptsMade,
        error: error.message,
        data: job.data,
        timestamp: new Date().toISOString()
      };
      
      console.error('CRITICAL PAYOUT FAILURE:', JSON.stringify(criticalError, null, 2));
      
    } catch (alertError) {
      console.error('Failed to send administrator alert:', alertError);
    }
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (this.worker) {
      await this.worker.close();
      console.log('Payout worker stopped');
    }
  }
}

module.exports = PayoutWorker;
