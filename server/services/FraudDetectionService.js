// server/services/FraudDetectionService.js
const axios = require('axios');
const db = require('../_core/database'); // your DB helper

const AI_FRAUD_URL = process.env.AI_FRAUD_URL || 'http://ai-fraud:8002';
const AI_INTERNAL_TOKEN = process.env.AI_INTERNAL_TOKEN || 'devtoken';

class FraudDetectionService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_FRAUD_URL,
      timeout: 8000,
      headers: { 
        'X-Internal-Token': AI_INTERNAL_TOKEN,
        'Content-Type': 'application/json'
      }
    });
  }

  async checkTransaction(txFeatures) {
    try {
      const response = await this.client.post('/check', txFeatures);
      return response.data;
    } catch (error) {
      console.error('Fraud detection failed:', error.message);
      throw new Error(`Fraud detection service error: ${error.message}`);
    }
  }

  async batchCheckTransactions(transactions) {
    try {
      const response = await this.client.post('/batch-check', { transactions });
      return response.data.results;
    } catch (error) {
      console.error('Fraud batch detection failed:', error.message);
      throw new Error(`Fraud batch detection service error: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Fraud AI health check failed:', error.message);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Create fraud alert
  async createFraudAlert(userId, txFeatures, fraudResult) {
    try {
      await db('ai_alerts').insert({
        user_id: userId,
        alert_type: 'fraud_suspect',
        payload: JSON.stringify({
          transaction_features: txFeatures,
          fraud_result: fraudResult,
          created_at: new Date().toISOString()
        }),
        created_at: db.fn.now()
      });
      
      console.log(`Fraud alert created for user ${userId}`);
    } catch (error) {
      console.error('Failed to create fraud alert:', error);
      throw error;
    }
  }

  // Record fraud check metric
  async recordFraudCheck(userId, txFeatures, fraudResult) {
    try {
      await db('ai_metrics').insert({
        user_id: userId,
        metric_key: 'fraud_check',
        metric_value: fraudResult.score,
        meta: JSON.stringify({
          transaction_features: txFeatures,
          fraud_result: fraudResult,
          timestamp: new Date().toISOString()
        }),
        created_at: db.fn.now()
      });
    } catch (error) {
      console.error('Failed to record fraud check:', error);
      throw error;
    }
  }

  // Get fraud alerts for a user
  async getFraudAlerts(userId, limit = 10) {
    try {
      const alerts = await db('ai_alerts')
        .where({ user_id: userId, alert_type: 'fraud_suspect' })
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      return alerts;
    } catch (error) {
      console.error('Failed to get fraud alerts:', error);
      throw error;
    }
  }

  // Resolve fraud alert
  async resolveFraudAlert(alertId, resolution) {
    try {
      await db('ai_alerts')
        .where({ id: alertId })
        .update({
          resolved: true,
          resolved_at: db.fn.now(),
          payload: db.raw(`payload || '{"resolution": "${resolution}"}'::jsonb`)
        });
      
      console.log(`Fraud alert ${alertId} resolved: ${resolution}`);
    } catch (error) {
      console.error('Failed to resolve fraud alert:', error);
      throw error;
    }
  }

  // Get fraud statistics
  async getFraudStats(days = 7) {
    try {
      const stats = await db('ai_alerts')
        .where('alert_type', 'fraud_suspect')
        .andWhere('created_at', '>', db.raw(`now() - interval '${days} days'`))
        .select(
          db.raw('count(*) as total_alerts'),
          db.raw('count(case when resolved = true then 1 end) as resolved_alerts'),
          db.raw('count(case when resolved = false then 1 end) as pending_alerts')
        )
        .first();
      
      return stats;
    } catch (error) {
      console.error('Failed to get fraud stats:', error);
      throw error;
    }
  }

  // Extract transaction features from payment data
  extractTransactionFeatures(paymentData, userHistory = {}) {
    return {
      user_id: paymentData.user_id,
      amount_sats: paymentData.amount_sats || 0,
      time_since_last_sec: userHistory.time_since_last_sec || 0,
      invoices_last_min: userHistory.invoices_last_min || 0,
      device_changes: userHistory.device_changes || 0,
      location_changes: userHistory.location_changes || 0,
      payment_hash: paymentData.payment_hash
    };
  }
}

module.exports = new FraudDetectionService();
