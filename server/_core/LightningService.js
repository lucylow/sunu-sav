const crypto = require('crypto');

class LightningService {
  constructor() {
    // In a real implementation, this would connect to a Lightning node
    // For now, we'll simulate Lightning operations
    this.mockInvoices = new Map();
    this.mockPayments = new Map();
  }

  async createInvoice(amountSats, memo = '') {
    try {
      // Generate mock Lightning invoice
      const paymentHash = crypto.randomBytes(32).toString('hex');
      const paymentRequest = this.generateMockPaymentRequest(amountSats, memo);
      
      // Store invoice for later verification
      this.mockInvoices.set(paymentHash, {
        payment_hash: paymentHash,
        payment_request: paymentRequest,
        amount_sats: amountSats,
        memo: memo,
        status: 'pending',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 3600 * 1000) // 1 hour
      });

      console.log(`⚡ Created Lightning invoice: ${amountSats} sats - ${memo}`);

      return {
        payment_hash: paymentHash,
        payment_request: paymentRequest,
        amount_sats: amountSats,
        memo: memo,
        expires_at: new Date(Date.now() + 3600 * 1000)
      };
    } catch (error) {
      console.error('Failed to create Lightning invoice:', error);
      throw error;
    }
  }

  async checkInvoiceStatus(paymentHash) {
    try {
      const invoice = this.mockInvoices.get(paymentHash);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Simulate payment settlement after some time
      if (invoice.status === 'pending' && Date.now() - invoice.created_at.getTime() > 5000) {
        invoice.status = 'settled';
        invoice.settled_at = new Date();
        
        console.log(`⚡ Invoice ${paymentHash} settled`);
      }

      return {
        payment_hash: paymentHash,
        status: invoice.status,
        settled: invoice.status === 'settled',
        amount_sats: invoice.amount_sats,
        settled_at: invoice.settled_at
      };
    } catch (error) {
      console.error('Failed to check invoice status:', error);
      throw error;
    }
  }

  async payInvoice(paymentRequest, amountSats) {
    try {
      // Generate mock payment hash
      const paymentHash = crypto.randomBytes(32).toString('hex');
      
      // Store payment for tracking
      this.mockPayments.set(paymentHash, {
        payment_hash: paymentHash,
        payment_request: paymentRequest,
        amount_sats: amountSats,
        status: 'completed',
        created_at: new Date(),
        completed_at: new Date()
      });

      console.log(`⚡ Lightning payment sent: ${amountSats} sats`);

      return {
        payment_hash: paymentHash,
        status: 'completed',
        amount_sats: amountSats,
        completed_at: new Date()
      };
    } catch (error) {
      console.error('Failed to pay Lightning invoice:', error);
      throw error;
    }
  }

  async getNodeInfo() {
    try {
      // Mock node information
      return {
        node_id: 'mock_node_id_123456789',
        alias: 'SunuSàv Lightning Node',
        color: '#ff6600',
        num_channels: 42,
        num_peers: 15,
        total_capacity_sats: 10000000,
        version: 'v0.15.0'
      };
    } catch (error) {
      console.error('Failed to get node info:', error);
      throw error;
    }
  }

  async getChannelBalance() {
    try {
      // Mock channel balance
      return {
        total_balance_sats: 5000000,
        available_balance_sats: 4500000,
        pending_balance_sats: 500000,
        channels: [
          {
            channel_id: 'mock_channel_1',
            remote_pubkey: 'remote_node_1',
            capacity_sats: 2000000,
            local_balance_sats: 1000000,
            remote_balance_sats: 1000000,
            active: true
          },
          {
            channel_id: 'mock_channel_2',
            remote_pubkey: 'remote_node_2',
            capacity_sats: 3000000,
            local_balance_sats: 2000000,
            remote_balance_sats: 1000000,
            active: true
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get channel balance:', error);
      throw error;
    }
  }

  async estimateFee(paymentRequest, amountSats) {
    try {
      // Mock fee estimation
      const baseFee = 1; // 1 sat base fee
      const feeRate = 0.0001; // 0.01% fee rate
      const estimatedFee = Math.max(baseFee, Math.floor(amountSats * feeRate));
      
      return {
        fee_sats: estimatedFee,
        total_amount_sats: amountSats + estimatedFee,
        fee_rate_percent: (estimatedFee / amountSats) * 100
      };
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      throw error;
    }
  }

  generateMockPaymentRequest(amountSats, memo) {
    // Generate a mock Lightning payment request
    const timestamp = Math.floor(Date.now() / 1000);
    const mockData = {
      amount: amountSats,
      memo: memo,
      timestamp: timestamp
    };
    
    // Create a base64 encoded mock payment request
    const encodedData = Buffer.from(JSON.stringify(mockData)).toString('base64');
    return `lnbc${amountSats}u1p${encodedData}pp5mock_payment_request_${crypto.randomBytes(8).toString('hex')}`;
  }

  async validatePaymentRequest(paymentRequest) {
    try {
      // Basic validation of Lightning payment request format
      if (!paymentRequest.startsWith('lnbc')) {
        throw new Error('Invalid Lightning payment request format');
      }

      // Extract amount from payment request
      const amountMatch = paymentRequest.match(/lnbc(\d+)/);
      if (!amountMatch) {
        throw new Error('Could not extract amount from payment request');
      }

      const amountSats = parseInt(amountMatch[1]);

      return {
        valid: true,
        amount_sats: amountSats,
        payment_request: paymentRequest
      };
    } catch (error) {
      console.error('Failed to validate payment request:', error);
      throw error;
    }
  }

  async getPaymentHistory(limit = 50, offset = 0) {
    try {
      // Mock payment history
      const payments = Array.from(this.mockPayments.values())
        .sort((a, b) => b.created_at - a.created_at)
        .slice(offset, offset + limit);

      return {
        payments: payments,
        total: this.mockPayments.size,
        limit: limit,
        offset: offset
      };
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  }

  async getInvoiceHistory(limit = 50, offset = 0) {
    try {
      // Mock invoice history
      const invoices = Array.from(this.mockInvoices.values())
        .sort((a, b) => b.created_at - a.created_at)
        .slice(offset, offset + limit);

      return {
        invoices: invoices,
        total: this.mockInvoices.size,
        limit: limit,
        offset: offset
      };
    } catch (error) {
      console.error('Failed to get invoice history:', error);
      throw error;
    }
  }

  // Webhook handler for Lightning node events
  async handleWebhook(webhookData) {
    try {
      const { type, data } = webhookData;

      switch (type) {
        case 'invoice_payment':
          // Handle invoice payment webhook
          await this.processInvoicePayment(data);
          break;
        
        case 'channel_opened':
          // Handle channel opened webhook
          console.log('⚡ Channel opened:', data);
          break;
        
        case 'channel_closed':
          // Handle channel closed webhook
          console.log('⚡ Channel closed:', data);
          break;
        
        default:
          console.log('⚡ Unknown webhook type:', type);
      }

      return { received: true };
    } catch (error) {
      console.error('Failed to handle Lightning webhook:', error);
      throw error;
    }
  }

  async processInvoicePayment(paymentData) {
    try {
      const { payment_hash, amount_sats } = paymentData;
      
      // Update invoice status
      const invoice = this.mockInvoices.get(payment_hash);
      if (invoice) {
        invoice.status = 'settled';
        invoice.settled_at = new Date();
        invoice.amount_paid_sats = amount_sats;
        
        console.log(`⚡ Invoice ${payment_hash} paid: ${amount_sats} sats`);
      }

      // Trigger payment processing in TontineService
      const TontineService = require('./TontineService');
      const tontineService = new TontineService();
      
      await tontineService.processPayment(payment_hash);

    } catch (error) {
      console.error('Failed to process invoice payment:', error);
      throw error;
    }
  }
}

module.exports = LightningService;
