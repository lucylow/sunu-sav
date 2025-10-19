import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
  walletAddress: varchar("walletAddress", { length: 255 }),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tontine groups - community savings circles
 */
export const tontineGroups = mysqlTable("tontineGroups", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: varchar("creatorId", { length: 64 }).notNull(),
  contributionAmount: int("contributionAmount").notNull(), // Amount in satoshis
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).notNull(),
  maxMembers: int("maxMembers").notNull(),
  currentMembers: int("currentMembers").default(1).notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  multiSigAddress: varchar("multiSigAddress", { length: 255 }),
  currentCycle: int("currentCycle").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  nextPayoutDate: timestamp("nextPayoutDate"),
});

export type TontineGroup = typeof tontineGroups.$inferSelect;
export type InsertTontineGroup = typeof tontineGroups.$inferInsert;

/**
 * Tontine members - users participating in groups
 */
export const tontineMembers = mysqlTable("tontineMembers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow(),
  hasReceivedPayout: boolean("hasReceivedPayout").default(false).notNull(),
  payoutCycle: int("payoutCycle"),
  isActive: boolean("isActive").default(true).notNull(),
});

export type TontineMember = typeof tontineMembers.$inferSelect;
export type InsertTontineMember = typeof tontineMembers.$inferInsert;

/**
 * Contributions - tracking member payments
 */
export const contributions = mysqlTable("contributions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  amount: int("amount").notNull(), // Amount in satoshis
  cycle: int("cycle").notNull(),
  txHash: varchar("txHash", { length: 255 }),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  confirmedAt: timestamp("confirmedAt"),
});

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;

/**
 * Payouts - tracking distributions to members
 */
export const payouts = mysqlTable("payouts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  groupId: varchar("groupId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  amount: int("amount").notNull(), // Amount in satoshis
  cycle: int("cycle").notNull(),
  txHash: varchar("txHash", { length: 255 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
});

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;

/**
 * Lightning invoices - for payment tracking
 */
export const lightningInvoices = mysqlTable("lightningInvoices", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  groupId: varchar("groupId", { length: 64 }),
  paymentRequest: text("paymentRequest").notNull(),
  paymentHash: varchar("paymentHash", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Amount in satoshis
  status: mysqlEnum("status", ["pending", "paid", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type LightningInvoice = typeof lightningInvoices.$inferSelect;
export type InsertLightningInvoice = typeof lightningInvoices.$inferInsert;

