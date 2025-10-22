// server/services/CreditAIService.js
const axios = require('axios');
const debugFactory = require('debug');
const debug = debugFactory('sunu:credit');

const AI_CREDIT_URL = process.env.AI_CREDIT_URL || 'http://localhost:8001';
const AI_INTERNAL_TOKEN = process.env.AI_INTERNAL_TOKEN || 'devtoken';

class CreditAIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_CREDIT_URL,
      timeout: 5000,
      headers: { 'X-Internal-Token': AI_INTERNAL_TOKEN }
    });
  }

  /**
   * Predict credit score based on user features
   * features should include:
   *   user_id, tontine_contributions, punctuality_rate, contributions_count,
   *   mobile_tx_volume, avg_payment_delay_days, community_endorsements
   */
  async predict(features) {
    try {
      debug('Predicting credit score for features:', features);
      
      // If AI service is not available, use mock scoring
      if (!process.env.AI_CREDIT_URL) {
        return this.mockCreditScoring(features);
      }

      const response = await this.client.post('/predict', features);
      debug('Credit score prediction result:', response.data);
      return response.data.score || response.data;
    } catch (error) {
      debug('CreditAI API error:', error.message || error);
      
      // Fallback to mock scoring if AI service fails
      console.warn('AI credit service unavailable, using mock scoring');
      return this.mockCreditScoring(features);
    }
  }

  /**
   * Mock credit scoring for demo purposes
   * Uses simple heuristics to calculate credit score
   */
  mockCreditScoring(features) {
    const {
      tontine_contributions = 0,
      punctuality_rate = 0,
      contributions_count = 0,
      mobile_tx_volume = 0,
      avg_payment_delay_days = 0,
      community_endorsements = 0
    } = features;

    let score = 0.5; // Start with neutral score

    // Reward consistent contributions
    if (contributions_count > 10) score += 0.1;
    if (contributions_count > 50) score += 0.1;

    // Reward punctuality
    if (punctuality_rate > 0.8) score += 0.2;
    if (punctuality_rate > 0.95) score += 0.1;

    // Reward large contribution amounts
    if (tontine_contributions > 100000) score += 0.1;
    if (tontine_contributions > 500000) score += 0.1;

    // Reward community endorsements
    if (community_endorsements > 3) score += 0.1;
    if (community_endorsements > 10) score += 0.1;

    // Penalize payment delays
    if (avg_payment_delay_days > 7) score -= 0.2;
    if (avg_payment_delay_days > 30) score -= 0.2;

    // Reward mobile transaction volume (shows financial activity)
    if (mobile_tx_volume > 100000) score += 0.1;

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    debug('Mock credit scoring result:', score);
    return score;
  }

  /**
   * Get credit score explanation
   */
  async getScoreExplanation(userId, score) {
    try {
      if (!process.env.AI_CREDIT_URL) {
        return this.mockScoreExplanation(score);
      }

      const response = await this.client.post('/explain', { userId, score });
      return response.data;
    } catch (error) {
      debug('Failed to get score explanation:', error.message);
      return this.mockScoreExplanation(score);
    }
  }

  /**
   * Mock score explanation for demo
   */
  mockScoreExplanation(score) {
    if (score >= 0.8) {
      return {
        level: 'excellent',
        message: 'Excellent credit profile! You have consistent contributions and high punctuality.',
        factors: ['Consistent contributions', 'High punctuality', 'Community endorsements']
      };
    } else if (score >= 0.6) {
      return {
        level: 'good',
        message: 'Good credit profile. Keep up the consistent contributions!',
        factors: ['Regular contributions', 'Good punctuality']
      };
    } else if (score >= 0.4) {
      return {
        level: 'fair',
        message: 'Fair credit profile. Try to improve punctuality and consistency.',
        factors: ['Some delays in payments', 'Inconsistent contributions']
      };
    } else {
      return {
        level: 'poor',
        message: 'Credit profile needs improvement. Focus on timely contributions.',
        factors: ['Frequent delays', 'Inconsistent participation']
      };
    }
  }
}

module.exports = new CreditAIService();
