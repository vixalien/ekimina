import { pgTable, text, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  custodial: boolean("custodial").notNull().default(false),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const groupMeta = pgTable("group_meta", {
  address: text("address").primaryKey(),
  name: text("name").notNull(),
  inviteCode: text("invite_code"),
  createdAt: text("created_at").notNull(),
  creator: text("creator").notNull(),
});

export const proposalTexts = pgTable("proposal_texts", {
  proposalId: text("proposal_id").primaryKey(),
  purpose: text("purpose"),
  category: text("category"),
  reason: text("reason"),
  reasonCategory: text("reason_category"),
});

export const paymentIntents = pgTable("payment_intents", {
  id: text("id").primaryKey(),
  userAddress: text("user_address").notNull(),
  groupAddress: text("group_address").notNull(),
  purpose: text("purpose").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default("pending"),
  failureReason: text("failure_reason"),
  retryable: boolean("retryable").notNull().default(true),
  createdAt: text("created_at").notNull(),
  resultingTxId: text("resulting_tx_id"),
});

export const signingStates = pgTable("signing_states", {
  id: text("id").primaryKey(),
  signedBy: text("signed_by").array().notNull().default([]),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const settingsChanges = pgTable("settings_changes", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  field: text("field").notNull(),
  fieldLabel: text("field_label").notNull(),
  currentValue: text("current_value"),
  proposedValue: text("proposed_value").notNull(),
  requesterName: text("requester_name").notNull(),
  requesterInitials: text("requester_initials").notNull(),
  requesterUserId: text("requester_user_id").notNull(),
  signatureCount: integer("signature_count").notNull().default(1),
  signatureThreshold: integer("signature_threshold").notNull().default(2),
  signatures: jsonb("signatures").notNull().default([]),
  currentUserAlreadySigned: boolean("current_user_already_signed").notNull().default(true),
  currentUserSignedAt: text("current_user_signed_at"),
  createdAt: text("created_at").notNull(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  groupId: text("group_id").notNull(),
  data: jsonb("data").notNull(),
  createdAt: text("created_at").notNull(),
});
