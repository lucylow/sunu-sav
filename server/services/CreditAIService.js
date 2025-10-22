// server/services/CreditAIService.js
const axios = require('axios');
const db = require('../_core/database'); // your DB helper

const AI_CREDIT_URL = process.env.AI_CREDIT_URL || 'http://ai-credit:8001';
const AI_INTERNAL_TOKEN = process.env.AI_INTERNAL_TOKEN || 'devtoken';

class CreditAIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_CREDIT_URL,
      timeout: 10000,
      headers: { 
        'X-Internal-Token': AI_INTERNAL_TOKEN,
        'Content-Type': 'application/json'
      }
    });
  }

  async predict(userFeatures) {
    try {
      const response = await this.client.post('/predict', userFeatures);
      return response.data;
    } catch (error) {
      console.error('Credit AI prediction failed:', error.message);
      throw new Error(`Credit AI service error: ${error.message}`);
    }
  }

  async batchPredict(featuresList) {
    try {
      const response = await this.client.post('/batch-predict', featuresList);
      return response.data.results;
    } catch (error) {
      console.error('Credit AI batch prediction failed:', error.message);
      throw new Error(`Credit AI batch service error: ${error.message}`);
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Credit AI health check failed:', error.message);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Persist score in DB
  async saveScore(userId, score, confidence, modelVersion) {
    try {
      await db.transaction(async (trx) => {
        // Update user credit score
        await trx('users')
          .where({ id: userId })
          .update({ 
            credit_score: score, 
            credit_score_updated_at: trx.fn.now() 
          });

        // Record metric for audit
        await trx('ai_metrics').insert({
          user_id: userId,
          metric_key: 'credit_score',
          metric_value: score,
          meta: JSON.stringify({ 
            confidence, 
            model_version: modelVersion,
            timestamp: new Date().toISOString()
          }),
          created_at: trx.fn.now()
        });
      });
      
      console.log(`Credit score saved for user ${userId}: ${score}`);
    } catch (error) {
      console.error('Failed to save credit score:', error);
      throw error;
    }
  }

  // Create credit offer alert
  async createCreditAlert(userId, score, loanAmount) {
    try {
      await db('ai_alerts').insert({
        user_id: userId,
        alert_type: 'credit_offer',
        payload: JSON.stringify({
          score,
          loan_amount_xof: loanAmount,
          created_at: new Date().toISOString()
        }),
        created_at: db.fn.now()
      });
      
      console.log(`Credit alert created for user ${userId}`);
    } catch (error) {
      console.error('Failed to create credit alert:', error);
      throw error;
    }
  }

  // Get user's credit score from DB
  async getCreditScore(userId) {
    try {
      const user = await db('users')
        .select('credit_score', 'credit_score_updated_at')
        .where({ id: userId })
        .first();
      
      return user;
    } catch (error) {
      console.error('Failed to get credit score:', error);
      throw error;
    }
  }

  // Get credit score history
  async getCreditScoreHistory(userId, limit = 10) {
    try {
      const history = await db('ai_metrics')
        .where({ user_id: userId, metric_key: 'credit_score' })
        .orderBy('created_at', 'desc')
        .limit(limit);
      
      return history;
    } catch (error) {
      console.error('Failed to get credit score history:', error);
      throw error;
    }
  }
}

module.exports = new CreditAIService();
