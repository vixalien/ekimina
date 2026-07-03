// ============================================================
// client.ts
// The client plane. It defines almost no new stored data. It holds:
//   1. friendly aliases for single-plane types the UI consumes directly
//   2. ProposalView, the one genuine merge (chain envelope + backend text)
//   3. the device-side CustodyApi
//   4. the DataClient facade, which REUSES chain.ts + backend.ts interfaces
//   5. the contract for computed-only helpers (never stored, never served)
//
// Import DAG: primitives <- chain <- backend <- client. No cycles.
// ============================================================

import type {
  Address,
  BaseUnit,
  Bps,
  ISODate,
  ProposalState,
} from "./primitives";
import type {
  ChainGroup,
  ChainCycleState,
  ChainMember,
  ChainLoan,
  Approval,
  Transaction,
  TransactionFilters,
  ReservePoint,
} from "./chain";
import type {
  AuthApi,
  ProfileApi,
  LookupApi,
  PaymentApi,
  GroupMeta,
} from "./backend";

// ---- Friendly aliases (single-plane, no merge needed) ------

export type Group = ChainGroup;
export type CycleState = ChainCycleState;
export type Member = ChainMember; // roleless: address + isCommitteeMember + joinedCycle
export type Loan = ChainLoan;

// ---- Display money ([computed] at the UI edge) -------------

export type DisplayCurrency = "USDm" | "RWF";

export interface DisplayAmount {
  raw: BaseUnit;
  currency: DisplayCurrency; // RWF via mocked bridge rate
}

// ---- Proposal view (chain envelope + threshold + backend text) ----

interface ProposalViewBase {
  id: string;
  groupAddress: Address;
  proposer: Address;
  approvals: Approval[];
  /** [computed] ceil(committeeSize * approvalThresholdBps / 10000) */
  threshold: number;
  state: ProposalState;
  createdAt: ISODate;
  resultingTxId: string | null;
}

export interface LoanProposalView extends ProposalViewBase {
  kind: "loan";
  borrower: Address;
  amount: BaseUnit;
  interestBps: Bps;
  dueCycle: number;
  purpose: string; // backend text
}

export interface DiscretionaryProposalView extends ProposalViewBase {
  kind: "discretionary";
  recipient: Address;
  amount: BaseUnit;
  category: string; // backend text
  reason: string; // backend text
}

export interface SettingsProposalView extends ProposalViewBase {
  kind: "settings";
  /** single-field diff, [computed] by comparing proposedGroup to the current Group */
  field: keyof Group;
  currentValue: string;
  proposedValue: string;
}

export interface MemberExitProposalView extends ProposalViewBase {
  kind: "member_exit";
  member: Address;
  settlementAmount: BaseUnit;
  reasonCategory: string; // backend text
}

export type ProposalView =
  | LoanProposalView
  | DiscretionaryProposalView
  | SettingsProposalView
  | MemberExitProposalView;

// ---- Create-proposal draft (carries chain params + backend text) ----
// The facade splits this: params to chain.createProposal, text to
// backend.saveText. For settings the single field is expanded against the
// current Group into the full proposedGroup before the chain call.

export type ProposalDraft =
  | { kind: "loan"; borrower: Address; amount: BaseUnit; interestBps: Bps; dueCycle: number; purpose: string }
  | { kind: "discretionary"; recipient: Address; amount: BaseUnit; category: string; reason: string }
  | { kind: "settings"; field: keyof Group; proposedValue: string }
  | { kind: "member_exit"; member: Address; settlementAmount: BaseUnit; reasonCategory: string };

// ---- Custody (device-side, not backend HTTP) ---------------

export interface CustodyApi {
  /** app path: import an EVM account, stored device-side, never sent to backend */
  importAccount(secret: string, pin: string): Promise<{ address: Address }>;
  /** phone path: backend-provisioned encrypted key, cached locally, unlocked with PIN */
  unlock(pin: string): Promise<{ address: Address }>;
  currentAddress(): Promise<Address | null>;
}

// ---- Facade reads (reuse IndexerApi + ProposalTextApi) -----
// Mostly return chain types verbatim; only proposals get merged into views.

export interface GroupReads {
  myGroups(address: Address): Promise<GroupMeta[]>;
  getGroup(group: Address): Promise<Group>;
  getCycleState(group: Address): Promise<CycleState>;
  getMembers(group: Address): Promise<Member[]>;
  listTransactions(group: Address, filters?: TransactionFilters): Promise<Transaction[]>;
  getTransaction(group: Address, txId: string): Promise<Transaction>;
  listProposals(group: Address, state?: ProposalState): Promise<ProposalView[]>;
  getProposal(group: Address, id: string): Promise<ProposalView>;
  listLoans(group: Address, borrower?: Address): Promise<Loan[]>;
  getLoan(group: Address, id: string): Promise<Loan>;
  getReserveHistory(group: Address): Promise<ReservePoint[]>;
}

// ---- Facade writes (reuse ChainWriteApi + backend text/relay) ----
// draft-aware, so it differs from the raw ChainWriteApi (which takes params).

export interface GroupActions {
  createGroup(group: Group, name: string): Promise<{ group: Address; inviteCode: string }>;
  join(code: string): Promise<{ group: Address }>;
  contribute(group: Address): Promise<{ txId: string }>;
  triggerPayout(group: Address): Promise<{ txId: string }>;
  startRotation(group: Address, order: Address[]): Promise<{ txId: string }>;
  repayLoan(group: Address, loanId: string): Promise<{ txId: string }>;
  shareOut(group: Address): Promise<{ txId: string }>;
  createProposal(group: Address, draft: ProposalDraft): Promise<{ id: string }>;
  approveProposal(group: Address, id: string): Promise<{ id: string; executed: boolean }>;
  rejectProposal(group: Address, id: string): Promise<{ id: string }>;
}

export interface DataClient {
  auth: AuthApi;
  custody: CustodyApi;
  profile: ProfileApi;
  lookup: LookupApi;
  payments: PaymentApi;
  groups: GroupReads;
  actions: GroupActions;
}

// ============================================================
// [computed] contract. NOT served, NOT stored. Pure functions over the
// types above, implemented once in UI helpers:
//
//   initials(name: string): string
//   memberCount(members: Member[]): number
//   paymentStatus(tx, deadline): "on_time" | "late"   // "missed" is a real PenaltyTx
//   daysUntilPayout(cycle: CycleState): number
//   onTimeStreak(txs: Transaction[], member: Address): number
//   hasApproved(p: ProposalView, me: Address): boolean
//   approvedAt(p: ProposalView, me: Address): ISODate | null
//   threshold(members: Member[], group: Group): number
//   projectReserve(history: ReservePoint[], cycles: number): ReservePoint[]
//   reserveInsight(history: ReservePoint[], group: Group): string
//   cycleSummary(txs: Transaction[], cycle: number): { in; out; penalties; ... }
//   toDisplay(raw: BaseUnit, currency: DisplayCurrency, rate?): DisplayAmount
// ============================================================
