// src/lib/webhook-handler.ts
// Webhook handler for Lightning payment confirmations
// Processes incoming webhooks from the Lightning backend

import { apiClient, LightningWebhook } from './api-client';

export interface WebhookEvent {
  type: 'payment_received' | 'payment_sent' | 'invoice_paid' | 'cycle_completed' | 'payout_ready';
  data: any;
  timestamp: number;
  signature?: string;
}

export interface PaymentConfirmation {
  payment_hash: string;
  amount_sats: number;
  group_id: string;
  user_id: string;
  contribution_id: string;
  settled_at: string;
}

export interface CycleCompletion {
  group_id: string;
  cycle_number: number;
  winner_user_id: string;
  total_amount: number;
  completed_at: string;
}

class WebhookHandler {
  private eventListeners: Map<string, Array<(event: WebhookEvent) => void>> = new Map();
  private isListening = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for webhook events from the backend
    if (typeof window !== 'undefined') {
      // In a real implementation, this would use WebSockets or Server-Sent Events
      // For demo purposes, we'll simulate webhook events
      this.simulateWebhookEvents();
    }
  }

  // Register event listener
  on(eventType: string, callback: (event: WebhookEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  // Remove event listener
  off(eventType: string, callback: (event: WebhookEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event: WebhookEvent = {
        type: eventType as any,
        data,
        timestamp: Date.now(),
      };
      
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in webhook listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Process Lightning webhook
  async processLightningWebhook(webhookData: LightningWebhook): Promise<void> {
    try {
      console.log('Processing Lightning webhook:', webhookData);

      // Verify webhook signature (in production)
      // const isValid = await this.verifyWebhookSignature(webhookData);
      // if (!isValid) {
      //   throw new Error('Invalid webhook signature');
      // }

      // Process payment confirmation
      if (webhookData.status === 'settled') {
        await this.handlePaymentConfirmation(webhookData);
      }

      // Process failed payment
      if (webhookData.status === 'failed') {
        await this.handlePaymentFailure(webhookData);
      }

    } catch (error) {
      console.error('Error processing Lightning webhook:', error);
      this.emit('webhook_error', { error: (error as Error).message, webhook: webhookData });
    }
  }

  // Handle payment confirmation
  private async handlePaymentConfirmation(webhookData: LightningWebhook): Promise<void> {
    try {
      // Get contribution details from payment hash
      const contribution = await this.getContributionByPaymentHash(webhookData.payment_hash);
      
      if (!contribution) {
        console.warn('No contribution found for payment hash:', webhookData.payment_hash);
        return;
      }

      // Update contribution status
      const confirmation: PaymentConfirmation = {
        payment_hash: webhookData.payment_hash,
        amount_sats: webhookData.amount_paid_sat,
        group_id: contribution.group_id,
        user_id: contribution.user_id,
        contribution_id: contribution.id,
        settled_at: webhookData.settled_at || new Date().toISOString(),
      };

      // Emit payment received event
      this.emit('payment_received', confirmation);

      // Check if cycle is complete
      await this.checkCycleCompletion(contribution.group_id);

    } catch (error) {
      console.error('Error handling payment confirmation:', error);
    }
  }

  // Handle payment failure
  private async handlePaymentFailure(webhookData: LightningWebhook): Promise<void> {
    try {
      const contribution = await this.getContributionByPaymentHash(webhookData.payment_hash);
      
      if (contribution) {
        this.emit('payment_failed', {
          payment_hash: webhookData.payment_hash,
          contribution_id: contribution.id,
          group_id: contribution.group_id,
          user_id: contribution.user_id,
          error: 'Payment failed on Lightning network',
        });
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Check if tontine cycle is complete
  private async checkCycleCompletion(groupId: string): Promise<void> {
    try {
      const groupStatus = await apiClient.getGroupStatus(groupId);
      
      if (!groupStatus.success || !groupStatus.data) {
        return;
      }

      const { total_contributions, pending_contributions } = groupStatus.data;
      
      // Cycle is complete when all members have contributed
      if (pending_contributions === 0 && total_contributions > 0) {
        await this.processCycleCompletion(groupId);
      }
    } catch (error) {
      console.error('Error checking cycle completion:', error);
    }
  }

  // Process cycle completion
  private async processCycleCompletion(groupId: string): Promise<void> {
    try {
      // Get group details
      const groupResponse = await apiClient.getTontineGroup(groupId);
      if (!groupResponse.success || !groupResponse.data) {
        return;
      }

      const group = groupResponse.data;
      
      // Get all contributions for current cycle
      const contributionsResponse = await apiClient.getContributions(groupId, group.current_cycle);
      if (!contributionsResponse.success || !contributionsResponse.data) {
        return;
      }

      const contributions = contributionsResponse.data;
      const totalAmount = contributions.reduce((sum, c) => sum + c.amount_sats, 0);
      
      // Select winner (random selection)
      const winner = contributions[Math.floor(Math.random() * contributions.length)];
      
      const cycleCompletion: CycleCompletion = {
        group_id: groupId,
        cycle_number: group.current_cycle,
        winner_user_id: winner.user_id,
        total_amount: totalAmount,
        completed_at: new Date().toISOString(),
      };

      // Emit cycle completed event
      this.emit('cycle_completed', cycleCompletion);

      // Generate payout invoice for winner
      await this.generateWinnerPayout(groupId, winner.user_id, totalAmount);

    } catch (error) {
      console.error('Error processing cycle completion:', error);
    }
  }

  // Generate payout invoice for winner
  private async generateWinnerPayout(groupId: string, winnerUserId: string, amountSats: number): Promise<void> {
    try {
      const payoutResponse = await apiClient.generatePayoutInvoice(groupId, amountSats, winnerUserId);
      
      if (payoutResponse.success && payoutResponse.data) {
        this.emit('payout_ready', {
          group_id: groupId,
          winner_user_id: winnerUserId,
          amount_sats: amountSats,
          payout_id: payoutResponse.data.payout_id,
          invoice: payoutResponse.data.invoice,
          method: payoutResponse.data.method,
        });
      }
    } catch (error) {
      console.error('Error generating winner payout:', error);
    }
  }

  // Get contribution by payment hash
  private async getContributionByPaymentHash(paymentHash: string): Promise<any> {
    // In a real implementation, this would query the backend
    // For demo purposes, we'll return mock data
    return {
      id: 'mock-contribution-id',
      group_id: 'mock-group-id',
      user_id: 'mock-user-id',
      amount_sats: 10000,
      payment_hash: paymentHash,
    };
  }

  // Simulate webhook events for demo
  private simulateWebhookEvents(): void {
    // Simulate payment confirmation after 5 seconds
    setTimeout(() => {
      this.emit('payment_received', {
        payment_hash: 'mock-payment-hash',
        amount_sats: 10000,
        group_id: 'mock-group-id',
        user_id: 'mock-user-id',
        contribution_id: 'mock-contribution-id',
        settled_at: new Date().toISOString(),
      });
    }, 5000);

    // Simulate cycle completion after 10 seconds
    setTimeout(() => {
      this.emit('cycle_completed', {
        group_id: 'mock-group-id',
        cycle_number: 1,
        winner_user_id: 'mock-winner-id',
        total_amount: 50000,
        completed_at: new Date().toISOString(),
      });
    }, 10000);
  }

  // Start listening for webhooks
  startListening(): void {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('Webhook handler started listening');
  }

  // Stop listening for webhooks
  stopListening(): void {
    this.isListening = false;
    console.log('Webhook handler stopped listening');
  }
}

// Singleton instance
export const webhookHandler = new WebhookHandler();

// Utility functions for common webhook operations
export const onPaymentReceived = (callback: (confirmation: PaymentConfirmation) => void) => {
  webhookHandler.on('payment_received', (event) => callback(event.data));
};

export const onCycleCompleted = (callback: (completion: CycleCompletion) => void) => {
  webhookHandler.on('cycle_completed', (event) => callback(event.data));
};

export const onPayoutReady = (callback: (payout: any) => void) => {
  webhookHandler.on('payout_ready', (event) => callback(event.data));
};

export const onPaymentFailed = (callback: (failure: any) => void) => {
  webhookHandler.on('payment_failed', (event) => callback(event.data));
};

export default webhookHandler;
