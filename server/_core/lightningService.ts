import lnService from 'ln-service';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Lightning node configuration
const LND_CONFIG = {
  socket: process.env.LND_SOCKET || 'localhost:10009',
  macaroon: process.env.LND_MACAROON || '',
  cert: process.env.LND_CERT || '',
};

// Mock Lightning service for development/demo
class MockLightningService {
  private invoices: Map<string, any> = new Map();

  async createInvoice(amount: number, memo?: string): Promise<{
    paymentRequest: string;
    paymentHash: string;
    expiresAt: Date;
  }> {
    const paymentHash = this.generatePaymentHash();
    const paymentRequest = `lnbc${amount}n1p${paymentHash}...`;
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    this.invoices.set(paymentHash, {
      paymentRequest,
      paymentHash,
      amount,
      memo,
      expiresAt,
      status: 'pending',
    });

    return {
      paymentRequest,
      paymentHash,
      expiresAt,
    };
  }

  async payInvoice(paymentRequest: string): Promise<{
    success: boolean;
    paymentHash?: string;
    error?: string;
  }> {
    // Extract payment hash from mock invoice
    const paymentHash = paymentRequest.split('p')[1]?.split('.')[0];
    
    if (!paymentHash || !this.invoices.has(paymentHash)) {
      return { success: false, error: 'Invalid payment request' };
    }

    const invoice = this.invoices.get(paymentHash);
    if (invoice.status !== 'pending') {
      return { success: false, error: 'Invoice already processed' };
    }

    // Simulate payment success
    invoice.status = 'paid';
    invoice.paidAt = new Date();

    return {
      success: true,
      paymentHash,
    };
  }

  async getInvoiceStatus(paymentHash: string): Promise<{
    status: 'pending' | 'paid' | 'expired';
    paidAt?: Date;
  }> {
    const invoice = this.invoices.get(paymentHash);
    if (!invoice) {
      return { status: 'expired' };
    }

    if (invoice.status === 'paid') {
      return { status: 'paid', paidAt: invoice.paidAt };
    }

    if (invoice.expiresAt < new Date()) {
      return { status: 'expired' };
    }

    return { status: 'pending' };
  }

