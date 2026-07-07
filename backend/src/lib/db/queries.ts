import type { Address } from "@ekimina/types";

import { eq } from "drizzle-orm";

import {
  users,
  groupMeta as groupMetaTable,
  paymentIntents as paymentIntentsTable,
  signingStates as signingStatesTable,
  joinRequests as joinRequestsTable,
  settingsChanges as settingsChangesTable,
  reviews as reviewsTable,
} from "./schema.js";

import { db } from "./index.js";

export async function getAllUsers() {
  return db.select().from(users);
}

export async function getUserByAddress(address: Address) {
  const rows = await db.select().from(users).where(eq(users.address, address)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByPhone(phone: string) {
  const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(user: typeof users.$inferInsert) {
  const rows = await db.insert(users).values(user).returning();
  return rows[0];
}

export async function getAllGroupMeta() {
  return db.select().from(groupMetaTable);
}

export async function getGroupMetaByAddress(address: Address) {
  const rows = await db
    .select()
    .from(groupMetaTable)
    .where(eq(groupMetaTable.address, address))
    .limit(1);
  return rows[0] ?? null;
}

export async function getGroupMetaByInviteCode(code: string) {
  const rows = await db
    .select()
    .from(groupMetaTable)
    .where(eq(groupMetaTable.inviteCode, code))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertGroupMeta(meta: typeof groupMetaTable.$inferInsert) {
  const rows = await db
    .insert(groupMetaTable)
    .values(meta)
    .onConflictDoUpdate({ target: groupMetaTable.address, set: meta })
    .returning();
  return rows[0];
}

export async function getPaymentIntent(id: string) {
  const rows = await db
    .select()
    .from(paymentIntentsTable)
    .where(eq(paymentIntentsTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createPaymentIntent(intent: typeof paymentIntentsTable.$inferInsert) {
  const rows = await db.insert(paymentIntentsTable).values(intent).returning();
  return rows[0];
}

export async function updatePaymentIntent(
  id: string,
  data: Partial<typeof paymentIntentsTable.$inferInsert>,
) {
  const rows = await db
    .update(paymentIntentsTable)
    .set(data)
    .where(eq(paymentIntentsTable.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function getSigningState(id: string) {
  const rows = await db
    .select()
    .from(signingStatesTable)
    .where(eq(signingStatesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertSigningState(id: string, userId: string) {
  const existing = await getSigningState(id);
  if (existing) {
    const updated = [...existing.signedBy, userId];
    const rows = await db
      .update(signingStatesTable)
      .set({ signedBy: updated, updatedAt: new Date().toISOString() })
      .where(eq(signingStatesTable.id, id))
      .returning();
    return rows[0];
  }
  const rows = await db
    .insert(signingStatesTable)
    /// @ts-expect-error idek
    .values({ id, signedBy: [userId] })
    .returning();
  return rows[0];
}

export async function deleteSigningState(id: string) {
  await db.delete(signingStatesTable).where(eq(signingStatesTable.id, id));
}

export async function createJoinRequest(req: typeof joinRequestsTable.$inferInsert) {
  const rows = await db.insert(joinRequestsTable).values(req).returning();
  return rows[0];
}

export async function deleteJoinRequest(id: string) {
  await db.delete(joinRequestsTable).where(eq(joinRequestsTable.id, id));
}

export async function getSettingsChange(id: string) {
  const rows = await db
    .select()
    .from(settingsChangesTable)
    .where(eq(settingsChangesTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSettingsChange(change: typeof settingsChangesTable.$inferInsert) {
  const rows = await db.insert(settingsChangesTable).values(change).returning();
  return rows[0];
}

export async function getReview(id: string) {
  const rows = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function upsertReview(review: typeof reviewsTable.$inferInsert) {
  const rows = await db
    .insert(reviewsTable)
    .values(review)
    .onConflictDoUpdate({ target: reviewsTable.id, set: { data: review.data } })
    .returning();
  return rows[0];
}
