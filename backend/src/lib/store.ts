import type { User, GroupMeta, ProposalText, PaymentIntent } from "@ekimina/types";

export const users = new Map<string, User>();
export const usersByAddress = new Map<`0x${string}`, User>();
export const groupMeta = new Map<`0x${string}`, GroupMeta>();
export const proposalTexts = new Map<string, ProposalText>();
export const paymentIntents = new Map<string, PaymentIntent>();
export const JWT_SECRET = "dev-secret-ekimina-2026";
