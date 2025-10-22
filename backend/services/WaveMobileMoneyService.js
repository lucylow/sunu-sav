const crypto = require('crypto');
const axios = require('axios');

class WaveMobileMoneyService {
  constructor() {
    // Wave API credentials from environment
    this.apiKey = process.env.WAVE_API_KEY;
    this.secretKey = process.env.WAVE_SECRET_KEY;
    this.baseUrl = process.env.WAVE_BASE_URL || 'https://api.wave.com/v1';
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Cash-out from Lightning wallet to Wave mobile money
   * This allows winners to instantly receive funds in their familiar Wave wallet
   */
  async cashOutToWave(phoneNumber, amountXof, paymentReference) {
    const endpoint = `${this.baseUrl}/disbursements`;
    
    // Wave API expects XOF currency (Senegal's CFA franc)
    const requestBody = {
      recipient_phone_number: this.formatSenegalPhoneNumber(phoneNumber),
      amount: amountXof,
      currency: 'XOF',
      reference: paymentReference,
      timestamp: new Date().toISOString(),
      description: `SunuSàv Tontine Payout - ${paymentReference}`
    };

    // Generate Wave-specific security signature
    const signature = this.generateSignature(requestBody);
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Wave-Signature': signature,
      'Content-Type': 'application/json',
      'User-Agent': 'SunuSav-Tontine/1.0'
    };

    try {
      console.log(`Processing Wave cash-out: ${amountXof} XOF to ${phoneNumber}`);
      
      const response = await axios.post(endpoint, requestBody, {
        headers,
        timeout: this.timeout
      });

      if (response.status !== 200) {
        throw new Error(`Wave API error: ${response.statusText}`);
      }

      const result = response.data;
      
      // Audit the cash-out for transparency
      await this.auditCashOut(phoneNumber, amountXof, result.transaction_id);
      
      console.log(`Wave cash-out successful: ${result.transaction_id}`);
      
      return {
        success: true,
        wave_transaction_id: result.transaction_id,
        recipient_phone: phoneNumber,
        amount_xof: amountXof,
        timestamp: new Date(),
        status: result.status || 'completed'
      };

    } catch (error) {
      console.error('Wave cash-out failed:', error.message);
      
      // Implement retry logic for failed cash-outs
      await this.handleFailedCashOut(phoneNumber, amountXof, paymentReference);
      throw new Error(`Failed to process Wave payment: ${error.message}`);
    }
  }

  /**
   * Format Senegalese phone numbers for Wave API (e.g., +221701234567 -> 701234567)
   */
  formatSenegalPhoneNumber(phoneNumber) {
    // Remove spaces and +221 country code, keep only the national number
    let formatted = phoneNumber.replace(/\+221|\s+/g, '');
    
    // Ensure it starts with 7 (Senegal mobile numbers)
    if (!formatted.startsWith('7')) {
      throw new Error(`Invalid Senegal phone number: ${phoneNumber}`);
    }
    
    return formatted;
  }

  /**
   * Generate Wave API security signature
   */
  generateSignature(requestBody) {
    const message = JSON.stringify(requestBody) + this.secretKey;
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Convert Bitcoin sats to XOF using real-time rates
   */
  async convertSatsToXof(amountSats) {
    // Get current Bitcoin to XOF exchange rate
    const exchangeRate = await this.getBitcoinToXofRate();
    const amountXof = Math.floor(amountSats * exchangeRate);
    
    // Ensure minimum disbursement amount (500 XOF ~ 2500 sats)
    const minimumXof = 500;
    if (amountXof < minimumXof) {
      throw new Error(`Amount too small for Wave disbursement. Minimum: ${minimumXof} XOF`);
    }
    
    return amountXof;
  }

  /**
   * Get Bitcoin to XOF exchange rate
   * In production, this would fetch from a reliable exchange or oracle
   */
  async getBitcoinToXofRate() {
    try {
      // Try to get rate from monetization service first
      const monetizationUrl = process.env.MONETIZATION_API_URL || 'http://localhost:8001';
      const response = await axios.get(`${monetizationUrl}/monetization/rates/current`, {
        timeout: 5000
      });
      
      if (response.data && response.data.btc_xof_rate) {
        // Convert BTC rate to sats rate
        return response.data.btc_xof_rate / 100000000;
      }
    } catch (error) {
      console.warn('Failed to get rate from monetization service:', error.message);
    }
    
    // Fallback to environment variable or default
    const fallbackRate = parseFloat(process.env.FALLBACK_BTC_XOF_RATE) || 8000000;
    return fallbackRate / 100000000; // Convert BTC rate to sats rate
  }

  /**
   * Check Wave account balance
   */
  async getWaveBalance() {
    const endpoint = `${this.baseUrl}/balance`;
    const signature = this.generateSignature({ timestamp: new Date().toISOString() });
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Wave-Signature': signature,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.get(endpoint, { headers, timeout: this.timeout });
      return response.data;
    } catch (error) {
      console.error('Failed to get Wave balance:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction status from Wave
   */
  async getTransactionStatus(transactionId) {
    const endpoint = `${this.baseUrl}/transactions/${transactionId}`;
    const signature = this.generateSignature({ transaction_id: transactionId });
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Wave-Signature': signature,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.get(endpoint, { headers, timeout: this.timeout });
      return response.data;
    } catch (error) {
      console.error(`Failed to get transaction status for ${transactionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Audit cash-out transaction for transparency
   */
  async auditCashOut(phoneNumber, amountXof, transactionId) {
    try {
      // Log to database for audit trail
      const auditRecord = {
        phone_number: phoneNumber,
        amount_xof: amountXof,
        wave_transaction_id: transactionId,
        timestamp: new Date(),
        service: 'wave',
        status: 'completed'
      };
      
      // In production, save to database
      console.log('Cash-out audit:', auditRecord);
      
    } catch (error) {
      console.error('Failed to audit cash-out:', error.message);
    }
  }

  /**
   * Handle failed cash-out with retry logic
   */
  async handleFailedCashOut(phoneNumber, amountXof, paymentReference) {
    try {
      // Log failed attempt
      const failureRecord = {
        phone_number: phoneNumber,
        amount_xof: amountXof,
        payment_reference: paymentReference,
        timestamp: new Date(),
        service: 'wave',
        status: 'failed',
        retry_count: 0
      };
      
      console.log('Cash-out failure logged:', failureRecord);
      
      // In production, implement retry queue
      // await this.queueRetryCashOut(failureRecord);
      
    } catch (error) {
      console.error('Failed to handle cash-out failure:', error.message);
    }
  }

  /**
   * Validate Senegal phone number format
   */
  validateSenegalPhoneNumber(phoneNumber) {
    // Senegal mobile numbers: +221 followed by 7, 8, or 9 digits
    const senegalRegex = /^\+221[789]\d{8}$/;
    return senegalRegex.test(phoneNumber);
  }

  /**
   * Get supported Wave features
   */
  getSupportedFeatures() {
    return {
      currency: 'XOF',
      country: 'SN',
      min_amount: 500,
      max_amount: 1000000,
      supported_phones: ['Orange', 'Free', 'Expresso'],
      processing_time: 'instant'
    };
  }
}

module.exports = WaveMobileMoneyService;
