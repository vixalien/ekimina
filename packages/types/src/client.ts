import type { AuthApi, ProfileApi, LookupApi, PaymentApi, GroupMeta } from "./backend.js";
import type {
  Group as ChainGroup,
  GroupCycle as ChainCycleState,
  GroupMember as ChainMember,
  GroupLoan as ChainLoan,
  Approval,
  Transaction as ChainTransaction,
  ReservePoint,
} from "./chain.js";
import type { Address, BaseUnit, Bps, ISODate, ProposalState } from "./primitives.js";
import type {
  GroupDashboardData,
  MemberListItem,
  MemberDetail,
  ActivityPendingRequest,
  OutstandingLoan,
  Transaction as ScreenTransaction,
  TransactionDetail,
  LoanDetail,
  LoanRequestReview,
  GroupSettings,
  UserProfile,
  CommitteeMember,
  SettingsChangeRequest,
  GroupInviteData,
  ReserveDetail,
  LeaveGroupInfo,
  DiscretionaryFundRequest,
} from "./screen.js";

export type Group = ChainGroup;
export type CycleState = ChainCycleState;
export type Member = ChainMember;
export type Loan = ChainLoan;

export type DisplayCurrency = "USDm" | "RWF";

export interface DisplayAmount {
  raw: BaseUnit;
  currency: DisplayCurrency;
}

interface ProposalViewBase {
  id: string;
  groupAddress: Address;
  proposer: Address;
  approvals: Approval[];
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
  purpose: string;
}

export interface DiscretionaryProposalView extends ProposalViewBase {
  kind: "discretionary";
  recipient: Address;
  amount: BaseUnit;
  category: string;
  reason: string;
}

export interface SettingsProposalView extends ProposalViewBase {
  kind: "settings";
  field: keyof Group;
  currentValue: string;
  proposedValue: string;
}

export interface MemberExitProposalView extends ProposalViewBase {
  kind: "member_exit";
  member: Address;
  settlementAmount: BaseUnit;
  reasonCategory: string;
}

export type ProposalView =
  | LoanProposalView
  | DiscretionaryProposalView
  | SettingsProposalView
  | MemberExitProposalView;

export type ProposalDraft =
  | {
      kind: "loan";
      borrower: Address;
      amount: BaseUnit;
      interestBps: Bps;
      dueCycle: number;
      purpose: string;
    }
  | {
      kind: "discretionary";
      recipient: Address;
      amount: BaseUnit;
      category: string;
      reason: string;
    }
  | { kind: "settings"; field: keyof Group; proposedValue: string }
  | { kind: "member_exit"; member: Address; settlementAmount: BaseUnit; reasonCategory: string };

export interface CustodyApi {
  importAccount(secret: string, pin: string): Promise<{ address: Address }>;
  createAccount(): Promise<{ address: Address }>;
  unlock(pin: string): Promise<{ address: Address }>;
  currentAddress(): Promise<Address | null>;
}

