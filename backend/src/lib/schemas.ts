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

const successOnlySchema = z.object({ success: z.boolean() });

const successWithIdSchema = z.object({ success: z.boolean(), requestId: z.string() });

const thresholdResultSchema = z.object({
  success: z.boolean(),
  thresholdMet: z.boolean(),
});

const txIdSchema = z.object({ txId: z.string() });

const memberStatusSchema = z.enum(["paid", "pending_late", "missed_penalised", "no_status"]);

const memberListItemSchema = z.object({
  userId: z.string(),
  initials: z.string(),
  name: z.string(),
  address: z.string(),
  status: memberStatusSchema,
  reputation: z.number(),
  activeLoanAmount: z.number().nullable(),
  penaltyCount: z.number(),
});

const memberStandingSchema = z.object({
  userId: z.string(),
  initials: z.string(),
  name: z.string(),
  status: memberStatusSchema,
});

const dashboardSchema = z.object({
  currentCycle: z.number(),
  totalCycles: z.number(),
  paidCount: z.number(),
  totalMemberCount: z.number(),
  reserveBalance: z.number(),
  reserveHistory: z.array(z.number()),
  contributionAmount: z.number(),
  payoutAmount: z.number(),
  nextPayoutRecipient: z.object({ name: z.string(), initials: z.string() }),
  daysUntilPayout: z.number(),
  members: z.array(memberStandingSchema),
});

const contributionEntrySchema = z.object({
  cycle: z.number(),
  status: z.enum(["paid_on_time", "paid_late", "missed"]),
  penaltyAmount: z.number().optional(),
});

const loanEntrySchema = z.object({
  id: z.string(),
  amount: z.number(),
  state: z.string(),
});

const memberDetailSchema = z.object({
  userId: z.string(),
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  joinedCycle: z.number(),
  reputation: z.number(),
  onTimeContributions: z.number(),
  totalContributions: z.number(),
  activeLoanCount: z.number(),
  penaltyCount: z.number(),
  contributionHistory: z.array(contributionEntrySchema),
  loans: z.array(loanEntrySchema),
  isCommitteeMember: z.boolean(),
});

const pendingRequestTypeSchema = z.enum([
  "loan_request",
  "discretionary_fund",
  "join_request",
  "member_withdrawal",
  "settings_change",
]);

const pendingRequestSchema = z.object({
  id: z.string(),
  type: pendingRequestTypeSchema,
  subject: z.string(),
  amountOrValue: z.string().optional(),
  signatureCount: z.number(),
  signatureThreshold: z.number(),
  timestamp: z.string(),
});

const outstandingLoanSchema = z.object({
  loanId: z.string(),
  borrowerName: z.string(),
  borrowerInitials: z.string(),
  borrowerUserId: z.string(),
  amount: z.number(),
  dueCycle: z.number(),
});

const transactionStatusSchema = z.enum(["confirmed", "pending", "failed"]);
const transactionDirectionSchema = z.enum(["inflow", "outflow", "neutral"]);
const transactionTypeSchema = z.enum([
  "contribution", "payout", "penalty", "loan_repayment",
  "loan_disbursement", "discretionary_deposit", "discretionary_withdrawal",
]);

const transactionSchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  memberName: z.string(),
  memberInitials: z.string(),
  memberId: z.string(),
  amount: z.number(),
  direction: transactionDirectionSchema,
  status: transactionStatusSchema,
  cycle: z.number(),
  timestamp: z.string(),
});

const loanSignatureSchema = z.object({
  userId: z.string(),
  name: z.string(),
  initials: z.string(),
  role: z.string().optional(),
  signed: z.boolean(),
  signedAt: z.string().optional(),
});

const loanStateSchema = z.enum([
  "requested", "signing", "approved", "disbursed",
  "repaying", "repaid", "defaulted",
]);

