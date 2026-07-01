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

// ── Loan lifecycle types ──────────────────────────────────────────────

export type LoanState =
  | "requested"
  | "signing"
  | "approved"
  | "disbursed"
  | "repaying"
  | "repaid"
  | "defaulted";

export interface LoanSignature {
  userId: string;
  name: string;
  initials: string;
  role?: string;
  signed: boolean;
  signedAt?: string;
}

export interface LoanDetailBase {
  loanId: string;
  borrowerName: string;
  borrowerInitials: string;
  borrowerUserId: string;
  borrowerRole: string;
  borrowerJoinedCycle: number;
  amount: number;
  interestRate: number;
  currentState: LoanState;
  purpose: string;
  deadline: string;
}

export interface RequestedLoanDetail extends LoanDetailBase {
  currentState: "requested";
  submittedAt: string;
  signatureThreshold: number;
  collectedSignatures: number;
}

export interface SigningLoanDetail extends LoanDetailBase {
  currentState: "signing";
  signatureThreshold: number;
  collectedSignatures: number;
  signatures: LoanSignature[];
}

export interface ApprovedLoanDetail extends LoanDetailBase {
  currentState: "approved";
  approvedAt: string;
}

export interface DisbursedLoanDetail extends LoanDetailBase {
  currentState: "disbursed";
  disbursedAt: string;
  disbursementTransactionId: string;
  totalOwed: number;
  amountPaid: number;
}

export interface RepayingLoanDetail extends LoanDetailBase {
  currentState: "repaying";
  totalOwed: number;
  amountPaid: number;
  lastPaymentAt?: string;
}

export interface RepaidLoanDetail extends LoanDetailBase {
  currentState: "repaid";
  totalOwed: number;
  completedAt: string;
}

export interface DefaultedLoanDetail extends LoanDetailBase {
  currentState: "defaulted";
  remainingBalance: number;
  amountPaidBeforeDefault: number;
  reputationImpact: number;
}

export type LoanDetail =
  | RequestedLoanDetail
  | SigningLoanDetail
  | ApprovedLoanDetail
  | DisbursedLoanDetail
  | RepayingLoanDetail
  | RepaidLoanDetail
  | DefaultedLoanDetail;

export interface LoanRequestReview {
  loanId: string;
  borrowerName: string;
  borrowerInitials: string;
  borrowerUserId: string;
  borrowerRole: string;
  borrowerJoinedCycle: number;
  borrowerReputation: number;
  borrowerActiveLoanCount: number;
  amount: number;
  interestRate: number;
  purpose: string;
  deadline: string;
  signatureThreshold: number;
  collectedSignatures: number;
  signatures: LoanSignature[];
  currentUserAlreadySigned: boolean;
  currentUserSignedAt?: string;
}

