import type { CreateGroupPayload, CreateGroupResult, Group, GroupsApi, JoinRequest } from "./types";
import { ALL_GROUPS, INVITE_CODE_MAP, MOCK_MEMBERSHIPS, computeDashboard, toPublicGroup } from "./mock/groups";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let pendingRequests: Record<string, JoinRequest> = {};

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
  };
}