const loanDetailBaseSchema = z.object({
  loanId: z.string(),
  borrowerName: z.string(),
  borrowerInitials: z.string(),
  borrowerUserId: z.string(),
  borrowerRole: z.string(),
  borrowerJoinedCycle: z.number(),
  amount: z.number(),
  interestRate: z.number(),
  currentState: loanStateSchema,
  purpose: z.string(),
  deadline: z.string(),
});

const loanDetailSchema = loanDetailBaseSchema;

const loanReviewSchema = z.object({
  loanId: z.string(),
  borrowerName: z.string(),
  borrowerInitials: z.string(),
  borrowerUserId: z.string(),
  borrowerRole: z.string(),
  borrowerJoinedCycle: z.number(),
  borrowerReputation: z.number(),
  borrowerActiveLoanCount: z.number(),
  amount: z.number(),
  interestRate: z.number(),
  purpose: z.string(),
  deadline: z.string(),
  signatureThreshold: z.number(),
  collectedSignatures: z.number(),
  signatures: z.array(loanSignatureSchema),
  currentUserAlreadySigned: z.boolean(),
  currentUserSignedAt: z.string().optional(),
});

const groupSettingsSchema = z.object({
  name: z.string(),
  isPublic: z.boolean(),
  contributionAmount: z.number(),
  cycleLength: z.number(),
  payoutAmount: z.number(),
  penaltyRate: z.number(),
  approvalThreshold: z.number(),
  allMembersAreCommittee: z.boolean(),
  committeeSize: z.number(),
  loansEnabled: z.boolean(),
  loanInterestRate: z.number(),
  discretionaryFundEnabled: z.boolean(),
  groupPolicy: z.string(),
});

const committeeMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  initials: z.string(),
});

const userProfileSchema = z.object({
  userId: z.string(),
  name: z.string(),
  initials: z.string(),
  reputation: z.number(),
  onTimeStreak: z.number(),
  notificationsEnabled: z.boolean(),
  isCommitteeMember: z.boolean(),
});

const settingsFieldSchema = z.enum([
  "contribution_amount", "cycle_length", "penalty_rate", "payout_amount",
  "approval_threshold", "committee_size", "loan_interest_rate",
  "discretionary_fund", "group_policy",
]);

const settingsChangeSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  field: settingsFieldSchema,
  fieldLabel: z.string(),
  currentValue: z.string(),
  proposedValue: z.string(),
  requesterName: z.string(),
  requesterInitials: z.string(),
  requesterUserId: z.string(),
  signatureCount: z.number(),
  signatureThreshold: z.number(),
  signatures: z.array(loanSignatureSchema),
  currentUserAlreadySigned: z.boolean(),
  currentUserSignedAt: z.string().optional(),
  createdAt: z.string(),
});

const inviteDataSchema = z.object({
  inviteCode: z.string(),
  shareLink: z.string(),
  sentInvites: z.array(z.object({ phone: z.string(), sentAt: z.string() })),
});

const reservePointSchema = z.object({
  cycle: z.number(),
  balance: z.number(),
});

const reserveCycleSummarySchema = z.object({
  contributionsIn: z.number(),
  payoutOut: z.number(),
  penaltiesAbsorbed: z.number(),
  loanInterestIn: z.number(),
  loanDisbursed: z.number().optional(),
  discretionaryDeposits: z.number().optional(),
  discretionaryWithdrawals: z.number().optional(),
});

const reserveDetailSchema = z.object({
  balance: z.number(),
  history: z.array(reservePointSchema),
  projection6: z.array(reservePointSchema),
  projection12: z.array(reservePointSchema),
  cycleSummary: reserveCycleSummarySchema,
  insight: z.string(),
});

const leaveGroupInfoSchema = z.object({
  groupName: z.string(),
  isMidCycle: z.boolean(),
  contributionStanding: z.string(),
  outstandingLoanAmount: z.number().nullable(),
});

