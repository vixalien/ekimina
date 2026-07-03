import type {
  DataClient,
  AuthApi,
  ProfileApi,
  LookupApi,
  PaymentApi,
  GroupReads,
  GroupActions,
} from "@ekimina/types";
import { backendClient } from "./backend-client";
import { custody } from "./custody";
import { createUserWalletClient } from "./chain-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ikiminaABI } from "@ekimina/contracts";

const KEY_STORE = "ekimina_private_key";

const auth: AuthApi = {
  async sendOtp(phone) {
    await backendClient.auth["otp"].send.$post({ json: { phone } });
    return { sent: true };
  },
  async verifyOtp(phone, code) {
    const res = await backendClient.auth["otp"].verify.$post({ json: { phone, code } });
    const body = await res.json() as any;
    if (res.status === 401) throw new Error("invalid code");
    return body;
  },
  async setPin() {
    return { ok: true };
  },
  async verifyPin() {
    return { ok: true };
  },
};

const profile: ProfileApi = {
  async getUser(address) {
    const res = await backendClient.users[":address"].$get({ param: { address } });
    return res.json() as any;
  },
  async updateName(name) {
    await backendClient["users"].me.$patch({ json: { name } });
    return { id: "", address: "0x0" as any, name, phone: null, custodial: true, notificationsEnabled: true };
  },
  async updateNotifications(enabled) {
    return { ok: true };
  },
};

const lookup: LookupApi = {
  async resolveNames(addresses) {
    const res = await backendClient.lookup.names.$post({ json: { addresses } });
    return res.json() as any;
  },
  async groupByInviteCode(code) {
    const res = await backendClient.groups["by-invite"][":code"].$get({ param: { code } });
    if (res.status === 404) return null;
    return res.json() as any;
  },
};

const payments: PaymentApi = {
  async createIntent() { throw new Error("not implemented"); },
  async getIntent() { throw new Error("not implemented"); },
  async retryIntent() { throw new Error("not implemented"); },
};

const groupReads: GroupReads = {
  async myGroups(address) {
    const res = await backendClient.users[":address"].groups.$get({ param: { address } });
    return res.json() as any;
  },
  async getGroup(group) {
    const res = await backendClient.groups[":group"].$get({ param: { group } });
    return res.json() as any;
  },
  async getCycleState(group) {
    const res = await backendClient.groups[":group"].cycle.$get({ param: { group } });
    return res.json() as any;
  },
  async getMembers(group) {
    const res = await backendClient.groups[":group"].members.$get({ param: { group } });
    return res.json() as any;
  },
  async listTransactions() { return []; },
  async getTransaction() { throw new Error("not implemented"); },
  async listProposals() { return []; },
  async getProposal() { throw new Error("not implemented"); },
  async listLoans() { return []; },
  async getLoan() { throw new Error("not implemented"); },
  async getReserveHistory() { return []; },
};

const groupActions: GroupActions = {
  async createGroup(group, name) { throw new Error("not implemented"); },
  async join(code) { throw new Error("not implemented"); },
  async contribute(group) {
    const pk = await AsyncStorage.getItem(KEY_STORE);
    if (pk) {
      const wallet = createUserWalletClient(pk as `0x${string}`);
      const hash = await wallet.writeContract({
        address: group as `0x${string}`,
        abi: ikiminaABI,
        functionName: "contribute",
      });
      return { txId: hash };
    }
    const res = await backendClient.groups[":group"].contribute.$post({ param: { group } });
    return res.json() as any;
  },
  async triggerPayout(group) {
    const res = await backendClient.groups[":group"]["trigger-payout"].$post({ param: { group } });
    return res.json() as any;
  },
  async startRotation() { throw new Error("not implemented"); },
  async repayLoan() { throw new Error("not implemented"); },
  async shareOut() { throw new Error("not implemented"); },
  async createProposal() { throw new Error("not implemented"); },
  async approveProposal() { throw new Error("not implemented"); },
  async rejectProposal() { throw new Error("not implemented"); },
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
