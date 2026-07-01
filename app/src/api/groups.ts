import type {
  CreateGroupPayload,
  CreateGroupResult,
  Group,
  GroupsApi,
  JoinRequest,
  MemberListItem,
  MemberDetail,
  TransactionFilters,
  LoanDetail,
  LoanRequestReview,
  GroupSettings,
  UserProfile,
  CommitteeMember,
  SettingsChangeRequest,
  GroupSettingField,
  DiscretionaryFundRequest,
  DiscretionaryFundReview,
  JoinRequestReview,
  MemberWithdrawalReview,
  GroupInviteData,
  ReserveDetail,
  ReserveCycleSummary,
  ReserveDataPoint,
  LeaveGroupInfo,
} from "./types";
import {
  ALL_GROUPS,
  INVITE_CODE_MAP,
  MOCK_MEMBERSHIPS,
  MOCK_GROUP_DATA,
  MOCK_ACTIVITY_REQUESTS,
  MOCK_OUTSTANDING_LOANS,
  MOCK_TRANSACTIONS,
  getTransactionDetail,
  getLoanDetail,
  getLoanRequestReview,
  signLoan,
  rejectLoan,
  computeDashboard,
  toPublicGroup,
  MOCK_GROUP_SETTINGS,
  MOCK_COMMITTEE,
  MOCK_USER_PROFILES,
  getSettingsChangeReview,
  signSettingsChange,
  rejectSettingsChange,
  MOCK_DISCRETIONARY_REVIEWS,
  MOCK_JOIN_REQUEST_REVIEWS,
  MOCK_WITHDRAWAL_REVIEWS,
  MOCK_INVITE_DATA,
  signReview,
  rejectReview,
} from "./mock/groups";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let pendingRequests: Record<string, JoinRequest> = {};

