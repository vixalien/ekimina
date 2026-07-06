import type { User, GroupMeta, ProposalText, PaymentIntent } from "@ekimina/types";

export const users = new Map<string, User>();
export const usersByAddress = new Map<`0x${string}`, User>();
export const groupMeta = new Map<`0x${string}`, GroupMeta>();
export const proposalTexts = new Map<string, ProposalText>();
export const paymentIntents = new Map<string, PaymentIntent>();
export const JWT_SECRET = "dev-secret-ekimina-2026";

export const pendingRequests = new Map<string, any>();
export const settingsChanges = new Map<string, any>();
export const discretionaryReviews = new Map<string, any>();
export const joinRequestReviews = new Map<string, any>();
export const withdrawalReviews = new Map<string, any>();
export const loanReviews = new Map<string, any>();