  private generatePaymentHash(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

// Real Lightning service using ln-service
class RealLightningService {
  private lnd: any;

  constructor() {
    this.lnd = lnService.authenticatedLndGrpc({
      cert: LND_CONFIG.cert,
      macaroon: LND_CONFIG.macaroon,
      socket: LND_CONFIG.socket,
    });
  }

  async createInvoice(amount: number, memo?: string): Promise<{
    paymentRequest: string;
    paymentHash: string;
    expiresAt: Date;
  }> {
    const { request, id } = await lnService.createInvoice({
      lnd: this.lnd,
      tokens: amount,
      description: memo || 'Tontine contribution',
    });

    return {
      paymentRequest: request,
      paymentHash: id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };
  }

  async payInvoice(paymentRequest: string): Promise<{
    success: boolean;
    paymentHash?: string;
    error?: string;
  }> {
    try {
      const { id } = await lnService.pay({
        lnd: this.lnd,
        request: paymentRequest,
      });

      return {
        success: true,
        paymentHash: id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  async getInvoiceStatus(paymentHash: string): Promise<{
    status: 'pending' | 'paid' | 'expired';
    paidAt?: Date;
  }> {
    try {
      const invoice = await lnService.getInvoice({
        lnd: this.lnd,
        id: paymentHash,
      });

      if (invoice.is_confirmed) {
        return { status: 'paid', paidAt: new Date(invoice.confirmed_at) };
      }

      return { status: 'pending' };
    } catch (error) {
      return { status: 'expired' };
    }
  }
}

// Export the appropriate service based on environment
const LightningService = process.env.NODE_ENV === 'production' && LND_CONFIG.macaroon 
  ? new RealLightningService() 
  : new MockLightningService();

export class LightningManager {
  static async createInvoice(
    userId: string,
    amount: number,
    groupId?: string,
    memo?: string
  ): Promise<{
    id: string;
    paymentRequest: string;
    paymentHash: string;
    qrCode: string;
    expiresAt: Date;
  }> {
    const invoice = await LightningService.createInvoice(amount, memo);
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(invoice.paymentRequest, {
      width: 256,
      margin: 2,
    });

    // Store invoice in database
    const { data: dbInvoice, error } = await supabaseAdmin
      .from('lightning_invoices')
      .insert({
        user_id: userId,
        payment_hash: invoice.paymentHash,
        payment_request: invoice.paymentRequest,
        amount: amount,
        group_id: groupId,
        expires_at: invoice.expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store invoice: ${error.message}`);
    }

    return {
      id: dbInvoice.id,
      paymentRequest: invoice.paymentRequest,
      paymentHash: invoice.paymentHash,
      qrCode,
      expiresAt: invoice.expiresAt,
    };
  }

  static async processPayment(paymentHash: string): Promise<{
    success: boolean;
    invoice?: any;
    error?: string;
  }> {
    // Get invoice from database
    const { data: invoice, error } = await supabaseAdmin
      .from('lightning_invoices')
      .select('*')
      .eq('payment_hash', paymentHash)
      .single();

    if (error || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status !== 'pending') {
      return { success: false, error: 'Invoice already processed' };
    }

    // Check payment status
    const status = await LightningService.getInvoiceStatus(paymentHash);
    
    if (status.status === 'paid') {
      // Update invoice status
      await supabaseAdmin
        .from('lightning_invoices')
        .update({
          status: 'paid',
          paid_at: status.paidAt?.toISOString(),
        })
        .eq('payment_hash', paymentHash);

      // If this is a tontine contribution, record it
      if (invoice.group_id) {
        await this.recordContribution(invoice);
      }

      return { success: true, invoice };
    }

    if (status.status === 'expired') {
      await supabaseAdmin
        .from('lightning_invoices')
        .update({ status: 'expired' })
        .eq('payment_hash', paymentHash);
    }

    return { success: false, error: 'Payment not confirmed' };
  }

  static async recordContribution(invoice: any): Promise<void> {
    const { error } = await supabaseAdmin
      .from('contributions')
      .insert({
        group_id: invoice.group_id,
        user_id: invoice.user_id,
        amount: invoice.amount,
        cycle: 1, // TODO: Get current cycle from group
        payment_hash: invoice.payment_hash,
        status: 'completed',
      });

    if (error) {
      console.error('Failed to record contribution:', error);
    }
  }

  static async getInvoiceStatus(paymentHash: string): Promise<{
    status: 'pending' | 'paid' | 'expired';
    invoice?: any;
  }> {
    const { data: invoice, error } = await supabaseAdmin
      .from('lightning_invoices')
      .select('*')
      .eq('payment_hash', paymentHash)
      .single();

    if (error || !invoice) {
      return { status: 'expired' };
    }

    return {
      status: invoice.status,
      invoice,
    };
  }

  static async createPayoutInvoice(
    recipientId: string,
    amount: number,
    groupId: string,
    cycle: number
  ): Promise<{
    id: string;
    paymentRequest: string;
    paymentHash: string;
    qrCode: string;
  }> {
    const invoice = await LightningService.createInvoice(amount, `Tontine payout - Cycle ${cycle}`);
    
    const qrCode = await QRCode.toDataURL(invoice.paymentRequest, {
      width: 256,
      margin: 2,
    });

    // Store payout record
    const { data: payout, error } = await supabaseAdmin
      .from('payouts')
      .insert({
        group_id: groupId,
        recipient_id: recipientId,
        amount: amount,
        cycle: cycle,
        transaction_id: invoice.paymentHash,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payout: ${error.message}`);
    }

    return {
      id: payout.id,
      paymentRequest: invoice.paymentRequest,
      paymentHash: invoice.paymentHash,
      qrCode,
    };
  }
}

export default LightningManager;
