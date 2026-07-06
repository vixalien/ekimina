import type {
  User,
  GroupMeta,
  ProposalText,
  PaymentIntent,
  SettingsChangeRequest,
} from "@ekimina/types";

export interface PendingRequestState {
  signed: Set<string>;
}
interface JoinRequestRecord {
  id: string;
  groupId: string;
  userId: string;
  status: string;
  requestedAt: string;
}

export const users = new Map<string, User>();
export const usersByAddress = new Map<`0x${string}`, User>();
export const groupMeta = new Map<`0x${string}`, GroupMeta>();
export const proposalTexts = new Map<string, ProposalText>();
export const paymentIntents = new Map<string, PaymentIntent>();
export const JWT_SECRET = "dev-secret-ekimina-2026";

export const pendingRequests = new Map<string, PendingRequestState | JoinRequestRecord>();
export const settingsChanges = new Map<string, SettingsChangeRequest>();
export const discretionaryReviews = new Map<string, Record<string, unknown>>();
export const joinRequestReviews = new Map<string, Record<string, unknown>>();
export const withdrawalReviews = new Map<string, Record<string, unknown>>();
export const loanReviews = new Map<string, PendingRequestState>();
