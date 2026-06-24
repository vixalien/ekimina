import type { GroupsApi, JoinRequest } from "./types";
import {
  ALL_GROUPS,
  INVITE_CODE_MAP,
  MOCK_MEMBERSHIPS,
  toPublicGroup,
} from "./mock/groups";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let pendingRequests: Record<string, JoinRequest> = {};

export function createMockGroups(): GroupsApi {
  return {
    async myGroups(userId) {
      await delay(500);
      const phone = Object.keys(MOCK_MEMBERSHIPS).find((k) =>
        MOCK_MEMBERSHIPS[k].some(
          (m) => m.group.id === userId || k === userId,
        ),
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

      const publicGroups = ALL_GROUPS.filter((g) => g.isPublic).map(
        toPublicGroup,
      );

      if (!query.trim()) {
        return publicGroups;
      }

      const lower = query.toLowerCase();
      return publicGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(lower) ||
          g.description.toLowerCase().includes(lower),
      );
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
  };
}
