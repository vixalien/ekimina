// ============================================================
// chain.ts
// The on-chain plane: types the contract stores/returns, plus the
// write surface the app calls via viem (USSD relays through the backend,
// same surface). No PII, no display text, identity is always an Address,
// money is always a BaseUnit string.
//
// Naming: Group / GroupCycle / GroupMember / GroupLoan are consumed by the
// UI directly (no richer view exists). Only proposals have a client-side
// merge, so the raw envelope keeps the Chain prefix (ChainProposal) to mark
// that ProposalView in client.ts is the enriched counterpart.
//
// Event-derived data (transactions, approvals, per-cycle reserve balances)
// lives here too: events are on-chain, the indexer just decodes them.
// ============================================================

import type {
  Address,
  BaseUnit,
  Bps,
  ISODate,
  PayoutPolicy,
  ProposalKind,
  ProposalState,
  LoanState,
  TransactionType,
} from "./primitives";

// ---- Group: the on-chain group record ----------------------
// Set at construction, changed only by an executed settings proposal.

export interface Group {
  contributionAmount: BaseUnit;
  cycleLength: number; // seconds, the length of one round
  payoutAmount: BaseUnit; // may be "0"
  payoutPolicy: PayoutPolicy;
  penaltyRateBps: Bps;
  approvalThresholdBps: Bps;
  loansEnabled: boolean;
  discretionaryEnabled: boolean;
  /** true = every active member is on the committee (threshold runs against active count). Pilot default. */
  allMembersCommittee: boolean;
}

export interface GroupCycle {
  /** monotonic round counter, never resets. Rotations continue until dissolve. */
  currentCycle: number;
  /** turns in one full rotation = active member count. Position in rotation is computed. */
  rotationLength: number;
  cycleStart: ISODate;
  /** carries across rotations; only distributed on dissolve */
  reserveBalance: BaseUnit;
  paidCount: number;
  memberCount: number;
  // Rotation order is NOT stored. It is join order over active members,
  // derived client-side. See payoutOrder() in the computed contract.
}

// ---- Membership --------------------------------------------
// Only what the contract knows: the address, whether it is in the
// committee set, the cycle it joined (MemberJoined event), and whether it
// is still active. No role, no title.

export interface GroupMember {
  address: Address;
  isCommitteeMember: boolean;
  joinedCycle: number;
  /** false once an exit proposal executes. The slot is kept so join-order rotation never shifts. */
  active: boolean;
}

// ---- Vote (from ProposalApproved / ProposalRejected events) ----
// Same shape for both directions: who voted and when.

export interface Approval {
  approver: Address;
  at: ISODate;
}

// ---- Proposal envelope (on-chain fields only) --------------
// Typed params carry only what the contract needs to execute.
// Text (purpose, reason, category) is off-chain, see backend.ts.
// A proposal passes when approvals reach threshold, and auto-rejects
// when committeeSize - rejections < threshold (approval became impossible).

interface ChainProposalBase {
  id: string;
  groupAddress: Address;
  kind: ProposalKind;
  proposer: Address;
  approvals: Approval[]; // event-derived
  rejections: Approval[]; // event-derived, same shape (reject votes)
  state: ProposalState;
  createdAt: ISODate;
  resultingTxId: string | null; // set once executed
}

export interface ChainLoanProposal extends ChainProposalBase {
  kind: "loan";
  borrower: Address;
  amount: BaseUnit;
  interestBps: Bps;
  dueCycle: number;
}

export interface ChainDiscretionaryProposal extends ChainProposalBase {
  kind: "discretionary";
  recipient: Address;
  amount: BaseUnit;
}

export interface ChainSettingsProposal extends ChainProposalBase {
  kind: "settings";
  proposedGroup: Group; // whole record swapped atomically
}

export interface ChainMemberExitProposal extends ChainProposalBase {
  kind: "member_exit";
  member: Address;
  settlementAmount: BaseUnit;
}

/** Winds the group down: equal-minus-penalties share-out of the reserve, then closed. No params. */
export interface ChainDissolveProposal extends ChainProposalBase {
  kind: "dissolve";
}

