// backend/services/SenegalTontineService.js
const TontineService = require('./TontineService');
const WaveMobileMoneyService = require('./WaveMobileMoneyService');
const USSDService = require('./USSDService');

class SenegalTontineService extends TontineService {
  constructor() {
    super();
    this.waveService = new WaveMobileMoneyService();
    this.ussdService = new USSDService();
    this.senegaleseHolidays = this.getSenegalHolidays();
    this.i18n = require('../middleware/languageMiddleware').i18n;
  }

  /**
   * Process payout with Wave mobile money integration
   * Overrides base method for Senegal-specific cash-out
   */
  async processPayout(payout, trx) {
    try {
      console.log(`Processing Senegal payout for cycle ${payout.cycle_number}`);
      
      // Get winner's phone number for Wave disbursement
      const winner = await trx('users')
        .where({ id: payout.winner_user_id })
        .first();

      if (!winner) {
        throw new Error(`Winner not found: ${payout.winner_user_id}`);
      }

      // Validate Senegal phone number
      if (!this.waveService.validateSenegalPhoneNumber(winner.phone_number)) {
        throw new Error(`Invalid Senegal phone number: ${winner.phone_number}`);
      }

      // Convert Bitcoin sats to XOF for local spending
      const amountXof = await this.waveService.convertSatsToXof(payout.amount_sats);
      
      console.log(`Converting ${payout.amount_sats} sats to ${amountXof} XOF`);
      
      // Cash-out to winner's Wave account
      const waveResult = await this.waveService.cashOutToWave(
        winner.phone_number,
        amountXof,
        `SunuSav_Tontine_Cycle_${payout.cycle_number}_${Date.now()}`
      );

      // Update payout record with Wave transaction ID
      await trx('payouts')
        .where({ id: payout.id })
        .update({
          status: 'paid',
          paid_at: new Date(),
          payment_hash: waveResult.wave_transaction_id,
          local_currency_amount: amountXof,
          exchange_rate_used: await this.waveService.getBitcoinToXofRate(),
          payment_method: 'wave_mobile_money',
          wave_transaction_id: waveResult.wave_transaction_id
        });

      // Send confirmation via SMS in user's preferred language
      await this.sendPayoutConfirmation(winner, amountXof, payout.amount_sats);

      // Update community fund with fee portion
      await this.updateCommunityFund(payout.amount_sats, trx);

      console.log(`Payout successful: ${amountXof} XOF via Wave (${waveResult.wave_transaction_id})`);

      return {
        success: true,
        payout_amount_sats: payout.amount_sats,
        disbursed_amount_xof: amountXof,
        wave_transaction_id: waveResult.wave_transaction_id,
        winner_phone: winner.phone_number,
        payment_method: 'wave_mobile_money'
      };

    } catch (error) {
      console.error('Senegal payout processing failed:', error);
      
      // Fallback: Keep funds in winner's Lightning wallet for later cash-out
      await trx('payouts')
        .where({ id: payout.id })
        .update({
          status: 'failed',
          error_message: error.message,
          fallback_method: 'lightning_wallet'
        });

      // Alert administrators for manual intervention
      await this.alertAdminPayoutFailed(payout, error);
      
      throw error;
    }
  }

  /**
   * Check if a date falls during Senegalese holidays or weekends
   * Avoids scheduling payouts when users can't access funds
   */
  isBusinessDayInSenegal(date) {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun-Sat
    const isHoliday = this.senegaleseHolidays.some(holiday => 
      holiday.date === date.toISOString().split('T')[0]
    );
    
    return !isWeekend && !isHoliday;
  }

