import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";
import LightningManager from "./_core/lightningService";
import MultiSigManager from "./_core/multiSigService";
import PayoutManager from "./_core/payoutService";

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase admin client for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      // Get profile from Supabase
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', ctx.user.id)
        .single();
      
      return profile || ctx.user;
    }),

    logout: publicProcedure.mutation(async () => {
      // This is handled on the client side with Supabase
      return { success: true };
    }),
  }),

  tontine: router({
    list: publicProcedure.query(async () => {
      const { data: groups, error } = await supabaseAdmin
        .from('tontine_groups')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return groups || [];
    }),

    myGroups: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const { data: memberships, error } = await supabaseAdmin
        .from('tontine_members')
        .select('group_id')
        .eq('user_id', ctx.user.id)
        .eq('status', 'active');

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map(m => m.group_id);
      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('tontine_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: groupsError.message });
      return groups || [];
    }),

    getGroup: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { data: group, error } = await supabaseAdmin
          .from('tontine_groups')
          .select('*')
          .eq('id', input.id)
          .single();

        if (error || !group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });

        const { data: members } = await supabaseAdmin
          .from('tontine_members')
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              email
            )
          `)
          .eq('group_id', input.id)
          .eq('status', 'active');

        const { data: contributions } = await supabaseAdmin
          .from('contributions')
          .select(`
            *,
            profiles:user_id (
              id,
              name
            )
          `)
          .eq('group_id', input.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const { data: payouts } = await supabaseAdmin
          .from('payouts')
          .select(`
            *,
            profiles:recipient_id (
              id,
              name
            )
          `)
          .eq('group_id', input.id)
          .order('created_at', { ascending: false });

        return {
          ...group,
          members: members || [],
          contributions: contributions || [],
          payouts: payouts || [],
        };
      }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          contributionAmount: z.number().positive(),
          frequency: z.enum(['weekly', 'monthly', 'quarterly']),
          maxMembers: z.number().int().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const { data: group, error } = await supabaseAdmin
          .from('tontine_groups')
          .insert({
            name: input.name,
            description: input.description,
            contribution_amount: input.contributionAmount,
            frequency: input.frequency,
            max_members: input.maxMembers,
            created_by: ctx.user.id,
            multi_sig_address: `lnbc${Math.random().toString(36).substring(7)}`,
          })
          .select()
          .single();

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

        // Auto-join the creator
        await supabaseAdmin
          .from('tontine_members')
          .insert({
            group_id: group.id,
            user_id: ctx.user.id,
          });

        return group;
      }),

    join: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const { data: group } = await supabaseAdmin
          .from('tontine_groups')
          .select('*, tontine_members(count)')
          .eq('id', input.groupId)
          .single();

        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });

        const memberCount = group.tontine_members?.[0]?.count || 0;
        if (memberCount >= group.max_members) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group is full' });
        }

        const { error } = await supabaseAdmin
          .from('tontine_members')
          .insert({
            group_id: input.groupId,
            user_id: ctx.user.id,
          });

        if (error) {
          if (error.code === '23505') {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already a member' });
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }

        return { success: true };
      }),

    contribute: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          amount: z.number().positive(),
          memo: z.string().optional(),
          timestamp: z.number().optional(), // Original client timestamp for idempotency
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const { data: group } = await supabaseAdmin
          .from('tontine_groups')
          .select('*')
          .eq('id', input.groupId)
          .single();

        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });

        // Check for duplicate using timestamp (idempotency)
        if (input.timestamp) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const clientTime = new Date(input.timestamp);
          
          // Check if there's already a contribution within 5 seconds of the client timestamp
          const { data: existing } = await supabaseAdmin
            .from('contributions')
            .select('id')
            .eq('group_id', input.groupId)
            .eq('user_id', ctx.user.id)
            .eq('cycle', group.current_cycle)
            .gte('created_at', sevenDaysAgo.toISOString())
            .single();

          if (existing) {
            // Check if the timestamps are close enough to be considered the same action
            const timeDiff = Math.abs(clientTime.getTime() - new Date(existing.created_at).getTime());
            if (timeDiff < 5000) { // 5 seconds tolerance
              return {
                success: true,
                duplicate: true,
                message: 'Contribution already recorded',
              };
            }
          }
        }

        const { data: contribution, error } = await supabaseAdmin
          .from('contributions')
          .insert({
            group_id: input.groupId,
            user_id: ctx.user.id,
            amount: input.amount,
            cycle: group.current_cycle,
            payment_hash: `hash_${Date.now()}`,
            status: 'completed',
            memo: input.memo,
          })
          .select()
          .single();

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

        return { 
          success: true, 
          contributionId: contribution.id,
          message: 'Contribution recorded successfully'
        };
      }),

    getMembers: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        const { data: members, error } = await supabaseAdmin
          .from('tontine_members')
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              email
            )
          `)
          .eq('group_id', input.groupId)
          .eq('status', 'active');

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return members || [];
      }),

    getContributions: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          cycle: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        let query = supabaseAdmin
          .from('contributions')
          .select(`
            *,
            profiles:user_id (
              id,
              name
            )
          `)
          .eq('group_id', input.groupId);

        if (input.cycle) {
          query = query.eq('cycle', input.cycle);
        }

        const { data: contributions, error } = await query.order('created_at', { ascending: false });

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return contributions || [];
      }),
  }),

  wallet: router({
    createInvoice: publicProcedure
      .input(
        z.object({
          amount: z.number().positive(),
          groupId: z.string().optional(),
          memo: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        try {
          const invoice = await LightningManager.createInvoice(
            ctx.user.id,
            input.amount,
            input.groupId,
            input.memo
          );
          return invoice;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    getInvoices: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const { data: invoices, error } = await supabaseAdmin
        .from('lightning_invoices')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return invoices || [];
    }),

    checkPayment: publicProcedure
      .input(z.object({ paymentHash: z.string() }))
      .query(async ({ input }) => {
        const result = await LightningManager.getInvoiceStatus(input.paymentHash);
        return result;
      }),

    processPayment: publicProcedure
      .input(z.object({ paymentHash: z.string() }))
      .mutation(async ({ input }) => {
        const result = await LightningManager.processPayment(input.paymentHash);
        return result;
      }),
  }),

  multisig: router({
    createWallet: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          memberIds: z.array(z.string()),
          requiredSignatures: z.number().min(2).max(5).default(2),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        try {
          const wallet = await MultiSigManager.createWallet(
            input.groupId,
            input.memberIds,
            input.requiredSignatures
          );
          return wallet;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    getWallet: publicProcedure
      .input(z.object({ walletId: z.string() }))
      .query(async ({ input }) => {
        const wallet = await MultiSigManager.getWalletInfo(input.walletId);
        if (!wallet) throw new TRPCError({ code: 'NOT_FOUND', message: 'Wallet not found' });
        return wallet;
      }),

    getBalance: publicProcedure
      .input(z.object({ walletId: z.string() }))
      .query(async ({ input }) => {
        try {
          const balance = await MultiSigManager.getWalletBalance(input.walletId);
          return balance;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    initiateTransaction: publicProcedure
      .input(
        z.object({
          walletId: z.string(),
          toAddress: z.string(),
          amount: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        try {
          const result = await MultiSigManager.initiateTransaction(
            input.walletId,
            input.toAddress,
            input.amount,
            ctx.user.id
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    signTransaction: publicProcedure
      .input(
        z.object({
          transactionId: z.string(),
          signature: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        try {
          const result = await MultiSigManager.signTransaction(
            input.transactionId,
            ctx.user.id,
            input.signature
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    getPendingTransactions: publicProcedure
      .input(z.object({ walletId: z.string() }))
      .query(async ({ input }) => {
        try {
          const transactions = await MultiSigManager.getPendingTransactions(input.walletId);
          return transactions;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),
  }),

  system: router({
    health: publicProcedure.query(() => {
      return { 
        status: 'ok', 
        timestamp: Date.now(),
        version: '1.0.0'
      };
    }),
  }),

  wallet: router({
    // Get wallet balance
    getBalance: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => {
        try {
          // In a real implementation, you would query a Bitcoin node or API
          // This is a mock implementation for development
          const mockBalance = {
            confirmed: 100000, // 100,000 satoshis
            unconfirmed: 0,
            total: 100000,
          };
          
          return { success: true, balance: mockBalance };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch balance' });
        }
      }),

    // Get transaction history
    getTransactionHistory: publicProcedure
      .input(z.object({ address: z.string(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          // Mock transaction history
          const mockTransactions = [
            {
              txid: 'abc123def456789',
              amount: 50000,
              type: 'received',
              timestamp: Date.now() - 86400000, // 1 day ago
              confirmations: 6,
            },
            {
              txid: 'def456ghi789012',
              amount: -25000,
              type: 'sent',
              timestamp: Date.now() - 172800000, // 2 days ago
              confirmations: 12,
            },
          ];
          
          return { success: true, transactions: mockTransactions };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch transaction history' });
        }
      }),

    // Estimate transaction fee
    estimateFee: publicProcedure
      .input(z.object({ 
        utxoCount: z.number(), 
        outputCount: z.number().default(2) 
      }))
      .query(async ({ input }) => {
        try {
          // Simplified fee estimation
          const estimatedSize = (input.utxoCount * 41) + (input.outputCount * 31) + 10;
          const feeRate = 10; // satoshis per byte
          const fee = estimatedSize * feeRate;
          
          return { success: true, fee };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to estimate fee' });
        }
      }),

    // Broadcast transaction
    broadcastTransaction: publicProcedure
      .input(z.object({ hex: z.string() }))
      .mutation(async ({ input }) => {
        try {
          // In a real implementation, you would broadcast to a Bitcoin node
          // This is a mock implementation
          const mockTxid = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          return { success: true, txid: mockTxid };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to broadcast transaction' });
        }
      }),

    // Get UTXOs for an address
    getUTXOs: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => {
        try {
          // Mock UTXOs
          const mockUTXOs = [
            {
              txid: 'abc123def456789',
              vout: 0,
              value: 100000,
              scriptPubKey: '0014' + 'a'.repeat(40),
              confirmations: 6,
            },
          ];
          
          return { success: true, utxos: mockUTXOs };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch UTXOs' });
        }
      }),

    // Validate Bitcoin address
    validateAddress: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => {
        try {
          // Simple validation - in real implementation, use bitcoinjs-lib
          const isValid = input.address.startsWith('tb1q') || input.address.startsWith('bc1q');
          
          return { success: true, isValid };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to validate address' });
        }
      }),
  }),

  payout: router({
    schedule: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          cycle: z.number(),
          scheduledDate: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const payout = await PayoutManager.schedulePayout(
            input.groupId,
            input.cycle,
            new Date(input.scheduledDate)
          );
          return payout;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    selectWinner: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          cycle: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const winnerId = await PayoutManager.selectWinner(input.groupId, input.cycle);
          return { winnerId };
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    process: publicProcedure
      .input(
        z.object({
          groupId: z.string(),
          cycle: z.number(),
          winnerId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await PayoutManager.processPayout(
            input.groupId,
            input.cycle,
            input.winnerId
          );
          return result;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    getHistory: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        try {
          const history = await PayoutManager.getPayoutHistory(input.groupId);
          return history;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),

    getUpcoming: publicProcedure.query(async () => {
      try {
        const upcoming = await PayoutManager.getUpcomingPayouts();
        return upcoming;
      } catch (error: any) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    }),

    autoSchedule: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const payout = await PayoutManager.autoScheduleNextPayout(input.groupId);
          return payout;
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
