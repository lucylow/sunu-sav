// server/services/FraudService.js
const axios = require('axios');
const debugFactory = require('debug');
const debug = debugFactory('sunu:fraud');

const AI_FRAUD_URL = process.env.AI_FRAUD_URL || 'http://localhost:8002';
const AI_INTERNAL_TOKEN = process.env.AI_INTERNAL_TOKEN || 'devtoken';

class FraudService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_FRAUD_URL,
      timeout: 4000,
      headers: { 'X-Internal-Token': AI_INTERNAL_TOKEN }
    });
  }

  /**
   * Submit transaction features to fraud detection AI microservice
   * txFeatures should be an object with fields:
   *   user_id, amount_sats, time_since_last_sec, invoices_last_min, device_changes, location_changes
   * Returns: { alert: boolean, score: number }
   */
  async checkTransaction(txFeatures) {
    try {
      debug('Checking transaction for fraud:', txFeatures);
      
      // If AI service is not available, use mock detection
      if (!process.env.AI_FRAUD_URL) {
        return this.mockFraudDetection(txFeatures);
      }

      const response = await this.client.post('/check', txFeatures);
      debug('Fraud detection result:', response.data);
      return response.data;
    } catch (error) {
      debug('FraudService API error:', error.message || error);
      
      // Fallback to mock detection if AI service fails
      console.warn('AI fraud service unavailable, using mock detection');
      return this.mockFraudDetection(txFeatures);
    }
  }

  /**
   * Mock fraud detection for demo purposes
   * Flags suspicious patterns based on simple heuristics
   */
  mockFraudDetection(txFeatures) {
    const { amount_sats, time_since_last_sec, invoices_last_min, device_changes, location_changes } = txFeatures;
    
    let score = 0.1; // Start with low risk
    
    // Flag large amounts
    if (amount_sats > 100000) score += 0.3;
    
    // Flag rapid successive transactions
    if (time_since_last_sec < 30) score += 0.4;
    
    // Flag multiple invoices in short time
    if (invoices_last_min > 5) score += 0.3;
    
    // Flag device/location changes
    if (device_changes > 2) score += 0.2;
    if (location_changes > 1) score += 0.2;
    
    const alert = score > 0.6;
    
    debug('Mock fraud detection result:', { alert, score });
    return { alert, score };
  }

  /**
   * Get fraud risk profile for a user
   */
  async getUserRiskProfile(userId) {
    try {
      if (!process.env.AI_FRAUD_URL) {
        return { risk_level: 'low', score: 0.2 };
      }

      const response = await this.client.get(`/user/${userId}/risk`);
      return response.data;
    } catch (error) {
      debug('Failed to get user risk profile:', error.message);
      return { risk_level: 'unknown', score: 0.5 };
    }
  }
}

module.exports = new FraudService();