const discretionaryFundRequestSchema = z.object({
  direction: z.enum(["deposit", "withdrawal"]),
  amount: z.number(),
  category: z.string(),
  paidTo: z.string(),
  reason: z.string(),
});

const discretionaryReviewSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  requesterName: z.string(),
  requesterInitials: z.string(),
  requesterUserId: z.string(),
  direction: z.enum(["deposit", "withdrawal"]),
  amount: z.number(),
  category: z.string(),
  paidTo: z.string(),
  reason: z.string(),
  requestedAt: z.string(),
  signatureCount: z.number(),
  signatureThreshold: z.number(),
  signatures: z.array(loanSignatureSchema),
  currentUserAlreadySigned: z.boolean(),
  currentUserSignedAt: z.string().optional(),
});

const joinRequestReviewSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  applicantName: z.string(),
  applicantInitials: z.string(),
  applicantPhone: z.string(),
  joinMethod: z.enum(["invite_code", "direct_invite"]),
  inviteCode: z.string().optional(),
  requestedAt: z.string(),
  signatureCount: z.number(),
  signatureThreshold: z.number(),
  signatures: z.array(loanSignatureSchema),
  currentUserAlreadySigned: z.boolean(),
  currentUserSignedAt: z.string().optional(),
});

const memberWithdrawalReviewSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  memberName: z.string(),
  memberInitials: z.string(),
  memberUserId: z.string(),
  reasonCategory: z.string(),
  contributionRate: z.string(),
  penaltyCount: z.number(),
  outstandingLoanAmount: z.number().nullable(),
  requestedAt: z.string(),
  signatureCount: z.number(),
  signatureThreshold: z.number(),
  signatures: z.array(loanSignatureSchema),
  currentUserAlreadySigned: z.boolean(),
  currentUserSignedAt: z.string().optional(),
});

const proposalViewSchema = z.object({
  id: z.string(),
  groupAddress: addressSchema,
  proposer: addressSchema,
  approvals: z.array(z.object({
    member: addressSchema,
    approved: z.boolean(),
  })),
  threshold: z.number(),
  state: z.enum(["pending", "active", "approved", "executed", "rejected"]),
  createdAt: isoDateSchema,
  resultingTxId: z.string().nullable(),
});

const paymentIntentSchema = z.object({
  id: z.string(),
  userAddress: addressSchema,
  groupAddress: addressSchema,
  purpose: z.enum(["contribution", "loan_repayment"]),
  amount: z.string(),
  status: z.enum(["pending", "confirmed", "failed"]),
  failureReason: z.string().nullable(),
  retryable: z.boolean(),
  createdAt: z.string(),
  resultingTxId: z.string().nullable(),
});

const createGroupResultSchema = z.object({
  group: addressSchema,
  inviteCode: z.string(),
});

const joinResultSchema = z.object({
  group: addressSchema,
});

const proposalDraftSchema = z.object({
  kind: z.enum(["loan", "discretionary", "settings", "member_exit"]),
}).passthrough();

export {
  successOnlySchema,
  successWithIdSchema,
  thresholdResultSchema,
  txIdSchema,
  memberListItemSchema,
  memberStandingSchema,
  dashboardSchema,
  memberDetailSchema,
  pendingRequestSchema,
  outstandingLoanSchema,
  transactionSchema,
  loanSignatureSchema,
  loanDetailSchema,
  loanReviewSchema,
  groupSettingsSchema,
  committeeMemberSchema,
  userProfileSchema,
  settingsChangeSchema,
  inviteDataSchema,
  reserveDetailSchema,
  leaveGroupInfoSchema,
  discretionaryFundRequestSchema,
  discretionaryReviewSchema,
  joinRequestReviewSchema,
  memberWithdrawalReviewSchema,
  proposalViewSchema,
  paymentIntentSchema,
  createGroupResultSchema,
  joinResultSchema,
  proposalDraftSchema,
};
