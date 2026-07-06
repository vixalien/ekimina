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
  async createIntent() { throw new Error("not implemented"); },
  async getIntent() { throw new Error("not implemented"); },
  async retryIntent() { throw new Error("not implemented"); },
};

const groupReads: DataClient["groups"] = {
  async myGroups(address) { return apiFetch(`/users/${address}/groups`); },
  async getGroup(group) { return apiFetch(`/groups/${group}`); },
  async getCycleState(group) { return apiFetch(`/groups/${group}/cycle`); },
  async getMembers(group) { return apiFetch(`/groups/${group}/members`); },
  async listTransactions() { return []; },
  async getTransaction() { throw new Error("not implemented"); },
  async listProposals() { return []; },
  async getProposal() { throw new Error("not implemented"); },
  async listLoans() { return []; },
  async getLoan() { throw new Error("not implemented"); },
  async getReserveHistory() { return []; },
  async getGroupDashboard() { throw new Error("not implemented"); },
  async getGroupMembers() { throw new Error("not implemented"); },
  async searchMembers() { throw new Error("not implemented"); },
  async getMemberDetail() { throw new Error("not implemented"); },
  async getPendingRequests() { throw new Error("not implemented"); },
  async getOutstandingLoans() { throw new Error("not implemented"); },
  async getRecentTransactions() { return []; },
  async getTransactions() { return []; },
  async getTransactionDetail() { throw new Error("not implemented"); },
  async getLoanDetail() { throw new Error("not implemented"); },
  async getLoanRequestReview() { throw new Error("not implemented"); },
  async getGroupSettings() { throw new Error("not implemented"); },
  async getGroupDetails() { throw new Error("not implemented"); },
  async getUserProfile() { throw new Error("not implemented"); },
  async getCommitteeMembers() { throw new Error("not implemented"); },
  async getSettingsChangeReview() { throw new Error("not implemented"); },
  async getGroupInviteData() { throw new Error("not implemented"); },
  async getReserveDetail() { throw new Error("not implemented"); },
  async getLeaveGroupInfo() { throw new Error("not implemented"); },
  async updateNotifications() { throw new Error("not implemented"); },
  async verifyPin() { throw new Error("not implemented"); },
  async leaveGroup() { throw new Error("not implemented"); },
  async submitSettingsChange() { throw new Error("not implemented"); },
  async signSettingsChange() { throw new Error("not implemented"); },
  async rejectSettingsChange() { throw new Error("not implemented"); },
  async signLoanRequest() { throw new Error("not implemented"); },
  async rejectLoanRequest() { throw new Error("not implemented"); },
  async initiateWithdrawal() { throw new Error("not implemented"); },
  async signMemberWithdrawal() { throw new Error("not implemented"); },
  async rejectMemberWithdrawal() { throw new Error("not implemented"); },
  async sendPhoneInvite() { throw new Error("not implemented"); },
  async createGroup() { throw new Error("not implemented"); },
  async joinByInviteCode() { throw new Error("not implemented"); },
  async cancelJoinRequest() { throw new Error("not implemented"); },
  async searchPublicGroups() { throw new Error("not implemented"); },
  async requestToJoinGroup() { throw new Error("not implemented"); },
  async retryTransaction() { throw new Error("not implemented"); },
  async submitDiscretionaryRequest() { throw new Error("not implemented"); },
  async getDiscretionaryReview() { throw new Error("not implemented"); },
  async signDiscretionaryRequest() { throw new Error("not implemented"); },
  async rejectDiscretionaryRequest() { throw new Error("not implemented"); },
  async getJoinRequestReview() { throw new Error("not implemented"); },
  async signJoinRequest() { throw new Error("not implemented"); },
  async rejectJoinRequest() { throw new Error("not implemented"); },
  async getMemberWithdrawalReview() { throw new Error("not implemented"); },
};

const groupActions: DataClient["actions"] = {
  async createGroup() { throw new Error("not implemented"); },
  async join() { throw new Error("not implemented"); },
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
  async startRotation() { throw new Error("not implemented"); },
  async repayLoan() { throw new Error("not implemented"); },
  async shareOut() { throw new Error("not implemented"); },
  async createProposal() { throw new Error("not implemented"); },
  async approveProposal() { throw new Error("not implemented"); },
  async rejectProposal() { throw new Error("not implemented"); },
  async signLoanRequest() { throw new Error("not implemented"); },
  async rejectLoanRequest() { throw new Error("not implemented"); },
  async signSettingsChange() { throw new Error("not implemented"); },
  async rejectSettingsChange() { throw new Error("not implemented"); },
  async submitSettingsChange() { throw new Error("not implemented"); },
  async updateNotifications() { throw new Error("not implemented"); },
  async leaveGroup() { throw new Error("not implemented"); },
  async verifyPin() { throw new Error("not implemented"); },
  async initiateWithdrawal() { throw new Error("not implemented"); },
  async signMemberWithdrawal() { throw new Error("not implemented"); },
  async rejectMemberWithdrawal() { throw new Error("not implemented"); },
  async sendPhoneInvite() { throw new Error("not implemented"); },
  async signJoinRequest() { throw new Error("not implemented"); },
  async rejectJoinRequest() { throw new Error("not implemented"); },
  async signDiscretionaryRequest() { throw new Error("not implemented"); },
  async rejectDiscretionaryRequest() { throw new Error("not implemented"); },
  async submitDiscretionaryRequest() { throw new Error("not implemented"); },
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