export interface MemberListItem {
  userId: string;
  initials: string;
  name: string;
  address: string;
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
  // Loan lifecycle
  getLoanDetail(groupId: string, loanId: string): Promise<LoanDetail>;
  getLoanRequestReview(groupId: string, loanId: string): Promise<LoanRequestReview>;
  signLoanRequest(
    groupId: string,
    loanId: string,
    userId: string
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectLoanRequest(groupId: string, loanId: string, userId: string): Promise<{ success: boolean }>;
  // Profile & settings
  getGroupSettings(groupId: string): Promise<GroupSettings>;
  getUserProfile(groupId: string, userId: string): Promise<UserProfile>;
  getCommitteeMembers(groupId: string): Promise<CommitteeMember[]>;
  getSettingsChangeReview(groupId: string, requestId: string): Promise<SettingsChangeRequest>;
  signSettingsChange(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectSettingsChange(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean }>;
  submitSettingsChange(
    groupId: string,
    field: GroupSettingField,
    proposedValue: string,
    userId: string
  ): Promise<{ success: boolean }>;
  updateNotifications(userId: string, enabled: boolean): Promise<{ success: boolean }>;
  leaveGroup(groupId: string, userId: string): Promise<{ success: boolean }>;
  // Phase 6: Discretionary fund
  submitDiscretionaryRequest(
    groupId: string,
    userId: string,
    req: DiscretionaryFundRequest
  ): Promise<{ success: boolean }>;
  getDiscretionaryReview(groupId: string, requestId: string): Promise<DiscretionaryFundReview>;
  signDiscretionaryRequest(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectDiscretionaryRequest(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean }>;
  // Phase 6: Join request
  getJoinRequestReview(groupId: string, requestId: string): Promise<JoinRequestReview>;
  signJoinRequest(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectJoinRequest(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean }>;
  // Phase 6: Member withdrawal
  initiateWithdrawal(
    groupId: string,
    memberId: string,
    requestingUserId: string,
    reasonCategory: string
  ): Promise<{ success: boolean; requestId: string }>;
  getMemberWithdrawalReview(groupId: string, requestId: string): Promise<MemberWithdrawalReview>;
  signMemberWithdrawal(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; thresholdMet: boolean }>;
  rejectMemberWithdrawal(
    groupId: string,
    requestId: string,
    userId: string
  ): Promise<{ success: boolean }>;
  // Phase 6: Invite
  getGroupInviteData(groupId: string): Promise<GroupInviteData>;
  sendPhoneInvite(groupId: string, phone: string): Promise<{ success: boolean }>;
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
  groupPolicy: "private" | "public";
}

export type GroupSettingField =
  | "contribution_amount"
  | "cycle_length"
  | "penalty_rate"
  | "payout_amount"
  | "approval_threshold"
  | "committee_size"
  | "loan_interest_rate"
  | "discretionary_fund"
  | "group_policy";

export interface SettingsChangeRequest {
  id: string;
  groupId: string;
  field: GroupSettingField;
  fieldLabel: string;
  currentValue: string;
  proposedValue: string;
  requesterName: string;
  requesterInitials: string;
  requesterUserId: string;
  signatureCount: number;
  signatureThreshold: number;
  signatures: LoanSignature[];
  currentUserAlreadySigned: boolean;
  currentUserSignedAt?: string;
  createdAt: string;
}

// ── Phase 6: Discretionary fund, join, withdrawal, invite ─────────────

export interface DiscretionaryFundRequest {
  direction: "deposit" | "withdrawal";
  amount: number;
  category: string;
  paidTo: string;
  reason: string;
}

export interface DiscretionaryFundReview {
  id: string;
  groupId: string;
  requesterName: string;
  requesterInitials: string;
  requesterUserId: string;
  direction: "deposit" | "withdrawal";
  amount: number;
  category: string;
  paidTo: string;
  reason: string;
  requestedAt: string;
  signatureCount: number;
  signatureThreshold: number;
  signatures: LoanSignature[];
  currentUserAlreadySigned: boolean;
  currentUserSignedAt?: string;
}

export interface JoinRequestReview {
  id: string;
  groupId: string;
  applicantName: string;
  applicantInitials: string;
  applicantPhone: string;
  joinMethod: "invite_code" | "direct_invite";
  inviteCode?: string;
  requestedAt: string;
  signatureCount: number;
  signatureThreshold: number;
  signatures: LoanSignature[];
  currentUserAlreadySigned: boolean;
  currentUserSignedAt?: string;
}

export interface MemberWithdrawalReview {
  id: string;
  groupId: string;
  memberName: string;
  memberInitials: string;
  memberUserId: string;
  reasonCategory: string;
  contributionRate: string;
  penaltyCount: number;
  outstandingLoanAmount: number | null;
  requestedAt: string;
  signatureCount: number;
  signatureThreshold: number;
  signatures: LoanSignature[];
  currentUserAlreadySigned: boolean;
  currentUserSignedAt?: string;
}

export interface SentInvite {
  phone: string;
  sentAt: string;
}

export interface GroupInviteData {
  inviteCode: string;
  shareLink: string;
  sentInvites: SentInvite[];
}

export interface UserProfile {
  userId: string;
  name: string;
  initials: string;
  reputation: number;
  onTimeStreak: number;
  notificationsEnabled: boolean;
  isCommitteeMember: boolean;
}

export interface CommitteeMember {
  userId: string;
  name: string;
  initials: string;
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
