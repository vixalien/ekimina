// ============================================================
// backend.ts
// The off-chain plane: data the thin backend actually owns, plus the
// operations it serves. PII, custody provisioning, invite resolution,
// proposal text, payment intents, and the indexer that mirrors chain
// events into a fast read cache.
//
// The indexer returns CHAIN types (chain.ts), it does not invent new
// shapes. It just serves cached chain data. Enrichment into view-models
// happens in client.ts, which composes these interfaces.
// ============================================================

import type {
  Group,
  GroupCycle,
  GroupMember,
  ChainProposal,
  GroupLoan,
  Transaction,
  TransactionFilters,
  ReservePoint,
} from "./chain.js";
import type { Address, BaseUnit, ISODate, ProposalState } from "./primitives.js";

// ---- Global identity ---------------------------------------

export interface User {
  id: string;
  address: Address;
  name: string | null;
  /** present only on the phone/USSD path */
  phone: string | null;
  /** true = backend custodies the PIN-encrypted key (phone/USSD). false = device-held (app import). */
  custodial: boolean;
  notificationsEnabled: boolean;
}

// ---- Group metadata + invite -------------------------------

export interface GroupMeta {
  address: Address;
  name: string;
  /** plaintext invite code that resolves to the address; rotatable by committee */
  inviteCode: string | null;
  createdAt: ISODate;
  creator: Address;
}

// ---- Proposal text (off-chain half of a proposal) ----------
// Joined to the on-chain envelope by proposalId. Only fields relevant to
// the proposal's kind are populated.

export interface ProposalText {
  proposalId: string;
  purpose?: string; // loan
  category?: string; // discretionary
  reason?: string; // discretionary
  reasonCategory?: string; // member_exit
}

// ---- Payment intent (MoMo / bridge, off-chain lifecycle) ----
// Separate from the on-chain log. pending/failed/retryable live here.
// A failed payment never became a Transaction.

export type PaymentIntentStatus = "pending" | "confirmed" | "failed";

export interface PaymentIntent {
  id: string;
  userAddress: Address;
  groupAddress: Address;
  purpose: "contribution" | "loan_repayment";
  amount: BaseUnit;
  status: PaymentIntentStatus;
  failureReason: string | null;
  retryable: boolean;
  createdAt: ISODate;
  resultingTxId: string | null;
}

export type AuthResult =
  | { status: "existing"; token: string; user: User }
  | { status: "created"; token: string; user: User };

// ---- Backend operations ------------------------------------

export interface AuthApi {
  sendOtp(phone: string): Promise<{ sent: boolean }>;
  verifyOtp(phone: string, code: string): Promise<AuthResult>;
}

export interface ProfileApi {
  getUser(address: Address): Promise<User>;
  updateName(name: string): Promise<User>;
  updateNotifications(enabled: boolean): Promise<{ ok: boolean }>;
}

export interface LookupApi {
  /** the only path by which names enter the client: addresses in, display names out */
  resolveNames(addresses: Address[]): Promise<Record<Address, string>>;
  groupByInviteCode(code: string): Promise<GroupMeta | null>;
}

export interface PaymentApi {
  createIntent(input: {
    userAddress: Address;
    groupAddress: Address;
    purpose: PaymentIntent["purpose"];
    amount: BaseUnit;
  }): Promise<PaymentIntent>;
  getIntent(id: string): Promise<PaymentIntent>;
  retryIntent(id: string): Promise<PaymentIntent>;
}

/** Off-chain proposal text store. */
export interface ProposalTextApi {
  getTexts(proposalIds: string[]): Promise<Record<string, ProposalText>>;
  saveText(text: ProposalText): Promise<{ ok: boolean }>;
}

/** Indexer: cached chain reads. Returns chain types verbatim. */
export interface IndexerApi {
  myGroups(address: Address): Promise<GroupMeta[]>;
  getGroup(group: Address): Promise<Group>;
  getCycleState(group: Address): Promise<GroupCycle>;
  getMembers(group: Address): Promise<GroupMember[]>;
  listTransactions(group: Address, filters?: TransactionFilters): Promise<Transaction[]>;
  getTransaction(group: Address, txId: string): Promise<Transaction>;
  listProposals(group: Address, state?: ProposalState): Promise<ChainProposal[]>;
  getProposal(group: Address, id: string): Promise<ChainProposal>;
  listLoans(group: Address, borrower?: Address): Promise<GroupLoan[]>;
  getLoan(group: Address, id: string): Promise<GroupLoan>;
  getReserveHistory(group: Address): Promise<ReservePoint[]>;
}
