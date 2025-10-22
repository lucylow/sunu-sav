import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database['public']['Tables'];
type TablesInsert = Database['public']['Tables'];

// Type definitions for our tables
export type TontineGroup = Tables['tontine_groups']['Row'];
export type TontineGroupInsert = Tables['tontine_groups']['Insert'];
export type TontineGroupUpdate = Tables['tontine_groups']['Update'];

export type Contribution = Tables['contributions']['Row'];
export type ContributionInsert = Tables['contributions']['Insert'];
export type ContributionUpdate = Tables['contributions']['Update'];

export type Payout = Tables['payouts']['Row'];
export type PayoutInsert = Tables['payouts']['Insert'];
export type PayoutUpdate = Tables['payouts']['Update'];

export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

export type LightningInvoice = Tables['lightning_invoices']['Row'];
export type LightningInvoiceInsert = Tables['lightning_invoices']['Insert'];
export type LightningInvoiceUpdate = Tables['lightning_invoices']['Update'];

// Senegal-specific types
export type WaveTransaction = {
  id: string;
  user_id: string;
  phone_number: string;
  amount_xof: number;
  amount_sats: number;
  wave_transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  created_at: string;
  completed_at?: string;
};

export type USSDSession = {
  id: string;
  phone_number: string;
  session_id: string;
  menu_state: string;
  user_data?: any;
  expires_at: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  tier: 'standard' | 'pro' | 'enterprise';
  recurring_xof: number;
  active: boolean;
  started_at: string;
  expires_at?: string;
  created_at: string;
};

export type FeeRecord = {
  id: string;
  cycle_id?: string;
  sats_fee: number;
  sats_to_partner: number;
  sats_to_community: number;
  sats_to_platform: number;
  reason?: string;
  created_at: string;
};

// API Response types
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

class SunuSavAPI {
  // Tontine Groups
  async getGroups(): Promise<ApiResponse<TontineGroup[]>> {
    try {
      const { data, error } = await supabase
        .from('tontine_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async getGroup(id: string): Promise<ApiResponse<TontineGroup>> {
    try {
      const { data, error } = await supabase
        .from('tontine_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createGroup(group: TontineGroupInsert): Promise<ApiResponse<TontineGroup>> {
    try {
      const { data, error } = await supabase
        .from('tontine_groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async updateGroup(id: string, updates: TontineGroupUpdate): Promise<ApiResponse<TontineGroup>> {
    try {
      const { data, error } = await supabase
        .from('tontine_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Contributions
  async getContributions(groupId: string): Promise<ApiResponse<Contribution[]>> {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createContribution(contribution: ContributionInsert): Promise<ApiResponse<Contribution>> {
    try {
      const { data, error } = await supabase
        .from('contributions')
        .insert(contribution)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Lightning Invoices
  async createInvoice(invoice: LightningInvoiceInsert): Promise<ApiResponse<LightningInvoice>> {
    try {
      const { data, error } = await supabase
        .from('lightning_invoices')
        .insert(invoice)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async updateInvoiceStatus(id: string, status: string, paymentHash?: string): Promise<ApiResponse<LightningInvoice>> {
    try {
      const updates: LightningInvoiceUpdate = { status };
      if (paymentHash) updates.payment_hash = paymentHash;

      const { data, error } = await supabase
        .from('lightning_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Payouts
  async getPayouts(groupId: string): Promise<ApiResponse<Payout[]>> {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createPayout(payout: PayoutInsert): Promise<ApiResponse<Payout>> {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .insert(payout)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Senegal-specific APIs
  async getWaveTransactions(userId: string): Promise<ApiResponse<WaveTransaction[]>> {
    try {
      const { data, error } = await supabase
        .from('wave_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createWaveTransaction(transaction: Omit<WaveTransaction, 'id' | 'created_at'>): Promise<ApiResponse<WaveTransaction>> {
    try {
      const { data, error } = await supabase
        .from('wave_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async updateWaveTransactionStatus(id: string, status: string, waveTransactionId?: string): Promise<ApiResponse<WaveTransaction>> {
    try {
      const updates: any = { status };
      if (waveTransactionId) updates.wave_transaction_id = waveTransactionId;
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('wave_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // USSD Sessions
  async getUSSDSession(phoneNumber: string, sessionId: string): Promise<ApiResponse<USSDSession>> {
    try {
      const { data, error } = await supabase
        .from('ussd_sessions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createUSSDSession(session: Omit<USSDSession, 'id' | 'created_at'>): Promise<ApiResponse<USSDSession>> {
    try {
      const { data, error } = await supabase
        .from('ussd_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async updateUSSDSession(id: string, updates: Partial<USSDSession>): Promise<ApiResponse<USSDSession>> {
    try {
      const { data, error } = await supabase
        .from('ussd_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Subscriptions
  async getSubscriptions(userId: string): Promise<ApiResponse<Subscription[]>> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at'>): Promise<ApiResponse<Subscription>> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<ApiResponse<Subscription>> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Fee Records
  async getFeeRecords(cycleId?: string): Promise<ApiResponse<FeeRecord[]>> {
    try {
      let query = supabase.from('fee_records').select('*');
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  async createFeeRecord(feeRecord: Omit<FeeRecord, 'id' | 'created_at'>): Promise<ApiResponse<FeeRecord>> {
    try {
      const { data, error } = await supabase
        .from('fee_records')
        .insert(feeRecord)
        .select()
        .single();

      if (error) throw error;
      return { data, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Exchange Rates
  async getCurrentExchangeRate(currencyPair: string = 'BTC_XOF'): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency_pair', currencyPair)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return { data: data?.rate || 8000000, success: true }; // Fallback rate
    } catch (error) {
      return { data: 8000000, success: true }; // Fallback rate
    }
  }

  // Senegal Holidays
  async getSenegalHolidays(): Promise<ApiResponse<Array<{ date: string; name: string; is_recurring: boolean }>>> {
    try {
      const { data, error } = await supabase
        .from('senegal_holidays')
        .select('date, name, is_recurring')
        .order('date');

      if (error) throw error;
      return { data: data || [], success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Business Day Check
  async isBusinessDayInSenegal(date: string): Promise<ApiResponse<boolean>> {
    try {
      const { data, error } = await supabase
        .rpc('is_business_day_in_senegal', { check_date: date });

      if (error) throw error;
      return { data: data || false, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Fee Calculation
  async calculateFeeBreakdown(
    payoutSats: number,
    groupVerified: boolean = false,
    userRecurring: boolean = false
  ): Promise<ApiResponse<{
    sats_fee: number;
    platform_share: number;
    community_share: number;
    partner_reserved: number;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_fee_breakdown', {
          payout_sats: payoutSats,
          group_verified: groupVerified,
          user_recurring: userRecurring
        });

      if (error) throw error;
      return { data: data || null, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }

  // Community Fund
  async getCommunityFund(): Promise<ApiResponse<{ total_sats: number; total_xof: number }>> {
    try {
      const { data, error } = await supabase
        .from('community_fund')
        .select('total_sats, total_xof')
        .single();

      if (error) throw error;
      return { data: data || { total_sats: 0, total_xof: 0 }, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }
}

// Export singleton instance
export const sunuSavAPI = new SunuSavAPI();
export default sunuSavAPI;
