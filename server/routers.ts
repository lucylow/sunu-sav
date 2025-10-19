import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomBytes } from "crypto";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tontine: router({
    // Get all tontine groups
    list: publicProcedure.query(async () => {
      return await db.getAllTontineGroups();
    }),

    // Get user's tontine groups
    myGroups: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTontineGroups(ctx.user.id);
    }),

    // Get specific group details
    getGroup: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const group = await db.getTontineGroup(input.id);
        if (!group) return null;

        const members = await db.getGroupMembers(input.id);
        const contributions = await db.getGroupContributions(input.id);
        const payouts = await db.getGroupPayouts(input.id);

        return {
          group,
          members,
          contributions,
          payouts,
        };
      }),

    // Create new tontine group
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        contributionAmount: z.number().positive(),
        frequency: z.enum(["weekly", "biweekly", "monthly"]),
        maxMembers: z.number().min(2).max(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const groupId = randomBytes(16).toString("hex");
        const memberId = randomBytes(16).toString("hex");

        // Calculate next payout date based on frequency
        const now = new Date();
        const nextPayoutDate = new Date(now);
        switch (input.frequency) {
          case "weekly":
            nextPayoutDate.setDate(now.getDate() + 7);
            break;
          case "biweekly":
            nextPayoutDate.setDate(now.getDate() + 14);
            break;
          case "monthly":
            nextPayoutDate.setMonth(now.getMonth() + 1);
            break;
        }

        const group = await db.createTontineGroup({
          id: groupId,
          name: input.name,
          description: input.description,
          creatorId: ctx.user.id,
          contributionAmount: input.contributionAmount,
          frequency: input.frequency,
          maxMembers: input.maxMembers,
          currentMembers: 1,
          status: "active",
          currentCycle: 1,
          nextPayoutDate,
        });

        // Add creator as first member
        await db.addTontineMember({
          id: memberId,
          groupId,
          userId: ctx.user.id,
          isActive: true,
        });

        return group;
      }),

    // Join a tontine group
    join: protectedProcedure
      .input(z.object({ groupId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getTontineGroup(input.groupId);
        if (!group) {
          throw new Error("Group not found");
        }

        if (group.currentMembers >= group.maxMembers) {
          throw new Error("Group is full");
        }

        const memberId = randomBytes(16).toString("hex");
        const member = await db.addTontineMember({
          id: memberId,
          groupId: input.groupId,
          userId: ctx.user.id,
          isActive: true,
        });

        return member;
      }),

    // Create contribution (mock Lightning payment)
    contribute: protectedProcedure
      .input(z.object({
        groupId: z.string(),
        amount: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await db.getTontineGroup(input.groupId);
        if (!group) {
          throw new Error("Group not found");
        }

        const contributionId = randomBytes(16).toString("hex");
        const mockTxHash = randomBytes(32).toString("hex");

        const contribution = await db.createContribution({
          id: contributionId,
          groupId: input.groupId,
          userId: ctx.user.id,
          amount: input.amount,
          cycle: group.currentCycle,
          txHash: mockTxHash,
          status: "confirmed",
          confirmedAt: new Date(),
        });

        return contribution;
      }),

    // Get group members
    getMembers: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        return await db.getGroupMembers(input.groupId);
      }),

    // Get group contributions
    getContributions: publicProcedure
      .input(z.object({ 
        groupId: z.string(),
        cycle: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getGroupContributions(input.groupId, input.cycle);
      }),
  }),

  wallet: router({
    // Generate mock Lightning invoice
    createInvoice: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        groupId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const invoiceId = randomBytes(16).toString("hex");
        const paymentHash = randomBytes(32).toString("hex");
        const mockPaymentRequest = `lnbc${input.amount}n1p${randomBytes(32).toString("hex")}`;
        
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const invoice = await db.createLightningInvoice({
          id: invoiceId,
          userId: ctx.user.id,
          groupId: input.groupId,
          paymentRequest: mockPaymentRequest,
          paymentHash,
          amount: input.amount,
          status: "pending",
          expiresAt,
        });

        return invoice;
      }),

    // Get user invoices
    getInvoices: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserInvoices(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;

