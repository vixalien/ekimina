import type { DataClient, Address } from "@ekimina/types";
import { custody } from "./custody";
import { createUserWalletClient, publicClient } from "./client/chain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getIkiminaContract } from "@ekimina/contracts";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const KEY_STORE = "ekimina_private_key";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("invalid code");
    if (res.status === 404) throw new Error("not found");
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as T;
}

const auth: DataClient["auth"] = {
  async sendOtp(phone) {
    await apiFetch("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) });
    return { sent: true };
  },
  async verifyOtp(phone, code) {
    return apiFetch("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }) });
  },
  async setPin() {
    return { ok: true };
  },
  async verifyPin() {
    return { ok: true };
  },
};

const profile: DataClient["profile"] = {
  async getUser(address) {
    return apiFetch(`/users/${address}`);
  },
  async updateName(name) {
    await apiFetch("/users/me", { method: "PATCH", body: JSON.stringify({ name }) });
    return { id: "", address: "" as Address, name, phone: null, custodial: true, notificationsEnabled: true };
  },
  async updateNotifications(enabled) {
    return { ok: true };
  },
};

const lookup: DataClient["lookup"] = {
  async resolveNames(addresses) {
    return apiFetch("/lookup/names", { method: "POST", body: JSON.stringify({ addresses }) });
  },
  async groupByInviteCode(code) {
    try {
      return await apiFetch(`/groups/by-invite/${code}`);
    } catch {
      return null;
    }
  },
};

const payments: DataClient["payments"] = {
  async createIntent(input) {
    return apiFetch("/payments/intents", { method: "POST", body: JSON.stringify(input) });
  },
  async getIntent(id) {
    return apiFetch(`/payments/intents/${id}`);
  },
  async retryIntent(id) {
    return apiFetch(`/payments/intents/${id}/retry`, { method: "POST" });
  },
};

const groupReads: DataClient["groups"] = {
  async myGroups(address) {
    return apiFetch(`/users/${address}/groups`);
  },
  async getGroup(group) {
    return apiFetch(`/groups/${group}`);
  },
  async getCycleState(group) {
    return apiFetch(`/groups/${group}/cycle`);
  },
  async getMembers(group) {
    return apiFetch(`/groups/${group}/members`);
  },
  async listTransactions(group, filters) {
    const params = new URLSearchParams();
    if (filters?.types?.length) params.set("type", filters.types.join(","));
    if (filters?.memberIds?.length) params.set("member", filters.memberIds[0]);
    if (filters?.cycleRange) params.set("cycle", String(filters.cycleRange.to));
    if (filters?.datePreset && filters.datePreset !== "all") params.set("preset", filters.datePreset);
    return apiFetch(`/groups/${group}/transactions?${params}`);
  },
  async getTransaction(group, txId) {
    return apiFetch(`/groups/${group}/transactions/${txId}`);
  },
  async listProposals(group, state) {
    return apiFetch(`/groups/${group}/proposals?state=${state ?? ""}`);
  },
  async getProposal(group, id) {
    return apiFetch(`/groups/${group}/proposals/${id}`);
  },
  async listLoans(group, borrower) {
    const q = borrower ? `?borrower=${borrower}` : "";
    return apiFetch(`/groups/${group}/loans${q}`);
  },
  async getLoan(group, id) {
    return apiFetch(`/groups/${group}/loans/${id}`);
  },
  async getReserveHistory(group) {
    const reserve = await apiFetch<any>(`/groups/${group}/reserve`);
    return reserve.history ?? [];
  },
  async getGroupDashboard(group) {
    return apiFetch(`/groups/${group}/dashboard`);
  },
  async getGroupMembers(group) {
    return apiFetch(`/groups/${group}/members`);
  },
  async searchMembers(group, query) {
    return apiFetch(`/groups/${group}/members?q=${encodeURIComponent(query)}`);
  },
  async getMemberDetail(group, userId, _requestingUserId) {
    return apiFetch(`/groups/${group}/members/${userId}`);
  },
  async getPendingRequests(group) {
    return apiFetch(`/groups/${group}/pending`);
  },
  async getOutstandingLoans(group) {
    return apiFetch(`/groups/${group}/loans`);
  },
  async getRecentTransactions(group, limit) {
    return apiFetch(`/groups/${group}/transactions?limit=${limit ?? 5}`);
  },
  async getTransactions(group, filters) {
    const params = new URLSearchParams();
    if (filters?.types?.length) params.set("type", filters.types.join(","));
    if (filters?.memberIds?.length) params.set("member", filters.memberIds[0]);
    if (filters?.cycleRange) params.set("cycle", String(filters.cycleRange.to));
    if (filters?.datePreset && filters.datePreset !== "all") params.set("preset", filters.datePreset);
    return apiFetch(`/groups/${group}/transactions?${params}`);
  },
  async getTransactionDetail(group, txId) {
    return apiFetch(`/groups/${group}/transactions/${txId}`);
  },
  async getLoanDetail(group, loanId) {
    return apiFetch(`/groups/${group}/loans/${loanId}`);
  },
  async getLoanRequestReview(group, loanId) {
    return apiFetch(`/groups/${group}/loans/${loanId}/review`);
  },
  async getGroupSettings(group) {
    return apiFetch(`/groups/${group}/settings`);
  },
  async getGroupDetails(group) {
    return apiFetch(`/groups/${group}`);
  },
  async getUserProfile(group, userId) {
    return apiFetch(`/groups/${group}/users/${userId}`);
  },
  async getCommitteeMembers(group) {
    return apiFetch(`/groups/${group}/committee`);
  },
  async getSettingsChangeReview(group, requestId) {
    return apiFetch(`/groups/${group}/settings/changes/${requestId}`);
  },
  async getGroupInviteData(group) {
    return apiFetch(`/groups/${group}/invite`);
  },
  async getReserveDetail(group) {
    return apiFetch(`/groups/${group}/reserve`);
  },
  async getLeaveGroupInfo(group, userId) {
    return apiFetch(`/groups/${group}/leave-info?userId=${userId}`);
  },
  async updateNotifications(userId, enabled) {
    return apiFetch("/users/notifications", { method: "POST", body: JSON.stringify({ userId, enabled }) });
  },
  async verifyPin(userId, pin) {
    return apiFetch("/users/verify-pin", { method: "POST", body: JSON.stringify({ userId, pin }) });
  },
  async leaveGroup(group, userId) {
    return apiFetch(`/groups/${group}/leave`, { method: "POST", body: JSON.stringify({ userId }) });
  },
  async submitSettingsChange(group, field, proposedValue, userId) {
    return apiFetch(`/groups/${group}/settings/changes`, {
      method: "POST", body: JSON.stringify({ field, proposedValue, userId }),
    });
  },
  async signSettingsChange(group, requestId, userId) {
    return apiFetch(`/groups/${group}/settings/changes/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectSettingsChange(group, requestId, userId) {
    return apiFetch(`/groups/${group}/settings/changes/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async signLoanRequest(group, loanId, userId) {
    return apiFetch(`/groups/${group}/loans/${loanId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectLoanRequest(group, loanId, userId) {
    return apiFetch(`/groups/${group}/loans/${loanId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async initiateWithdrawal(group, memberId, requestingUserId, reasonCategory) {
    return apiFetch(`/groups/${group}/withdrawals`, {
      method: "POST", body: JSON.stringify({ memberId, userId: requestingUserId, reasonCategory }),
    });
  },
  async signMemberWithdrawal(group, requestId, userId) {
    return apiFetch(`/groups/${group}/withdrawals/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectMemberWithdrawal(group, requestId, userId) {
    return apiFetch(`/groups/${group}/withdrawals/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async sendPhoneInvite(group, phone) {
    return apiFetch(`/groups/${group}/invite/phone`, {
      method: "POST", body: JSON.stringify({ phone }),
    });
  },
  async createGroup(payload) {
    return apiFetch("/groups", { method: "POST", body: JSON.stringify(payload) });
  },
  async joinByInviteCode(userId, code) {
    return apiFetch("/groups/join-by-code", {
      method: "POST", body: JSON.stringify({ code, userId }),
    });
  },
  async cancelJoinRequest(requestId) {
    return apiFetch(`/groups/join-requests/${requestId}`, { method: "DELETE" });
  },
  async searchPublicGroups(query) {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return apiFetch(`/groups/public${q}`);
  },
  async requestToJoinGroup(groupId, userId) {
    return apiFetch("/groups/join-requests", {
      method: "POST", body: JSON.stringify({ groupId, userId }),
    });
  },
  async retryTransaction(transactionId) {
    return { success: true };
  },
  async submitDiscretionaryRequest(group, userId, req) {
    return apiFetch(`/groups/${group}/discretionary`, {
      method: "POST", body: JSON.stringify({ ...req, userId }),
    });
  },
  async getDiscretionaryReview(group, requestId) {
    return apiFetch(`/groups/${group}/discretionary/${requestId}`);
  },
  async signDiscretionaryRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/discretionary/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectDiscretionaryRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/discretionary/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async getJoinRequestReview(group, requestId) {
    return apiFetch(`/groups/${group}/join-requests/${requestId}`);
  },
  async signJoinRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/join-requests/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectJoinRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/join-requests/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async getMemberWithdrawalReview(group, requestId) {
    return apiFetch(`/groups/${group}/withdrawals/${requestId}`);
  },
};

const groupActions: DataClient["actions"] = {
  async createGroup(group, name) {
    return apiFetch("/groups", { method: "POST", body: JSON.stringify({ group, name }) });
  },
  async join(code) {
    const meta = await lookup.groupByInviteCode(code);
    if (!meta) throw new Error("invite code not found");
    return apiFetch(`/relay/groups/${meta.address}/join`, {
      method: "POST", body: JSON.stringify({ code }),
    });
  },
  async contribute(group) {
    const pk = await AsyncStorage.getItem(KEY_STORE);
    if (pk) {
      const wallet = createUserWalletClient(pk as Address);
      const contract = getIkiminaContract(group as Address, { public: publicClient, wallet });
      const hash = await (contract as any).write.contribute();
      return { txId: hash };
    }
    return apiFetch(`/relay/groups/${group}/contribute`, { method: "POST" });
  },
  async triggerPayout(group) {
    return apiFetch(`/relay/groups/${group}/trigger-payout`, { method: "POST" });
  },
  async startRotation(group, order) {
    return apiFetch(`/relay/groups/${group}/rotate`, {
      method: "POST", body: JSON.stringify({ order }),
    });
  },
  async repayLoan(group, loanId) {
    return apiFetch(`/relay/groups/${group}/repay-loan`, {
      method: "POST", body: JSON.stringify({ loanId }),
    });
  },
  async shareOut(group) {
    return apiFetch(`/relay/groups/${group}/share-out`, { method: "POST" });
  },
  async createProposal(group, draft) {
    return apiFetch(`/relay/groups/${group}/proposals`, {
      method: "POST", body: JSON.stringify(draft),
    });
  },
  async approveProposal(group, id) {
    return apiFetch(`/relay/groups/${group}/proposals/${id}/approve`, { method: "POST" });
  },
  async rejectProposal(group, id) {
    return apiFetch(`/relay/groups/${group}/proposals/${id}/reject`, { method: "POST" });
  },
  async signLoanRequest(group, loanId, userId) {
    return apiFetch(`/groups/${group}/loans/${loanId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectLoanRequest(group, loanId, userId) {
    return apiFetch(`/groups/${group}/loans/${loanId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async signSettingsChange(group, requestId, userId) {
    return apiFetch(`/groups/${group}/settings/changes/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectSettingsChange(group, requestId, userId) {
    return apiFetch(`/groups/${group}/settings/changes/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async submitSettingsChange(group, field, proposedValue, userId) {
    return apiFetch(`/groups/${group}/settings/changes`, {
      method: "POST", body: JSON.stringify({ field, proposedValue, userId }),
    });
  },
  async updateNotifications(userId, enabled) {
    return apiFetch("/users/notifications", { method: "POST", body: JSON.stringify({ userId, enabled }) });
  },
  async leaveGroup(group, userId) {
    return apiFetch(`/groups/${group}/leave`, { method: "POST", body: JSON.stringify({ userId }) });
  },
  async verifyPin(userId, pin) {
    return apiFetch("/users/verify-pin", { method: "POST", body: JSON.stringify({ userId, pin }) });
  },
  async initiateWithdrawal(group, memberId, requestingUserId, reasonCategory) {
    return apiFetch(`/groups/${group}/withdrawals`, {
      method: "POST", body: JSON.stringify({ memberId, userId: requestingUserId, reasonCategory }),
    });
  },
  async signMemberWithdrawal(group, requestId, userId) {
    return apiFetch(`/groups/${group}/withdrawals/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectMemberWithdrawal(group, requestId, userId) {
    return apiFetch(`/groups/${group}/withdrawals/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async sendPhoneInvite(group, phone) {
    return apiFetch(`/groups/${group}/invite/phone`, {
      method: "POST", body: JSON.stringify({ phone }),
    });
  },
  async signJoinRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/join-requests/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectJoinRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/join-requests/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async signDiscretionaryRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/discretionary/${requestId}/sign`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async rejectDiscretionaryRequest(group, requestId, userId) {
    return apiFetch(`/groups/${group}/discretionary/${requestId}/reject`, {
      method: "POST", body: JSON.stringify({ userId }),
    });
  },
  async submitDiscretionaryRequest(group, userId, req) {
    return apiFetch(`/groups/${group}/discretionary`, {
      method: "POST", body: JSON.stringify({ ...req, userId }),
    });
  },
};

export const dataClient: DataClient = {
  auth,
  custody,
  profile,
  lookup,
  payments,
  groups: groupReads,
  actions: groupActions,
};