  /**
   * Schedule payout considering Senegal business days
   */
  async schedulePayout(groupId, cycleNumber) {
    const payoutDate = new Date();
    
    // Find next business day in Senegal
    while (!this.isBusinessDayInSenegal(payoutDate)) {
      payoutDate.setDate(payoutDate.getDate() + 1);
    }
    
    console.log(`Scheduling payout for ${payoutDate.toISOString().split('T')[0]} (Senegal business day)`);
    
    // Schedule payout through monetization service
    const monetizationUrl = process.env.MONETIZATION_API_URL || 'http://localhost:8001';
    
    try {
      const response = await fetch(`${monetizationUrl}/monetization/payouts/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle_id: `${groupId}_cycle_${cycleNumber}`,
          group_verified: false, // Would check group verification status
          user_recurring: false  // Would check user subscription status
        })
      });
      
      const result = await response.json();
      console.log(`Payout scheduled: ${result.task_id}`);
      
      return result;
      
    } catch (error) {
      console.error('Failed to schedule payout:', error);
      throw error;
    }
  }

  /**
   * Key Senegalese holidays that affect financial activities
   */
  getSenegalHolidays() {
    return [
      { date: '2025-01-01', name: 'Jour de l\'An' },
      { date: '2025-04-07', name: 'Korité (Eid al-Fitr)' },
      { date: '2025-04-04', name: 'Fête de l\'Indépendance' },
      { date: '2025-05-01', name: 'Fête du Travail' },
      { date: '2025-06-04', name: 'Tabaski (Eid al-Adha)' },
      { date: '2025-08-15', name: 'Assomption' },
      { date: '2025-08-19', name: 'Tamkharit (Nouvel An musulman)' },
      { date: '2025-11-01', name: 'Toussaint' },
      { date: '2025-12-25', name: 'Noël' }
    ];
  }

  /**
   * Send payout confirmation via SMS in user's language
   */
  async sendPayoutConfirmation(user, amountXof, amountSats) {
    try {
      const message = this.i18n.__({
        phrase: 'payout_success', 
        locale: user.language || 'fr'
      }, { amount: amountXof.toLocaleString() });

      // Add Wave transaction details
      const fullMessage = `${message}\n\nDétails:\n- Montant: ${amountXof.toLocaleString()} XOF\n- Bitcoin: ${amountSats} sats\n- Méthode: Wave Mobile Money\n\nSunuSàv Tontine`;

      // Integrate with local SMS gateway (Orange, Free)
      await this.sendSMS(user.phone_number, fullMessage);
      
      // Also send in-app notification
      await this.sendInAppNotification(user.id, {
        type: 'PAYOUT_RECEIVED',
        amount_xof: amountXof,
        amount_sats: amountSats,
        payment_method: 'wave_mobile_money',
        timestamp: new Date()
      });

      console.log(`Payout confirmation sent to ${user.phone_number}`);
      
    } catch (error) {
      console.error('Failed to send payout confirmation:', error);
    }
  }

  /**
   * Send SMS via local gateway
   */
  async sendSMS(phoneNumber, message) {
    try {
      // Mock SMS implementation
      // In production, integrate with Orange SMS API or similar
      console.log(`SMS to ${phoneNumber}: ${message}`);
      
      // Simulate SMS sending
      return { success: true, messageId: `sms_${Date.now()}` };
      
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId, notification) {
    try {
      // Mock notification implementation
      // In production, use push notification service
      console.log(`In-app notification for user ${userId}:`, notification);
      
      return { success: true };
      
    } catch (error) {
      console.error('In-app notification failed:', error);
    }
  }

  /**
   * Update community fund with fee portion
   */
  async updateCommunityFund(payoutAmount, trx) {
    try {
      // Calculate community fund portion (20% of 1% fee)
      const feeRate = 0.01; // 1% base fee
      const communityShare = 0.20; // 20% of fee goes to community
      const communityAmount = Math.floor(payoutAmount * feeRate * communityShare);
      
      // Update community fund
      await trx('community_fund')
        .where({ id: 'main_fund' })
        .increment('total_sats', communityAmount);
      
      console.log(`Community fund updated: +${communityAmount} sats`);
      
    } catch (error) {
      console.error('Failed to update community fund:', error);
    }
  }

  /**
   * Alert administrators for failed payouts
   */
  async alertAdminPayoutFailed(payout, error) {
    try {
      const alertMessage = `ALERT: Payout failed for cycle ${payout.cycle_number}\n` +
        `Group: ${payout.group_id}\n` +
        `Amount: ${payout.amount_sats} sats\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toISOString()}`;
      
      // Send alert to admin team
      console.log('ADMIN ALERT:', alertMessage);
      
      // In production, send to admin notification system
      
    } catch (alertError) {
      console.error('Failed to send admin alert:', alertError);
    }
  }

  /**
   * Get Senegal-specific tontine statistics
   */
  async getSenegalStats() {
    try {
      const stats = await this.getStats();
      
      // Add Senegal-specific metrics
      const senegalStats = {
        ...stats,
        senegal_specific: {
          wave_integration_active: true,
          ussd_sessions_active: this.ussdService.getStats().activeSessions,
          supported_languages: ['fr', 'wo', 'en'],
          business_days_this_month: this.getBusinessDaysThisMonth(),
          upcoming_holidays: this.getUpcomingHolidays(),
          wave_transaction_success_rate: await this.getWaveSuccessRate()
        }
      };
      
      return senegalStats;
      
    } catch (error) {
      console.error('Failed to get Senegal stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Get business days in current month
   */
  getBusinessDaysThisMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let businessDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (this.isBusinessDayInSenegal(date)) {
        businessDays++;
      }
    }
    
    return businessDays;
  }

  /**
   * Get upcoming holidays
   */
  getUpcomingHolidays() {
    const now = new Date();
    return this.senegaleseHolidays.filter(holiday => 
      new Date(holiday.date) > now
    ).slice(0, 3); // Next 3 holidays
  }

  /**
   * Get Wave transaction success rate
   */
  async getWaveSuccessRate() {
    try {
      // Mock implementation - would calculate from actual transaction data
      return 0.95; // 95% success rate
    } catch (error) {
      return 0;
    }
  }

  /**
   * Handle USSD requests
   */
  async handleUSSDRequest(phoneNumber, userInput, sessionId) {
    return await this.ussdService.handleUSSDRequest(phoneNumber, userInput, sessionId);
  }

  /**
   * Get Wave service features
   */
  getWaveFeatures() {
    return this.waveService.getSupportedFeatures();
  }
}

module.exports = SenegalTontineService;