export interface GroupReads {
  myGroups(address: Address): Promise<GroupMeta[]>;
  getGroup(group: Address): Promise<Group>;
  getCycleState(group: Address): Promise<CycleState>;
  getMembers(group: Address): Promise<Member[]>;
  listTransactions(
    group: Address,
    filters?: {
      types?: string[];
      memberIds?: string[];
      actors?: Address[];
      cycleRange?: { from: number; to: number };
      datePreset?: "all" | "this_week" | "this_month" | "last_30";
    },
  ): Promise<ChainTransaction[]>;
  getTransaction(group: Address, txId: string): Promise<ChainTransaction>;
  listProposals(group: Address, state?: ProposalState): Promise<ProposalView[]>;
  getProposal(group: Address, id: string): Promise<ProposalView>;
  listLoans(group: Address, borrower?: Address): Promise<Loan[]>;
  getLoan(group: Address, id: string): Promise<Loan>;
  getReserveHistory(group: Address): Promise<ReservePoint[]>;
  getGroupDashboard(group: Address): Promise<GroupDashboardData>;
  getGroupMembers(group: Address): Promise<MemberListItem[]>;
  searchMembers(group: Address, query: string): Promise<MemberListItem[]>;
  getMemberDetail(group: Address, userId: string, requestingUserId: string): Promise<MemberDetail>;
  getPendingRequests(group: Address): Promise<ActivityPendingRequest[]>;
  getOutstandingLoans(group: Address): Promise<OutstandingLoan[]>;
  getRecentTransactions(group: Address, limit?: number): Promise<ScreenTransaction[]>;
  getTransactions(
    group: Address,
    filters?: {
      types?: string[];
      memberIds?: string[];
      actors?: Address[];
      cycleRange?: { from: number; to: number };
      datePreset?: "all" | "this_week" | "this_month" | "last_30";
    },
  ): Promise<ScreenTransaction[]>;
  getTransactionDetail(group: Address, transactionId: string): Promise<TransactionDetail>;
  getLoanDetail(group: Address, loanId: string): Promise<LoanDetail>;
  getLoanRequestReview(group: Address, loanId: string): Promise<LoanRequestReview>;
  getGroupSettings(group: Address): Promise<GroupSettings>;
  getUserProfile(group: Address, userId: string): Promise<UserProfile>;
  getCommitteeMembers(group: Address): Promise<CommitteeMember[]>;
  getSettingsChangeReview(group: Address, requestId: string): Promise<SettingsChangeRequest>;
  getGroupInviteData(group: Address): Promise<GroupInviteData>;
  getGroupDetails(group: string): Promise<any>;
  getReserveDetail(group: Address): Promise<ReserveDetail>;
  getLeaveGroupInfo(group: Address, userId: string): Promise<LeaveGroupInfo>;
  updateNotifications(userId: string, enabled: boolean): Promise<{ success: boolean }>;
  verifyPin(userId: string, pin: string): Promise<{ success: boolean }>;
  leaveGroup(group: Address, userId: string): Promise<{ success: boolean }>;
  submitSettingsChange(
    group: Address,
    field: string,
    proposedValue: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  signSettingsChange(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectSettingsChange(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  signLoanRequest(
    group: Address,
    loanId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectLoanRequest(group: Address, loanId: string, userId: string): Promise<{ success: boolean }>;
  initiateWithdrawal(
    group: Address,
    memberId: string,
    requestingUserId: string,
    reasonCategory: string,
  ): Promise<{ success: boolean; requestId: string }>;
  signMemberWithdrawal(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectMemberWithdrawal(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  sendPhoneInvite(group: Address, phone: string): Promise<{ success: boolean }>;
  // Onboarding
  createGroup(payload: any): Promise<any>;
  joinByInviteCode(userId: string, code: string): Promise<any>;
  cancelJoinRequest(requestId: string): Promise<{ success: boolean }>;
  searchPublicGroups(query: string): Promise<any[]>;
  requestToJoinGroup(groupId: string, userId: string): Promise<any>;
  // Transactions
  retryTransaction(transactionId: string): Promise<{ success: boolean }>;
  // Discretionary
  submitDiscretionaryRequest(
    group: Address,
    userId: string,
    req: any,
  ): Promise<{ success: boolean }>;
  getDiscretionaryReview(group: Address, requestId: string): Promise<any>;
  signDiscretionaryRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectDiscretionaryRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  // Join requests
  getJoinRequestReview(group: Address, requestId: string): Promise<any>;
  signJoinRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectJoinRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  getMemberWithdrawalReview(group: Address, requestId: string): Promise<any>;
}

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
  signLoanRequest(
    group: Address,
    loanId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectLoanRequest(group: Address, loanId: string, userId: string): Promise<{ success: boolean }>;
  signSettingsChange(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectSettingsChange(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  submitSettingsChange(
    group: Address,
    field: string,
    proposedValue: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  updateNotifications(userId: string, enabled: boolean): Promise<{ success: boolean }>;
  leaveGroup(group: Address, userId: string): Promise<{ success: boolean }>;
  verifyPin(userId: string, pin: string): Promise<{ success: boolean }>;
  initiateWithdrawal(
    group: Address,
    memberId: string,
    requestingUserId: string,
    reasonCategory: string,
  ): Promise<{ success: boolean; requestId: string }>;
  signMemberWithdrawal(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectMemberWithdrawal(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  sendPhoneInvite(group: Address, phone: string): Promise<{ success: boolean }>;
  signJoinRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectJoinRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  signDiscretionaryRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectDiscretionaryRequest(
    group: Address,
    requestId: string,
    userId: string,
  ): Promise<{ success: boolean }>;
  submitDiscretionaryRequest(
    group: Address,
    userId: string,
    req: DiscretionaryFundRequest,
  ): Promise<{ success: boolean }>;
}

export interface DataClient {
  auth: AuthApi;
  custody?: CustodyApi;
  profile: ProfileApi;
  lookup: LookupApi;
  payments: PaymentApi;
  groups: GroupReads;
  actions: GroupActions;
}