function shortAddress(userId: string): string {
  // Generate a deterministic short address from userId
  const hash = userId.split("").reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`;
}

function memberListForGroup(groupId: string): MemberListItem[] {
  const extra = MOCK_GROUP_DATA[groupId];
  if (!extra) throw new Error("Group not found");

  const { members, currentCyclePayments, memberReputations, memberLoans, paymentHistory } = extra;

  return members.map((m) => {
    const status = currentCyclePayments[m.userId] ?? "no_status";
    const lns = memberLoans[m.userId] ?? [];
    const activeLoan = lns.find(
      (l) =>
        l.state.includes("repaying") ||
        l.state.includes("disbursed") ||
        l.state.includes("requested")
    );

    return {
      userId: m.userId,
      initials: m.initials,
      name: m.name,
      address: shortAddress(m.userId),
      status,
      reputation: memberReputations[m.userId] ?? 50,
      activeLoanAmount: activeLoan?.amount ?? null,
      penaltyCount: Object.values(paymentHistory[m.userId] ?? {}).filter((s) => s === "missed")
        .length,
    };
  });
}

export function createMockGroups(): GroupsApi {
  return {
    async myGroups(userId) {
      await delay(500);
      const phone = Object.keys(MOCK_MEMBERSHIPS).find((k) =>
        MOCK_MEMBERSHIPS[k].some((m) => m.group.id === userId || k === userId)
      );
      return phone ? MOCK_MEMBERSHIPS[phone] : [];
    },

    async joinByInviteCode(_userId, code) {
      await delay(1200);

      const groupId = INVITE_CODE_MAP[code.toUpperCase()];
      if (!groupId) {
        throw new Error("Invalid invite code");
      }

      const group = ALL_GROUPS.find((g) => g.id === groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const request: JoinRequest = {
        id: `req-${Date.now()}`,
        groupId: group.id,
        groupName: group.name,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      pendingRequests[request.id] = request;
      return request;
    },

    async searchPublicGroups(query) {
      await delay(700);

      const publicGroups = ALL_GROUPS.filter((g) => g.isPublic).map(toPublicGroup);

      if (!query.trim()) {
        return publicGroups;
      }

      const lower = query.toLowerCase();
      return publicGroups.filter((g) => g.name.toLowerCase().includes(lower));
    },

    async getGroupDetails(groupId) {
      await delay(400);

      const group = ALL_GROUPS.find((g) => g.id === groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      return toPublicGroup(group);
    },

    async requestToJoinGroup(_userId, groupId) {
      await delay(1000);

      const group = ALL_GROUPS.find((g) => g.id === groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const request: JoinRequest = {
        id: `req-${Date.now()}`,
        groupId: group.id,
        groupName: group.name,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      pendingRequests[request.id] = request;
      return request;
    },

    async getJoinRequestStatus(requestId) {
      await delay(500);

      const request = pendingRequests[requestId];
      if (!request) {
        throw new Error("Join request not found");
      }

      return request;
    },

    async cancelJoinRequest(requestId) {
      await delay(800);

      const request = pendingRequests[requestId];
      if (!request) {
        throw new Error("Join request not found");
      }

      request.status = "cancelled";
      return { success: true };
    },

    async getGroupDashboard(groupId) {
      await delay(400);
      return computeDashboard(groupId);
    },

    async createGroup(payload: CreateGroupPayload): Promise<CreateGroupResult> {
      await delay(800);

      const id = `group-${Date.now()}`;
      const initials = payload.settings.name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

      const inviteCode = Array.from(
        { length: 8 },
        () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
      ).join("");

      const group: Group = {
        id,
        name: payload.settings.name,
        memberCount: 1,
        isPublic: payload.settings.isPublic,
        inviteCode,
        avatarInitials: initials || "G",
        createdAt: new Date().toISOString(),
      };

      ALL_GROUPS.push(group);
      MOCK_MEMBERSHIPS[payload.founderId] = [
        ...(MOCK_MEMBERSHIPS[payload.founderId] ?? []),
        { group, role: "admin", joinedAt: group.createdAt },
      ];

      return { group, inviteCode };
    },

    async getGroupMembers(groupId: string): Promise<MemberListItem[]> {
      return memberListForGroup(groupId);
    },

    async searchMembers(groupId: string, query: string): Promise<MemberListItem[]> {
      await delay(300);
      const all = memberListForGroup(groupId);
      if (!query.trim()) return all;
      const lower = query.toLowerCase();
      return all.filter((m) => m.name.toLowerCase().includes(lower));
    },

    async getPendingRequests(groupId: string) {
      await delay(300);
      return MOCK_ACTIVITY_REQUESTS[groupId] ?? [];
    },

    async getOutstandingLoans(groupId: string) {
      await delay(300);
      return MOCK_OUTSTANDING_LOANS[groupId] ?? [];
    },

    async getRecentTransactions(groupId: string, limit = 5) {
      await delay(400);
      const all = MOCK_TRANSACTIONS[groupId] ?? [];
      return all.slice(0, limit);
    },

    async getTransactions(groupId: string, filters?: TransactionFilters) {
      await delay(400);
      let txns = [...(MOCK_TRANSACTIONS[groupId] ?? [])];

      if (filters?.types && filters.types.length > 0) {
        txns = txns.filter((t) => filters.types!.includes(t.type));
      }
      if (filters?.memberIds && filters.memberIds.length > 0) {
        txns = txns.filter((t) => filters.memberIds!.includes(t.memberId));
      }
      if (filters?.cycleRange) {
        txns = txns.filter(
          (t) => t.cycle >= filters.cycleRange!.from && t.cycle <= filters.cycleRange!.to
        );
      }
      if (filters?.datePreset && filters.datePreset !== "all") {
        const now = new Date();
        let cutoff: Date;
        if (filters.datePreset === "this_week") {
          cutoff = new Date(now);
          cutoff.setDate(now.getDate() - 7);
        } else if (filters.datePreset === "this_month") {
          cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
          cutoff = new Date(now);
          cutoff.setDate(now.getDate() - 30);
        }
        txns = txns.filter((t) => new Date(t.timestamp) >= cutoff);
      }

      return txns;
    },

    async getTransactionDetail(_groupId: string, transactionId: string) {
      await delay(350);
      const detail = getTransactionDetail(transactionId);
      if (!detail) throw new Error("Transaction not found");
      return detail;
    },

    async retryTransaction(_transactionId: string) {
      await delay(1500);
      return { success: true };
    },

    async getMemberDetail(
      groupId: string,
      userId: string,
      _requestingUserId: string
    ): Promise<MemberDetail> {
      await delay(400);
      const extra = MOCK_GROUP_DATA[groupId];
      if (!extra) throw new Error("Group not found");

      const member = extra.members.find((m) => m.userId === userId);
      if (!member) throw new Error("Member not found");

      const contributionAmount = extra.cycleConfig.contributionAmount;
      const history = extra.paymentHistory[userId] ?? {};
      const historyEntries = Object.entries(history)
        .map(([cycle, s]) => ({
          cycle: Number(cycle),
          status: s,
          penaltyAmount: s === "paid_late" ? Math.round(contributionAmount * 0.1) : undefined,
        }))
        .sort((a, b) => b.cycle - a.cycle);

      const onTimeCount = historyEntries.filter((e) => e.status === "paid_on_time").length;
      const totalCount = historyEntries.length;

      const loans = extra.memberLoans[userId] ?? [];
      const activeLoanCount = loans.filter(
        (l) =>
          l.state.includes("repaying") ||
          l.state.includes("disbursed") ||
          l.state.includes("requested")
      ).length;
      const penaltyCount = historyEntries.filter((e) => e.status === "missed").length;

      const isCommittee = userId === "user-1" || userId === "user-2";

      const role: "admin" | "treasurer" | "member" =
        userId === "user-1" ? "admin" : userId === "user-2" ? "treasurer" : "member";

      const joinedCycle = 1;

      return {
        userId: member.userId,
        name: member.name,
        initials: member.initials,
        role,
        joinedCycle,
        reputation: extra.memberReputations[userId] ?? 50,
        onTimeContributions: onTimeCount,
        totalContributions: totalCount,
        activeLoanCount,
        penaltyCount,
        contributionHistory: historyEntries.slice(0, 12),
        loans,
        isCommitteeMember: isCommittee,
      };
    },

    async getLoanDetail(_groupId: string, loanId: string): Promise<LoanDetail> {
      await delay(350);
      const detail = getLoanDetail(loanId);
      if (!detail) throw new Error("Loan not found");
      return detail;
    },

    async getLoanRequestReview(_groupId: string, loanId: string): Promise<LoanRequestReview> {
      await delay(350);
      const review = getLoanRequestReview(loanId);
      if (!review) throw new Error("Loan request not found");
      return review;
    },

    async signLoanRequest(
      _groupId: string,
      loanId: string,
      userId: string
    ): Promise<{ success: boolean; thresholdMet: boolean }> {
      await delay(800);
      return signLoan(loanId, userId);
    },

    async rejectLoanRequest(
      _groupId: string,
      loanId: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(800);
      return rejectLoan(loanId);
    },

    async getGroupSettings(groupId: string): Promise<GroupSettings> {
      await delay(400);
      const settings = MOCK_GROUP_SETTINGS[groupId];
      if (!settings) throw new Error("Group not found");
      return settings;
    },

    async getUserProfile(groupId: string, userId: string): Promise<UserProfile> {
      await delay(300);
      const profile = MOCK_USER_PROFILES[userId];
      if (profile) return profile;
      // Generate a default profile for any user
      const extra = MOCK_GROUP_DATA[groupId];
      const member = extra?.members.find((m) => m.userId === userId);
      return {
        userId,
        name: member?.name ?? "Unknown",
        initials: member?.initials ?? "??",
        reputation: extra?.memberReputations[userId] ?? 50,
        onTimeStreak: 0,
        notificationsEnabled: true,
        isCommitteeMember: userId === "user-1" || userId === "user-2",
      };
    },

    async getCommitteeMembers(groupId: string): Promise<CommitteeMember[]> {
      await delay(300);
      return MOCK_COMMITTEE[groupId] ?? [];
    },

    async getSettingsChangeReview(
      _groupId: string,
      requestId: string
    ): Promise<SettingsChangeRequest> {
      await delay(350);
      const review = getSettingsChangeReview(requestId);
      if (!review) throw new Error("Settings change request not found");
      return review;
    },

    async signSettingsChange(
      _groupId: string,
      requestId: string,
      userId: string
    ): Promise<{ success: boolean; thresholdMet: boolean }> {
      await delay(800);
      return signSettingsChange(requestId, userId);
    },

    async rejectSettingsChange(
      _groupId: string,
      requestId: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(800);
      return rejectSettingsChange(requestId);
    },

    async submitSettingsChange(
      _groupId: string,
      _field: GroupSettingField,
      _proposedValue: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(1000);
      return { success: true };
    },

    async updateNotifications(_userId: string, _enabled: boolean): Promise<{ success: boolean }> {
      await delay(400);
      return { success: true };
    },

    async leaveGroup(_groupId: string, _userId: string): Promise<{ success: boolean }> {
      await delay(800);
      return { success: true };
    },

    // ── Phase 6: Discretionary fund ─────────────────────────────

    async submitDiscretionaryRequest(
      _groupId: string,
      _userId: string,
      _req: DiscretionaryFundRequest
    ): Promise<{ success: boolean }> {
      await delay(600);
      return { success: true };
    },

    async getDiscretionaryReview(
      _groupId: string,
      requestId: string
    ): Promise<DiscretionaryFundReview> {
      await delay(350);
      const review = MOCK_DISCRETIONARY_REVIEWS[requestId];
      if (!review) throw new Error("Discretionary request not found");
      return review;
    },

    async signDiscretionaryRequest(
      _groupId: string,
      requestId: string,
      userId: string
    ): Promise<{ success: boolean; thresholdMet: boolean }> {
      await delay(800);
      return signReview(MOCK_DISCRETIONARY_REVIEWS as any, requestId, userId);
    },

    async rejectDiscretionaryRequest(
      _groupId: string,
      requestId: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(800);
      return rejectReview(MOCK_DISCRETIONARY_REVIEWS as any, requestId);
    },

    // ── Phase 6: Join request ────────────────────────────────────

    async getJoinRequestReview(_groupId: string, requestId: string): Promise<JoinRequestReview> {
      await delay(350);
      const review = MOCK_JOIN_REQUEST_REVIEWS[requestId];
      if (!review) throw new Error("Join request not found");
      return review;
    },

    async signJoinRequest(
      _groupId: string,
      requestId: string,
      userId: string
    ): Promise<{ success: boolean; thresholdMet: boolean }> {
      await delay(800);
      return signReview(MOCK_JOIN_REQUEST_REVIEWS as any, requestId, userId);
    },

    async rejectJoinRequest(
      _groupId: string,
      requestId: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(800);
      return rejectReview(MOCK_JOIN_REQUEST_REVIEWS as any, requestId);
    },

    // ── Phase 6: Member withdrawal ───────────────────────────────

    async initiateWithdrawal(
      _groupId: string,
      _memberId: string,
      _requestingUserId: string,
      _reasonCategory: string
    ): Promise<{ success: boolean; requestId: string }> {
      await delay(600);
      return { success: true, requestId: "act-req-6" };
    },

    async getMemberWithdrawalReview(
      _groupId: string,
      requestId: string
    ): Promise<MemberWithdrawalReview> {
      await delay(350);
      const review = MOCK_WITHDRAWAL_REVIEWS[requestId];
      if (!review) throw new Error("Withdrawal request not found");
      return review;
    },

    async signMemberWithdrawal(
      _groupId: string,
      requestId: string,
      userId: string
    ): Promise<{ success: boolean; thresholdMet: boolean }> {
      await delay(800);
      return signReview(MOCK_WITHDRAWAL_REVIEWS as any, requestId, userId);
    },

    async rejectMemberWithdrawal(
      _groupId: string,
      requestId: string,
      _userId: string
    ): Promise<{ success: boolean }> {
      await delay(800);
      return rejectReview(MOCK_WITHDRAWAL_REVIEWS as any, requestId);
    },

    // ── Phase 6: Invite ───────────────────────────────────────────

    async getGroupInviteData(groupId: string): Promise<GroupInviteData> {
      await delay(300);
      const data = MOCK_INVITE_DATA[groupId];
      if (!data) throw new Error("Group not found");
      return data;
    },

    async sendPhoneInvite(_groupId: string, _phone: string): Promise<{ success: boolean }> {
      await delay(500);
      return { success: true };
    },

    // ── Phase 7: Reserve ─────────────────────────────────────────────

    async getReserveDetail(groupId: string): Promise<ReserveDetail> {
      await delay(400);
      const extra = MOCK_GROUP_DATA[groupId];
      if (!extra) throw new Error("Group not found");

      const { cycleConfig, reserveHistory } = extra;
      const history: ReserveDataPoint[] = reserveHistory.map((b: number, i: number) => ({
        cycle: i + 1,
        balance: b,
      }));

      const lastBalance = reserveHistory[reserveHistory.length - 1] ?? 0;
      const monthlyGrowth = cycleConfig.payoutAmount > 0
        ? Math.round((cycleConfig.contributionAmount * 0.6) + (cycleConfig.contributionAmount * 0.1))
        : 5000;

      const proj6: ReserveDataPoint[] = [];
      let bal = lastBalance;
      for (let i = 1; i <= 6; i++) {
        bal += monthlyGrowth;
        proj6.push({ cycle: cycleConfig.currentCycle + i, balance: bal });
      }

      const proj12: ReserveDataPoint[] = [];
      bal = lastBalance;
      for (let i = 1; i <= 12; i++) {
        bal += monthlyGrowth;
        proj12.push({ cycle: cycleConfig.currentCycle + i, balance: bal });
      }

      const payoutAmount = cycleConfig.payoutAmount;
      const reserveCovers = payoutAmount > 0
        ? Math.max(1, Math.floor(lastBalance / payoutAmount))
        : 1;

      const cycleSummary: ReserveCycleSummary = {
        contributionsIn: cycleConfig.contributionAmount * extra.members.length,
        payoutOut: cycleConfig.payoutAmount,
        penaltiesAbsorbed: 500,
        loanInterestIn: 2400,
        loanDisbursed: 30000,
        discretionaryDeposits: 15000,
      };

      return {
        balance: lastBalance,
        history,
        projection6: proj6,
        projection12: proj12,
        cycleSummary,
        insight: `At this rate, the reserve covers about ${reserveCovers} future payouts on its own.`,
      };
    },

    async getLeaveGroupInfo(
      _groupId: string,
      _userId: string
    ): Promise<LeaveGroupInfo> {
      await delay(400);
      const group = ALL_GROUPS.find((g) => g.id === _groupId);
      return {
        groupName: group?.name ?? "Group",
        isMidCycle: true,
        contributionStanding: "7 of 7, up to date",
        outstandingLoanAmount: null,
      };
    },

    async verifyPin(
      _userId: string,
      pin: string
    ): Promise<{ success: boolean }> {
      await delay(600);
      if (pin === "1234") return { success: true };
      throw new Error("Incorrect PIN");
    },
  };
}
