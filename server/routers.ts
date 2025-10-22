import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

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

        const { error } = await supabaseAdmin
          .from('contributions')
          .insert({
            group_id: input.groupId,
            user_id: ctx.user.id,
            amount: input.amount,
            cycle: group.current_cycle,
            payment_hash: `hash_${Date.now()}`,
            status: 'completed',
          });

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

        return { success: true };
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
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const paymentHash = `hash_${Date.now()}_${Math.random().toString(36)}`;
        const paymentRequest = `lnbc${input.amount * 100000000}n${paymentHash}`;
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        const { data: invoice, error } = await supabaseAdmin
          .from('lightning_invoices')
          .insert({
            user_id: ctx.user.id,
            payment_hash: paymentHash,
            payment_request: paymentRequest,
            amount: input.amount,
            group_id: input.groupId,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
        return invoice;
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
  }),
});

export type AppRouter = typeof appRouter;
