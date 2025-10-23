import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb, schema } from "./_core/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import LightningManager from "./_core/lightningService";
import MultiSigManager from "./_core/multiSigService";
import PayoutManager from "./_core/payoutService";
import { CreditAIService, FraudDetectionService, AIInsightsService, ChatAIService } from "./_core/services/AIService";

// Initialize AI services
const creditAI = new CreditAIService();
const fraudAI = new FraudDetectionService();
const insightsAI = new AIInsightsService();
const chatAI = new ChatAIService();

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Get profile from database
      const profile = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, ctx.user.id))
        .limit(1);
      
      return profile[0] || ctx.user;
    }),

    logout: publicProcedure.mutation(async () => {
      // This is handled on the client side
      return { success: true };
    }),
  }),

  tontine: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      
      const groups = await db
        .select()
        .from(schema.tontineGroups)
        .where(eq(schema.tontineGroups.status, 'active'))
        .orderBy(desc(schema.tontineGroups.createdAt));

      return groups;
    }),

    myGroups: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const db = await getDb();
      
      const memberships = await db
        .select({ groupId: schema.tontineMembers.groupId })
        .from(schema.tontineMembers)
        .where(and(
          eq(schema.tontineMembers.userId, ctx.user.id),
          eq(schema.tontineMembers.isActive, true)
        ));

      if (!memberships || memberships.length === 0) return [];

      const groupIds = memberships.map(m => m.groupId);
      const groups = await db
        .select()
        .from(schema.tontineGroups)
        .where(inArray(schema.tontineGroups.id, groupIds))
        .orderBy(desc(schema.tontineGroups.createdAt));

      return groups;
    }),

    getGroup: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        
        const group = await db
          .select()
          .from(schema.tontineGroups)
          .where(eq(schema.tontineGroups.id, input.id))
          .limit(1);

        if (!group[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
        }

        // Get members with user details
        const members = await db
          .select({
            id: schema.tontineMembers.id,
            groupId: schema.tontineMembers.groupId,
            userId: schema.tontineMembers.userId,
            joinedAt: schema.tontineMembers.joinedAt,
            hasReceivedPayout: schema.tontineMembers.hasReceivedPayout,
            payoutCycle: schema.tontineMembers.payoutCycle,
            isActive: schema.tontineMembers.isActive,
            userName: schema.users.name,
            userEmail: schema.users.email,
          })
          .from(schema.tontineMembers)
          .leftJoin(schema.users, eq(schema.tontineMembers.userId, schema.users.id))
          .where(eq(schema.tontineMembers.groupId, input.id));

        return {
          ...group[0],
          members,
        };
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(3).max(100),
        description: z.string().max(500).optional(),
        contributionAmount: z.number().positive().int(),
        frequency: z.enum(['weekly', 'biweekly', 'monthly']),
        maxMembers: z.number().int().min(2).max(50),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const db = await getDb();
        
        // Generate multi-sig address for the group
        const multiSigAddress = await MultiSigManager.generateAddress();
        
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newGroup = await db
          .insert(schema.tontineGroups)
          .values({
            id: groupId,
            name: input.name,
            description: input.description,
            creatorId: ctx.user.id,
            contributionAmount: input.contributionAmount,
            frequency: input.frequency,
            maxMembers: input.maxMembers,
            currentMembers: 1,
            status: 'active',
            multiSigAddress,
            currentCycle: 0,
          });

        // Add creator as first member
        await db
          .insert(schema.tontineMembers)
          .values({
            id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            groupId,
            userId: ctx.user.id,
            joinedAt: new Date(),
            hasReceivedPayout: false,
            isActive: true,
          });

        return { id: groupId, ...input };
      }),

    join: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const db = await getDb();
        
        // Check if group exists and has space
        const group = await db
          .select()
          .from(schema.tontineGroups)
          .where(eq(schema.tontineGroups.id, input.groupId))
          .limit(1);

        if (!group[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
        }

        if (group[0].currentMembers >= group[0].maxMembers) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Group is full' });
        }

        // Check if user is already a member
        const existingMember = await db
          .select()
          .from(schema.tontineMembers)
          .where(and(
            eq(schema.tontineMembers.groupId, input.groupId),
            eq(schema.tontineMembers.userId, ctx.user.id)
          ))
          .limit(1);

        if (existingMember[0]) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already a member of this group' });
        }

        // Add user as member
        await db
          .insert(schema.tontineMembers)
          .values({
            id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            groupId: input.groupId,
            userId: ctx.user.id,
            joinedAt: new Date(),
            hasReceivedPayout: false,
            isActive: true,
          });

        // Update group member count
        await db
          .update(schema.tontineGroups)
          .set({ currentMembers: group[0].currentMembers + 1 })
          .where(eq(schema.tontineGroups.id, input.groupId));

        return { success: true };
      }),

    contribute: publicProcedure
      .input(z.object({
        groupId: z.string(),
        amount: z.number().positive().int(),
        memo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

        const db = await getDb();
        
        // Verify user is a member of the group
        const membership = await db
          .select()
          .from(schema.tontineMembers)
          .where(and(
            eq(schema.tontineMembers.groupId, input.groupId),
            eq(schema.tontineMembers.userId, ctx.user.id),
            eq(schema.tontineMembers.isActive, true)
          ))
          .limit(1);

        if (!membership[0]) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this group' });
        }

        // Get group details
        const group = await db
          .select()
          .from(schema.tontineGroups)
          .where(eq(schema.tontineGroups.id, input.groupId))
          .limit(1);

        if (!group[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
        }

        // Create Lightning invoice
        const invoice = await LightningManager.createInvoice(
          input.amount,
          input.memo || `Contribution to ${group[0].name}`
        );

        // Record contribution
        const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await db
          .insert(schema.contributions)
          .values({
            id: contributionId,
            groupId: input.groupId,
            userId: ctx.user.id,
            amount: input.amount,
            cycle: group[0].currentCycle,
            txHash: invoice.paymentHash,
            status: 'pending',
            createdAt: new Date(),
          });

        // Store Lightning invoice
        await db
          .insert(schema.lightningInvoices)
          .values({
            id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: ctx.user.id,
            groupId: input.groupId,
            paymentRequest: invoice.paymentRequest,
            paymentHash: invoice.paymentHash,
            amount: input.amount,
            status: 'pending',
            expiresAt: invoice.expiresAt,
            createdAt: new Date(),
          });

        return {
          contributionId,
          invoice: invoice.paymentRequest,
          amount: input.amount,
        };
      }),

    getContributions: publicProcedure
      .input(z.object({ groupId: z.string(), cycle: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        
        const whereCondition = input.cycle 
          ? and(
              eq(schema.contributions.groupId, input.groupId),
              eq(schema.contributions.cycle, input.cycle)
            )
          : eq(schema.contributions.groupId, input.groupId);

        const contributions = await db
          .select({
            id: schema.contributions.id,
            groupId: schema.contributions.groupId,
            userId: schema.contributions.userId,
            amount: schema.contributions.amount,
            cycle: schema.contributions.cycle,
            txHash: schema.contributions.txHash,
            status: schema.contributions.status,
            createdAt: schema.contributions.createdAt,
            confirmedAt: schema.contributions.confirmedAt,
            userName: schema.users.name,
            userEmail: schema.users.email,
          })
          .from(schema.contributions)
          .leftJoin(schema.users, eq(schema.contributions.userId, schema.users.id))
          .where(whereCondition)
          .orderBy(desc(schema.contributions.createdAt));

        return contributions;
      }),
  }),

  // AI Services
  ai: router({
    credit: router({
      getScore: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
          return await creditAI.getCreditScore(input.userId);
        }),
    }),

    fraud: router({
      detect: publicProcedure
        .input(z.object({ 
          userId: z.string(),
          amount: z.number(),
          transactionType: z.string()
        }))
        .mutation(async ({ input }) => {
          return await fraudAI.detectFraud(input);
        }),
    }),

    insights: router({
      getDashboard: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
          return await insightsAI.getDashboardData(input.userId);
        }),
    }),

    chat: router({
      sendMessage: publicProcedure
        .input(z.object({ 
          userId: z.string(),
          message: z.string()
        }))
        .mutation(async ({ input }) => {
          return await chatAI.sendMessage(input.userId, input.message);
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;