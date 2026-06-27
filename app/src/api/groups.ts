import type {
  CreateGroupPayload,
  CreateGroupResult,
  Group,
  GroupsApi,
  JoinRequest,
  MemberListItem,
  MemberDetail,
} from "./types";
import {
  ALL_GROUPS,
  INVITE_CODE_MAP,
  MOCK_MEMBERSHIPS,
  MOCK_GROUP_DATA,
  computeDashboard,
  toPublicGroup,
} from "./mock/groups";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let pendingRequests: Record<string, JoinRequest> = {};

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
        l.state.includes("requested"),
    );

    return {
      userId: m.userId,
      initials: m.initials,
      name: m.name,
      status,
      reputation: memberReputations[m.userId] ?? 50,
      activeLoanAmount: activeLoan?.amount ?? null,
      penaltyCount: Object.values(paymentHistory[m.userId] ?? {}).filter(
        (s) => s === "missed",
      ).length,
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
  };
}
