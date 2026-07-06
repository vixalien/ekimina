import { z } from "@hono/zod-openapi";

export const errorSchema = z.object({ error: z.string() });

export const errorResponses = {
  400: { content: { "application/json": { schema: errorSchema } }, description: "Bad request" },
  401: { content: { "application/json": { schema: errorSchema } }, description: "Unauthorized" },
  404: { content: { "application/json": { schema: errorSchema } }, description: "Not found" },
  500: { content: { "application/json": { schema: errorSchema } }, description: "Server error" },
} as const;

export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const phoneSchema = z.string().regex(/^\+?\d{7,15}$/);
export const otpCodeSchema = z.string().length(6);
export const isoDateSchema = z.string().datetime();

export const userSchema = z.object({
  id: z.string(),
  address: addressSchema,
  name: z.string().nullable(),
  phone: phoneSchema.nullable(),
  custodial: z.boolean(),
  notificationsEnabled: z.boolean(),
});

export const authResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("existing"), token: z.string(), user: userSchema }),
  z.object({ status: z.literal("created"), token: z.string(), user: userSchema }),
]);

export const groupMetaSchema = z.object({
  address: addressSchema,
  name: z.string(),
  inviteCode: z.string().nullable(),
  createdAt: isoDateSchema,
  creator: addressSchema,
});

export const groupConfigSchema = z.object({
  contributionAmount: z.string(),
  cycleLength: z.number(),
  payoutAmount: z.string(),
  payoutPolicy: z.enum(["none", "rotating", "lump_sum_end"]),
  penaltyRateBps: z.number(),
  approvalThresholdBps: z.number(),
  loansEnabled: z.boolean(),
  discretionaryEnabled: z.boolean(),
  allMembersCommittee: z.boolean(),
});

export const groupCycleSchema = z.object({
  currentCycle: z.number(),
  rotationLength: z.number(),
  cycleStart: isoDateSchema,
  reserveBalance: z.string(),
  paidCount: z.number(),
  memberCount: z.number(),
});

export const memberSchema = z.object({
  address: addressSchema,
  isCommitteeMember: z.boolean(),
  joinedCycle: z.number(),
  active: z.boolean(),
});

export const lookupNamesResultSchema = z.record(addressSchema, z.string().nullable());