export type ChainProposal =
  | ChainLoanProposal
  | ChainDiscretionaryProposal
  | ChainSettingsProposal
  | ChainMemberExitProposal
  | ChainDissolveProposal;

/** Params passed to createProposal on chain (no text, that goes to the backend). */
export type ChainProposalParams =
  | { kind: "loan"; borrower: Address; amount: BaseUnit; interestBps: Bps; dueCycle: number }
  | { kind: "discretionary"; recipient: Address; amount: BaseUnit }
  | { kind: "settings"; proposedGroup: Group }
  | { kind: "member_exit"; member: Address; settlementAmount: BaseUnit }
  | { kind: "dissolve" };

// ---- Active loan (exists only after a loan proposal executes) ----

export interface GroupLoan {
  id: string;
  groupAddress: Address;
  sourceProposalId: string;
  borrower: Address;
  principal: BaseUnit;
  interestBps: Bps;
  totalOwed: BaseUnit;
  amountPaid: BaseUnit;
  dueCycle: number;
  state: LoanState;
}

// ---- Transaction log (decoded events, immutable, success-only) ----

interface TxBase {
  id: string; // txHash + logIndex
  groupAddress: Address;
  type: TransactionType;
  actor: Address;
  amount: BaseUnit | null; // null for non-financial events
  cycle: number;
  timestamp: ISODate;
  sourceProposalId: string | null;
}

export interface ContributionTx extends TxBase { type: "contribution" }
export interface PayoutTx extends TxBase { type: "payout"; recipient: Address }
export interface PenaltyTx extends TxBase { type: "penalty"; member: Address }
export interface LoanDisbursementTx extends TxBase { type: "loan_disbursement"; loanId: string; recipient: Address }
export interface LoanRepaymentTx extends TxBase { type: "loan_repayment"; loanId: string }
export interface DiscretionaryTx extends TxBase { type: "discretionary_disbursement"; recipient: Address }
export interface ShareOutTx extends TxBase { type: "share_out"; recipient: Address }
export interface MemberJoinedTx extends TxBase { type: "member_joined"; amount: null }
export interface MemberExitedTx extends TxBase { type: "member_exited"; recipient: Address }

export type Transaction =
  | ContributionTx
  | PayoutTx
  | PenaltyTx
  | LoanDisbursementTx
  | LoanRepaymentTx
  | DiscretionaryTx
  | ShareOutTx
  | MemberJoinedTx
  | MemberExitedTx;

export interface TransactionFilters {
  types?: TransactionType[];
  actors?: Address[];
  cycleRange?: { from: number; to: number };
  datePreset?: "all" | "this_week" | "this_month" | "last_30";
}

// ---- Reserve history (per-cycle balances, event-derived) ----

export interface ReservePoint {
  cycle: number;
  balance: BaseUnit;
}

// ---- Chain write surface -----------------------------------
// App calls these directly via viem. For custodial (USSD) users the backend
// relays the identical calls with the backend-held key.
// No shareOut here: it happens only via an executed dissolve proposal.

export interface ChainWriteApi {
  /** factory deploy; inviteCodeHash = keccak256(auto-generated 5-char code). No order passed: rotation is join order. */
  createGroup(group: Group, inviteCodeHash: string): Promise<{ group: Address }>;
  join(group: Address, code: string): Promise<{ txId: string }>;
  contribute(group: Address): Promise<{ txId: string }>;
  /** permissionless + time guard. Pays the current turn, then rolls into a fresh cycle; reserve carries. A backend cron can call this. */
  triggerPayout(group: Address): Promise<{ txId: string }>;
  repayLoan(group: Address, loanId: string): Promise<{ txId: string }>;
  createProposal(group: Address, params: ChainProposalParams): Promise<{ id: string }>;
  /** records an approval; may auto-execute if this vote meets threshold */
  approveProposal(group: Address, id: string): Promise<{ id: string; executed: boolean }>;
  /** records a reject vote; may auto-reject once approval becomes impossible */
  rejectProposal(group: Address, id: string): Promise<{ id: string; rejected: boolean }>;
  rotateInviteCode(group: Address, newHash: string): Promise<{ txId: string }>;
}
