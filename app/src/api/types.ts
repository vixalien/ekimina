export interface User {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  isPublic: boolean;
  inviteCode: string | null;
  avatarInitials: string;
  createdAt: string;
}

export interface GroupMembership {
  group: Group;
  role: "admin" | "treasurer" | "secretary" | "member";
  joinedAt: string;
}

export interface PublicGroup {
  id: string;
  name: string;
  memberCount: number;
  avatarInitials: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedAt: string;
}

export type OtpVerificationResult =
  | { status: "new_user"; user: User; token: string }
  | { status: "no_groups"; user: User; token: string }
  | { status: "one_group"; user: User; token: string; membership: GroupMembership }
  | { status: "multiple_groups"; user: User; token: string; memberships: GroupMembership[] }
  | { status: "invitation_pending"; user: User; token: string; request: JoinRequest };

export interface StatusResult {
  user: User;
  groupStatus: "one_group" | "multiple_groups" | "no_groups" | "invitation_pending";
  pendingRequest?: { requestId: string; groupName: string; requestedAt: string };
}

export interface AuthApi {
  sendOtp(phone: string): Promise<{ success: boolean }>;
  resendOtp(phone: string): Promise<{ success: boolean }>;
  verifyOtp(phone: string, code: string): Promise<OtpVerificationResult>;
  getStatus(token: string): Promise<StatusResult>;
  updateProfile(token: string, name: string): Promise<User>;
}

export interface ContributionHistoryEntry {
  cycle: number;
  status: "paid_on_time" | "paid_late" | "missed";
  penaltyAmount?: number;
}

export interface LoanEntry {
  id: string;
  amount: number;
  state: string;
}

export interface MemberListItem {
  userId: string;
  initials: string;
  name: string;
  status: MemberStanding["status"];
  reputation: number;
  activeLoanAmount: number | null;
  penaltyCount: number;
}

export interface MemberDetail {
  userId: string;
  name: string;
  initials: string;
  role: string;
  joinedCycle: number;
  reputation: number;
  onTimeContributions: number;
  totalContributions: number;
  activeLoanCount: number;
  penaltyCount: number;
  contributionHistory: ContributionHistoryEntry[];
  loans: LoanEntry[];
  isCommitteeMember: boolean;
}

export interface GroupsApi {
  myGroups(userId: string): Promise<GroupMembership[]>;
  joinByInviteCode(userId: string, code: string): Promise<JoinRequest>;
  searchPublicGroups(query: string): Promise<PublicGroup[]>;
  getGroupDetails(groupId: string): Promise<PublicGroup>;
  requestToJoinGroup(userId: string, groupId: string): Promise<JoinRequest>;
  getJoinRequestStatus(requestId: string): Promise<JoinRequest>;
  cancelJoinRequest(requestId: string): Promise<{ success: boolean }>;
  createGroup(payload: CreateGroupPayload): Promise<CreateGroupResult>;
  getGroupDashboard(groupId: string): Promise<GroupDashboardData>;
  getGroupMembers(groupId: string): Promise<MemberListItem[]>;
  searchMembers(groupId: string, query: string): Promise<MemberListItem[]>;
  getMemberDetail(groupId: string, userId: string, requestingUserId: string): Promise<MemberDetail>;
  // Activity
  getPendingRequests(groupId: string): Promise<ActivityPendingRequest[]>;
  getOutstandingLoans(groupId: string): Promise<OutstandingLoan[]>;
  getRecentTransactions(groupId: string, limit?: number): Promise<Transaction[]>;
  getTransactions(groupId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  getTransactionDetail(groupId: string, transactionId: string): Promise<TransactionDetail>;
  retryTransaction(transactionId: string): Promise<{ success: boolean }>;
}

export interface MemberStanding {
  userId: string;
  initials: string;
  name: string;
  status: "paid" | "pending_late" | "missed_penalised" | "no_status";
}

export interface GroupDashboardData {
  currentCycle: number;
  totalCycles: number;
  paidCount: number;
  totalMemberCount: number;
  reserveBalance: number;
  reserveHistory: number[];
  contributionAmount: number;
  payoutAmount: number;
  nextPayoutRecipient: {
    name: string;
    initials: string;
  };
  daysUntilPayout: number;
  members: MemberStanding[];
}

export interface GroupSettings {
  name: string;
  isPublic: boolean;
  contributionAmount: number;
  cycleLength: number;
  payoutAmount: number;
  penaltyRate: number;
  approvalThreshold: number;
  allMembersAreCommittee: boolean;
  committeeSize: number;
  loansEnabled: boolean;
  loanInterestRate: number;
  discretionaryFundEnabled: boolean;
}

export interface CreateGroupPayload {
  settings: GroupSettings;
  founderId: string;
}

export interface CreateGroupResult {
  group: Group;
  inviteCode: string;
}

export interface ApiClient {
  auth: AuthApi;
  groups: GroupsApi;
}

// ── Activity types ────────────────────────────────────────────────────────

export type TransactionType =
  | "contribution"
  | "payout"
  | "penalty"
  | "loan_repayment"
  | "loan_disbursement"
  | "discretionary_deposit"
  | "discretionary_withdrawal";

export type TransactionDirection = "inflow" | "outflow" | "neutral";
export type TransactionStatus = "confirmed" | "pending" | "failed";

export type PendingRequestType =
  | "loan_request"
  | "discretionary_fund"
  | "join_request"
  | "member_withdrawal"
  | "settings_change";

export interface ActivityPendingRequest {
  id: string;
  type: PendingRequestType;
  subject: string;
  amountOrValue?: string;
  signatureCount: number;
  signatureThreshold: number;
  timestamp: string;
}

export interface OutstandingLoan {
  loanId: string;
  borrowerName: string;
  borrowerInitials: string;
  borrowerUserId: string;
  amount: number;
  dueCycle: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  memberName: string;
  memberInitials: string;
  memberId: string;
  amount: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  cycle: number;
  timestamp: string;
}

export interface TransactionFilters {
  types?: TransactionType[];
  memberIds?: string[];
  cycleRange?: { from: number; to: number };
  datePreset?: "all" | "this_week" | "this_month" | "last_30";
}

// Transaction detail - discriminated union per type
export interface TransactionDetailBase extends Transaction {
  failureReason?: string;
  contextNote?: string;
}

export interface ContributionDetail extends TransactionDetailBase {
  type: "contribution";
  fromName: string;
  method: string;
  referenceId: string;
}

export interface PayoutDetail extends TransactionDetailBase {
  type: "payout";
  toName: string;
  source: string;
  method: string;
}

export interface PenaltyDetail extends TransactionDetailBase {
  type: "penalty";
  reason: string;
  appliedBy: string;
}

export interface LoanRepaymentDetail extends TransactionDetailBase {
  type: "loan_repayment";
  installmentNumber: number;
  totalInstallments: number;
  method: string;
  linkedLoanId: string;
}

export interface LoanDisbursementDetail extends TransactionDetailBase {
  type: "loan_disbursement";
  toName: string;
  method: string;
}

export interface DiscretionaryDetail extends TransactionDetailBase {
  type: "discretionary_deposit" | "discretionary_withdrawal";
  category: string;
  counterparty: string;
  reason: string;
  approvedBy: string;
}

export type TransactionDetail =
  | ContributionDetail
  | PayoutDetail
  | PenaltyDetail
  | LoanRepaymentDetail
  | LoanDisbursementDetail
  | DiscretionaryDetail;
