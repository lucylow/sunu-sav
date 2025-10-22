// services/mockLightningService.js
const { v4: uuidv4 } = require('uuid');

class MockLightningService {
  constructor() {
    this.invoices = new Map();
    this.payments = new Map();
    this.balance = 1000000; // Starting balance in sats
  }

  async initialize() {
    console.log('⚡ Mock Lightning Service initialized');
    return true;
  }

  async createInvoice(amountSats, memo = '') {
    const paymentHash = uuidv4().replace(/-/g, '');
    const paymentRequest = `mock_lnbc${amountSats}n1p${paymentHash}`;
    
    const invoice = {
      payment_request: paymentRequest,
      payment_hash: paymentHash,
      amount: amountSats,
      memo,
      expiry: 3600,
      timestamp: new Date(),
      settled: false
    };

    this.invoices.set(paymentHash, invoice);
    
    return {
      payment_request: paymentRequest,
      r_hash: paymentHash,
      expiry: '3600',
      created_at: new Date().toISOString()
    };
  }

  async payInvoice(paymentRequest) {
    const paymentHash = uuidv4().replace(/-/g, '');
    
    const payment = {
      payment_hash: paymentHash,
      payment_request: paymentRequest,
      status: 'succeeded',
      amount: 10000, // Mock amount
      fee_msat: 1000,
      timestamp: new Date()
    };

    this.payments.set(paymentHash, payment);
    this.balance -= 10000;
    
    return payment;
  }

  async checkInvoiceStatus(paymentHash) {
    const invoice = this.invoices.get(paymentHash);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // For demo purposes, auto-settle invoices after 30 seconds
    const shouldSettle = Date.now() - invoice.timestamp.getTime() > 30000;
    
    if (shouldSettle && !invoice.settled) {
      invoice.settled = true;
      invoice.settled_at = new Date();
      this.balance += invoice.amount;
    }

    return {
      settled: invoice.settled,
      state: invoice.settled ? 'settled' : 'open',
      amt_paid_sat: invoice.settled ? invoice.amount : 0,
      settle_date: invoice.settled_at ? Math.floor(invoice.settled_at.getTime() / 1000) : 0
    };
  }

  async getBalance() {
    return {
      total_balance: this.balance,
      confirmed_balance: this.balance,
      unconfirmed_balance: 0
    };
  }
}

module.exports = MockLightningService;
