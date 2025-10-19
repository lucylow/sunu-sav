import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tontineGroups,
  tontineMembers,
  contributions,
  payouts,
  lightningInvoices,
  TontineGroup,
  InsertTontineGroup,
  TontineMember,
  InsertTontineMember,
  Contribution,
  InsertContribution,
  Payout,
  InsertPayout,
  LightningInvoice,
  InsertLightningInvoice
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "walletAddress", "phoneNumber"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Tontine Group Functions
export async function createTontineGroup(group: InsertTontineGroup): Promise<TontineGroup | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(tontineGroups).values(group);
    const result = await db.select().from(tontineGroups).where(eq(tontineGroups.id, group.id!)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create tontine group:", error);
    throw error;
  }
}

export async function getTontineGroup(id: string): Promise<TontineGroup | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tontineGroups).where(eq(tontineGroups.id, id)).limit(1);
  return result[0];
}

export async function getAllTontineGroups(): Promise<TontineGroup[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tontineGroups).orderBy(desc(tontineGroups.createdAt));
}

export async function getUserTontineGroups(userId: string): Promise<TontineGroup[]> {
  const db = await getDb();
  if (!db) return [];

  const memberGroups = await db
    .select({ groupId: tontineMembers.groupId })
    .from(tontineMembers)
    .where(and(eq(tontineMembers.userId, userId), eq(tontineMembers.isActive, true)));

  if (memberGroups.length === 0) return [];

  const groupIds = memberGroups.map(m => m.groupId);
  const groups = await db.select().from(tontineGroups).where(
    eq(tontineGroups.id, groupIds[0])
  );
  
  return groups;
}

// Tontine Member Functions
export async function addTontineMember(member: InsertTontineMember): Promise<TontineMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(tontineMembers).values(member);
    const result = await db.select().from(tontineMembers).where(eq(tontineMembers.id, member.id!)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to add tontine member:", error);
    throw error;
  }
}

export async function getGroupMembers(groupId: string): Promise<TontineMember[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tontineMembers).where(
    and(eq(tontineMembers.groupId, groupId), eq(tontineMembers.isActive, true))
  );
}

// Contribution Functions
export async function createContribution(contribution: InsertContribution): Promise<Contribution | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(contributions).values(contribution);
    const result = await db.select().from(contributions).where(eq(contributions.id, contribution.id!)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create contribution:", error);
    throw error;
  }
}

export async function getGroupContributions(groupId: string, cycle?: number): Promise<Contribution[]> {
  const db = await getDb();
  if (!db) return [];

  if (cycle !== undefined) {
    return await db.select().from(contributions).where(
      and(eq(contributions.groupId, groupId), eq(contributions.cycle, cycle))
    ).orderBy(desc(contributions.createdAt));
  }

  return await db.select().from(contributions).where(
    eq(contributions.groupId, groupId)
  ).orderBy(desc(contributions.createdAt));
}

// Payout Functions
export async function createPayout(payout: InsertPayout): Promise<Payout | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(payouts).values(payout);
    const result = await db.select().from(payouts).where(eq(payouts.id, payout.id!)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create payout:", error);
    throw error;
  }
}

export async function getGroupPayouts(groupId: string): Promise<Payout[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payouts).where(
    eq(payouts.groupId, groupId)
  ).orderBy(desc(payouts.createdAt));
}

// Lightning Invoice Functions
export async function createLightningInvoice(invoice: InsertLightningInvoice): Promise<LightningInvoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(lightningInvoices).values(invoice);
    const result = await db.select().from(lightningInvoices).where(eq(lightningInvoices.id, invoice.id!)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to create lightning invoice:", error);
    throw error;
  }
}

export async function getLightningInvoice(paymentHash: string): Promise<LightningInvoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(lightningInvoices).where(
    eq(lightningInvoices.paymentHash, paymentHash)
  ).limit(1);
  
  return result[0];
}

export async function getUserInvoices(userId: string): Promise<LightningInvoice[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(lightningInvoices).where(
    eq(lightningInvoices.userId, userId)
  ).orderBy(desc(lightningInvoices.createdAt));
}

