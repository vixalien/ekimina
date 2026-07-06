import type {
  Address,
  DataClient,
  ChainGroup,
  ChainTransaction,
  Transaction as ScreenTransaction,
  TransactionDetail,
  CycleState,
  Member,
  Loan,
  AuthResult,
  User,
  GroupMeta,
  PaymentIntent,
  MemberDetail,
  MemberListItem,
  ActivityPendingRequest,
  OutstandingLoan,
  LoanDetail,
  LoanRequestReview,
  GroupSettings,
  UserProfile,
  CommitteeMember,
  SettingsChangeRequest,
  GroupInviteData,
  ReservePoint,
  ReserveDetail,
  LeaveGroupInfo,
  DiscretionaryFundReview,
  JoinRequestReview,
  MemberWithdrawalReview,
  PublicGroup,
  ProposalView,
} from "@ekimina/types";

import type { AppType } from "../../../backend/src/index";

import { hc } from "hono/client";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const client = hc<AppType>(BACKEND_URL);

async function handleRes<T>(res: {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) throw new Error("invalid code");
    if (res.status === 404) throw new Error("not found");
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────

const auth: DataClient["auth"] = {
  async sendOtp(phone) {
    const res = await client.auth.otp.send.$post({ json: { phone } });
    return handleRes<{ sent: boolean }>(res);
  },

  async verifyOtp(phone, code) {
    const res = await client.auth.otp.verify.$post({ json: { phone, code } });
    return handleRes<AuthResult>(res);
  },

  async setPin() {
    const res = await client.auth.pin.$post();
    return handleRes<{ ok: boolean }>(res);
  },

  async verifyPin() {
    const res = await client.auth.pin.verify.$post();
    return handleRes<{ ok: boolean }>(res);
  },
};

// ── Profile ──────────────────────────────────────────────────────────────

const profile: DataClient["profile"] = {
  async getUser(address) {
    const res = await client.users[":address"].$get({ param: { address } });
    return handleRes<User>(res);
  },

  async updateName(name) {
    const res = await client.users.me.$patch({ json: { name } });
    return handleRes<User>(res);
  },

  async updateNotifications(_enabled) {
    return { ok: true };
  },
};

// ── Lookup ───────────────────────────────────────────────────────────────

const lookup: DataClient["lookup"] = {
  async resolveNames(addresses) {
    const res = await client.lookup.names.$post({ json: { addresses } });
    return handleRes<Record<Address, string>>(res);
  },

  async groupByInviteCode(code) {
    const res = await client.groups["by-invite"][":code"].$get({
      param: { code },
    });
    if (!res.ok) return null;
    return res.json() as Promise<GroupMeta>;
  },
};

// ── Payments ─────────────────────────────────────────────────────────────

const payments: DataClient["payments"] = {
  async createIntent(input) {
    const res = await client.payments.intents.$post({
      json: { amount: Number(input.amount) },
    });
    return handleRes<PaymentIntent>(res);
  },

  async getIntent(id) {
    const res = await client.payments.intents[":id"].$get({ param: { id } });
    return handleRes<PaymentIntent>(res);
  },

  async retryIntent(id) {
    const res = await client.payments.intents[":id"].retry.$post({
      param: { id },
    });
    return handleRes<PaymentIntent>(res);
  },
};

// ── Groups (reads) ───────────────────────────────────────────────────────

const groupReads: DataClient["groups"] = {
  async myGroups(address) {
    const res = await client.users[":address"].groups.$get({
      param: { address },
    });
    return handleRes<GroupMeta[]>(res);
  },

  async getGroup(group) {
    const res = await client.groups[":group"].$get({ param: { group } });
    return handleRes<ChainGroup>(res);
  },

  async getCycleState(group) {
    const res = await client.groups[":group"].cycle.$get({
      param: { group },
    });
    return handleRes<CycleState>(res);
  },

  async getMembers(group) {
    const res = await client.groups[":group"].members.$get({
      param: { group },
    });
    return handleRes<Member[]>(res);
  },

  async listTransactions(group, filters) {
    const res = await client.groups[":group"].transactions.$get({
      param: { group },
      query: {
        type: filters?.types?.join(","),
        member: filters?.memberIds?.[0],
        cycle: filters?.cycleRange?.to?.toString(),
        preset: filters?.datePreset !== "all" ? filters?.datePreset : undefined,
      },
    });
    return handleRes<ChainTransaction[]>(res);
  },

  async getTransaction(group, txId) {
    const res = await client.groups[":group"].transactions[":id"].$get({
      param: { group, id: txId },
    });
    return handleRes<ChainTransaction>(res);
  },

  async listProposals(group, state) {
    const res = await client.groups[":group"].proposals.$get({
      param: { group },
      query: { state: state ?? undefined },
    });
    return handleRes<ProposalView[]>(res);
  },

  async getProposal(group, id) {
    const res = await client.groups[":group"].proposals[":id"].$get({
      param: { group, id },
    });
    return handleRes<ProposalView>(res);
  },

  async listLoans(group, borrower) {
    const res = await client.groups[":group"].loans.$get({
      param: { group },
      query: { borrower: borrower ?? undefined },
    });
    return handleRes<Loan[]>(res);
  },

  async getLoan(group, id) {
    const res = await client.groups[":group"].loans[":id"].$get({
      param: { group, id },
    });
    return handleRes<Loan>(res);
  },

  async getReserveHistory(group) {
    const res = await client.groups[":group"].reserve.$get({
      param: { group },
    });
    const data = await handleRes<{ history: ReservePoint[] }>(res);
    return data.history ?? [];
  },

  async getGroupDashboard(group) {
    const res = await client.groups[":group"].dashboard.$get({
      param: { group },
    });
    return handleRes(res);
  },

  async getGroupMembers(group) {
    const res = await client.groups[":group"].members.$get({
      param: { group },
    });
    return handleRes<MemberListItem[]>(res);
  },

  async searchMembers(group, query) {
    const res = await client.groups[":group"].members.$get({
      param: { group },
      query: { q: query },
    });
    return handleRes<MemberListItem[]>(res);
  },

  async getMemberDetail(group, userId, _requestingUserId) {
    const res = await client.groups[":group"].members[":userId"].$get({
      param: { group, userId },
    });
    return handleRes<MemberDetail>(res);
  },

  async getPendingRequests(group) {
    const res = await client.groups[":group"].pending.$get({
      param: { group },
    });
    return handleRes<ActivityPendingRequest[]>(res);
  },

  async getOutstandingLoans(group) {
    const res = await client.groups[":group"].loans.$get({
      param: { group },
      query: {},
    });
    return handleRes<OutstandingLoan[]>(res);
  },

  async getRecentTransactions(group, limit) {
    const res = await client.groups[":group"].transactions.$get({
      param: { group },
      query: { limit: limit?.toString() ?? "5" },
    });
    return handleRes(res);
  },

  async getTransactions(group, filters) {
    const res = await client.groups[":group"].transactions.$get({
      param: { group },
      query: {
        type: filters?.types?.join(","),
        member: filters?.memberIds?.[0],
        cycle: filters?.cycleRange?.to?.toString(),
        preset: filters?.datePreset !== "all" ? filters?.datePreset : undefined,
      },
    });
    return handleRes<ScreenTransaction[]>(res);
  },

  async getTransactionDetail(group, txId) {
    const res = await client.groups[":group"].transactions[":id"].$get({
      param: { group, id: txId },
    });
    return handleRes<TransactionDetail>(res);
  },

  async getLoanDetail(group, loanId) {
    const res = await client.groups[":group"].loans[":id"].$get({
      param: { group, id: loanId },
    });
    return handleRes<LoanDetail>(res);
  },

  async getLoanRequestReview(group, loanId) {
    const res = await client.groups[":group"].loans[":id"].review.$get({
      param: { group, id: loanId },
      query: {},
    });
    return handleRes<LoanRequestReview>(res);
  },

  async getGroupSettings(group) {
    const res = await client.groups[":group"].settings.$get({
      param: { group },
    });
    return handleRes<GroupSettings>(res);
  },

  async getGroupDetails(group) {
    const res = await client.groups[":group"].$get({ param: { group } });
    return handleRes(res);
  },

  async getUserProfile(group, userId) {
    const res = await client.groups[":group"].users[":userId"].$get({
      param: { group, userId },
    });
    return handleRes<UserProfile>(res);
  },

  async getCommitteeMembers(group) {
    const res = await client.groups[":group"].committee.$get({
      param: { group },
    });
    return handleRes<CommitteeMember[]>(res);
  },

  async getSettingsChangeReview(group, requestId) {
    const res = await client.groups[":group"].settings.changes[":id"].$get({
      param: { group, id: requestId },
    });
    return handleRes<SettingsChangeRequest>(res);
  },

  async getGroupInviteData(group) {
    const res = await client.groups[":group"].invite.$get({
      param: { group },
    });
    return handleRes<GroupInviteData>(res);
  },

  async getReserveDetail(group) {
    const res = await client.groups[":group"].reserve.$get({
      param: { group },
    });
    return handleRes<ReserveDetail>(res);
  },

  async getLeaveGroupInfo(group, userId) {
    const res = await client.groups[":group"]["leave-info"].$get({
      param: { group },
      query: { userId },
    });
    return handleRes<LeaveGroupInfo>(res);
  },

  async updateNotifications(userId, enabled) {
    const res = await client.users.notifications.$post({
      json: { userId, enabled },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async verifyPin(userId, pin) {
    const res = await client.users["verify-pin"].$post({
      json: { userId, pin },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async leaveGroup(group, userId) {
    const res = await client.groups[":group"].leave.$post({
      param: { group },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async submitSettingsChange(group, field, proposedValue, userId) {
    const res = await client.groups[":group"].settings.changes.$post({
      param: { group },
      json: { field, proposedValue, userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async signSettingsChange(group, requestId, userId) {
    const res = await client.groups[":group"].settings.changes[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectSettingsChange(group, requestId, userId) {
    const res = await client.groups[":group"].settings.changes[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async signLoanRequest(group, loanId, userId) {
    const res = await client.groups[":group"].loans[":id"].sign.$post({
      param: { group, id: loanId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectLoanRequest(group, loanId, userId) {
    const res = await client.groups[":group"].loans[":id"].reject.$post({
      param: { group, id: loanId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async initiateWithdrawal(group, memberId, requestingUserId, reasonCategory) {
    const res = await client.groups[":group"].withdrawals.$post({
      param: { group },
      json: { memberId, userId: requestingUserId, reasonCategory },
    });
    return handleRes<{ success: boolean; requestId: string }>(res);
  },

  async signMemberWithdrawal(group, requestId, userId) {
    const res = await client.groups[":group"].withdrawals[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectMemberWithdrawal(group, requestId, userId) {
    const res = await client.groups[":group"].withdrawals[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async sendPhoneInvite(group, phone) {
    const res = await client.groups[":group"].invite.phone.$post({
      param: { group },
      json: { phone },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async createGroup(payload) {
    const res = await client.groups.$post({ json: payload });
    return handleRes<{
      group: { id: string; name: string };
      inviteCode: string;
    }>(res);
  },

  async joinByInviteCode(userId, code) {
    const res = await client.groups["join-by-code"].$post({
      json: { code, userId },
    });
    return handleRes<{
      id: string;
      groupName: string;
      requestedAt: string;
    }>(res);
  },

  async cancelJoinRequest(requestId) {
    const res = await client.groups["join-requests"][":id"].$delete({
      param: { id: requestId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async searchPublicGroups(query) {
    const res = await client.groups.public.$get({
      query: { q: query ?? undefined },
    });
    return handleRes<PublicGroup[]>(res);
  },

  async requestToJoinGroup(groupId, userId) {
    const res = await client.groups["join-requests"].$post({
      json: { groupId, userId },
    });
    return handleRes<{
      id: string;
      groupName: string;
      requestedAt: string;
    }>(res);
  },

  async retryTransaction(_transactionId) {
    return { success: true };
  },

  async submitDiscretionaryRequest(group, userId, req) {
    const res = await client.groups[":group"].discretionary.$post({
      param: { group },
      json: { ...req, userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async getDiscretionaryReview(group, requestId) {
    const res = await client.groups[":group"].discretionary[":id"].$get({
      param: { group, id: requestId },
    });
    return handleRes<DiscretionaryFundReview>(res);
  },

  async signDiscretionaryRequest(group, requestId, userId) {
    const res = await client.groups[":group"].discretionary[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectDiscretionaryRequest(group, requestId, userId) {
    const res = await client.groups[":group"].discretionary[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async getJoinRequestReview(group, requestId) {
    const res = await client.groups[":group"]["join-requests"][":id"].$get({
      param: { group, id: requestId },
    });
    return handleRes<JoinRequestReview>(res);
  },

  async signJoinRequest(group, requestId, userId) {
    const res = await client.groups[":group"]["join-requests"][":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectJoinRequest(group, requestId, userId) {
    const res = await client.groups[":group"]["join-requests"][":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async getMemberWithdrawalReview(group, requestId) {
    const res = await client.groups[":group"].withdrawals[":id"].$get({
      param: { group, id: requestId },
    });
    return handleRes<MemberWithdrawalReview>(res);
  },
};

// ── Actions ──────────────────────────────────────────────────────────────

const groupActions: DataClient["actions"] = {
  async createGroup(group, name) {
    const res = await client.groups.$post({ json: { group, name } });
    return handleRes<{ group: Address; inviteCode: string }>(res);
  },

  async join(code) {
    const meta = await lookup.groupByInviteCode(code);
    if (!meta) throw new Error("invite code not found");
    const res = await client.relay.groups[":group"].join.$post({
      param: { group: meta.address },
      json: { code },
    });
    return handleRes<{ group: Address }>(res);
  },

  async contribute(group) {
    const res = await client.relay.groups[":group"].contribute.$post({
      param: { group },
    });
    return handleRes<{ txId: string }>(res);
  },

  async triggerPayout(group) {
    const res = await client.relay.groups[":group"]["trigger-payout"].$post({
      param: { group },
    });
    return handleRes<{ txId: string }>(res);
  },

  async startRotation(group, order) {
    const res = await client.relay.groups[":group"].rotate.$post({
      param: { group },
      json: { order },
    });
    return handleRes<{ txId: string }>(res);
  },

  async repayLoan(group, loanId) {
    const res = await client.relay.groups[":group"]["repay-loan"].$post({
      param: { group },
      json: { loanId },
    });
    return handleRes<{ txId: string }>(res);
  },

  async shareOut(group) {
    const res = await client.relay.groups[":group"]["share-out"].$post({
      param: { group },
    });
    return handleRes<{ txId: string }>(res);
  },

  async createProposal(group, draft) {
    const res = await client.relay.groups[":group"].proposals.$post({
      param: { group },
      json: draft,
    });
    return handleRes<{ id: string }>(res);
  },

  async approveProposal(group, id) {
    const res = await client.relay.groups[":group"].proposals[":id"].approve.$post({
      param: { group, id },
    });
    return handleRes<{ id: string; executed: boolean }>(res);
  },

  async rejectProposal(group, id) {
    const res = await client.relay.groups[":group"].proposals[":id"].reject.$post({
      param: { group, id },
    });
    return handleRes<{ id: string }>(res);
  },

  async signLoanRequest(group, loanId, userId) {
    const res = await client.groups[":group"].loans[":id"].sign.$post({
      param: { group, id: loanId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectLoanRequest(group, loanId, userId) {
    const res = await client.groups[":group"].loans[":id"].reject.$post({
      param: { group, id: loanId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async signSettingsChange(group, requestId, userId) {
    const res = await client.groups[":group"].settings.changes[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectSettingsChange(group, requestId, userId) {
    const res = await client.groups[":group"].settings.changes[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async submitSettingsChange(group, field, proposedValue, userId) {
    const res = await client.groups[":group"].settings.changes.$post({
      param: { group },
      json: { field, proposedValue, userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async updateNotifications(userId, enabled) {
    const res = await client.users.notifications.$post({
      json: { userId, enabled },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async leaveGroup(group, userId) {
    const res = await client.groups[":group"].leave.$post({
      param: { group },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async verifyPin(userId, pin) {
    const res = await client.users["verify-pin"].$post({
      json: { userId, pin },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async initiateWithdrawal(group, memberId, requestingUserId, reasonCategory) {
    const res = await client.groups[":group"].withdrawals.$post({
      param: { group },
      json: { memberId, userId: requestingUserId, reasonCategory },
    });
    return handleRes<{ success: boolean; requestId: string }>(res);
  },

  async signMemberWithdrawal(group, requestId, userId) {
    const res = await client.groups[":group"].withdrawals[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectMemberWithdrawal(group, requestId, userId) {
    const res = await client.groups[":group"].withdrawals[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async sendPhoneInvite(group, phone) {
    const res = await client.groups[":group"].invite.phone.$post({
      param: { group },
      json: { phone },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async signJoinRequest(group, requestId, userId) {
    const res = await client.groups[":group"]["join-requests"][":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectJoinRequest(group, requestId, userId) {
    const res = await client.groups[":group"]["join-requests"][":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async signDiscretionaryRequest(group, requestId, userId) {
    const res = await client.groups[":group"].discretionary[":id"].sign.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean; thresholdMet: boolean }>(res);
  },

  async rejectDiscretionaryRequest(group, requestId, userId) {
    const res = await client.groups[":group"].discretionary[":id"].reject.$post({
      param: { group, id: requestId },
      json: { userId },
    });
    return handleRes<{ success: boolean }>(res);
  },

  async submitDiscretionaryRequest(group, userId, req) {
    const res = await client.groups[":group"].discretionary.$post({
      param: { group },
      json: { ...req, userId },
    });
    return handleRes<{ success: boolean }>(res);
  },
};

// ── Public API ───────────────────────────────────────────────────────────

export const api: DataClient = {
  auth,
  profile,
  lookup,
  payments,
  groups: groupReads,
  actions: groupActions,
};
