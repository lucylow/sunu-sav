import { createClient } from '@supabase/supabase-js';
import LightningManager from './lightningService';
import MultiSigManager from './multiSigService';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface PayoutSchedule {
  id: string;
  groupId: string;
  cycle: number;
  scheduledDate: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  winnerId?: string;
  amount: number;
}

export class PayoutManager {
  static async schedulePayout(
    groupId: string,
    cycle: number,
    scheduledDate: Date
  ): Promise<PayoutSchedule> {
    // Get group details
    const { data: group, error: groupError } = await supabaseAdmin
      .from('tontine_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      throw new Error('Group not found');
    }

    // Get active members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('tontine_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (membersError || !members) {
      throw new Error('No active members found');
    }

    // Calculate total payout amount
    const totalAmount = members.length * group.contribution_amount;

    // Create payout schedule
    const { data: payout, error: payoutError } = await supabaseAdmin
      .from('payout_schedules')
      .insert({
        group_id: groupId,
        cycle: cycle,
        scheduled_date: scheduledDate.toISOString(),
        status: 'scheduled',
        amount: totalAmount,
      })
      .select()
      .single();

    if (payoutError) {
      throw new Error(`Failed to schedule payout: ${payoutError.message}`);
    }

    return {
      id: payout.id,
      groupId: payout.group_id,
      cycle: payout.cycle,
      scheduledDate: new Date(payout.scheduled_date),
      status: payout.status,
      amount: payout.amount,
    };
  }

  static async selectWinner(groupId: string, cycle: number): Promise<string> {
    // Get members who haven't received payout yet
    const { data: eligibleMembers, error } = await supabaseAdmin
      .from('tontine_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .eq('has_received_payout', false);

    if (error || !eligibleMembers || eligibleMembers.length === 0) {
      throw new Error('No eligible members for payout');
    }

    // Random selection (in production, use cryptographically secure random)
    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const winnerId = eligibleMembers[randomIndex].user_id;

    // Update payout schedule with winner
    await supabaseAdmin
      .from('payout_schedules')
      .update({ winner_id: winnerId })
      .eq('group_id', groupId)
      .eq('cycle', cycle);

    return winnerId;
  }

  static async processPayout(
    groupId: string,
    cycle: number,
    winnerId: string
  ): Promise<{
    success: boolean;
    txid?: string;
    error?: string;
  }> {
    try {
      // Get payout details
      const { data: payout, error: payoutError } = await supabaseAdmin
        .from('payout_schedules')
        .select('*')
        .eq('group_id', groupId)
        .eq('cycle', cycle)
        .single();

      if (payoutError || !payout) {
        return { success: false, error: 'Payout not found' };
      }

      // Update status to processing
      await supabaseAdmin
        .from('payout_schedules')
        .update({ status: 'processing' })
        .eq('id', payout.id);

      // Get group's multi-sig wallet
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('multi_sig_wallets')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (walletError || !wallet) {
        return { success: false, error: 'Multi-sig wallet not found' };
      }

      // Create Lightning invoice for winner
      const invoice = await LightningManager.createPayoutInvoice(
        winnerId,
        payout.amount,
        groupId,
        cycle
      );

      // In a real implementation, this would:
      // 1. Create a transaction from multi-sig wallet to Lightning invoice
      // 2. Collect required signatures
      // 3. Broadcast the transaction
      // 4. Monitor for confirmation

      // For demo purposes, simulate successful payout
      const mockTxid = `tx_${Date.now()}_${Math.random().toString(36)}`;

      // Update payout status
      await supabaseAdmin
        .from('payout_schedules')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          txid: mockTxid,
        })
        .eq('id', payout.id);

      // Mark member as having received payout
      await supabaseAdmin
        .from('tontine_members')
        .update({
          has_received_payout: true,
          payout_cycle: cycle,
        })
        .eq('group_id', groupId)
        .eq('user_id', winnerId);

      // Update group cycle
      await supabaseAdmin
        .from('tontine_groups')
        .update({ current_cycle: cycle + 1 })
        .eq('id', groupId);

      return {
        success: true,
        txid: mockTxid,
      };
    } catch (error: any) {
      // Update status to failed
      await supabaseAdmin
        .from('payout_schedules')
        .update({ status: 'failed' })
        .eq('group_id', groupId)
        .eq('cycle', cycle);

      return {
        success: false,
        error: error.message || 'Payout processing failed',
      };
    }
  }

  static async getPayoutHistory(groupId: string): Promise<any[]> {
    const { data: payouts, error } = await supabaseAdmin
      .from('payout_schedules')
      .select(`
        *,
        profiles:winner_id (
          id,
          name,
          email
        )
      `)
      .eq('group_id', groupId)
      .order('cycle', { ascending: false });

    if (error) {
      throw new Error(`Failed to get payout history: ${error.message}`);
    }

    return payouts || [];
  }

  static async getUpcomingPayouts(): Promise<PayoutSchedule[]> {
    const { data: payouts, error } = await supabaseAdmin
      .from('payout_schedules')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to get upcoming payouts: ${error.message}`);
    }

    return (payouts || []).map(payout => ({
      id: payout.id,
      groupId: payout.group_id,
      cycle: payout.cycle,
      scheduledDate: new Date(payout.scheduled_date),
      status: payout.status,
      winnerId: payout.winner_id,
      amount: payout.amount,
    }));
  }

  static async processScheduledPayouts(): Promise<void> {
    const now = new Date();
    
    // Get payouts that are due
    const { data: duePayouts, error } = await supabaseAdmin
      .from('payout_schedules')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now.toISOString());

    if (error || !duePayouts) {
      console.error('Failed to get due payouts:', error);
      return;
    }

    for (const payout of duePayouts) {
      try {
        // Select winner
        const winnerId = await this.selectWinner(payout.group_id, payout.cycle);
        
        // Process payout
        const result = await this.processPayout(
          payout.group_id,
          payout.cycle,
          winnerId
        );

        if (result.success) {
          console.log(`Payout completed for group ${payout.group_id}, cycle ${payout.cycle}`);
        } else {
          console.error(`Payout failed for group ${payout.group_id}, cycle ${payout.cycle}:`, result.error);
        }
      } catch (error) {
        console.error(`Error processing payout for group ${payout.group_id}, cycle ${payout.cycle}:`, error);
      }
    }
  }

  static async calculateNextPayoutDate(
    groupId: string,
    frequency: 'weekly' | 'monthly' | 'quarterly'
  ): Promise<Date> {
    const now = new Date();
    
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  static async autoScheduleNextPayout(groupId: string): Promise<PayoutSchedule> {
    // Get group details
    const { data: group, error } = await supabaseAdmin
      .from('tontine_groups')
      .select('frequency, current_cycle')
      .eq('id', groupId)
      .single();

    if (error || !group) {
      throw new Error('Group not found');
    }

    // Calculate next payout date
    const nextPayoutDate = await this.calculateNextPayoutDate(groupId, group.frequency);
    
    // Schedule the payout
    return await this.schedulePayout(groupId, group.current_cycle + 1, nextPayoutDate);
  }
}

// Background job to process scheduled payouts
export class PayoutScheduler {
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalMs: number = 60000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        await PayoutManager.processScheduledPayouts();
      } catch (error) {
        console.error('Error in payout scheduler:', error);
      }
    }, intervalMs);

    console.log('Payout scheduler started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Payout scheduler stopped');
    }
  }
}

export default PayoutManager;
