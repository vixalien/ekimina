import type { AuthApi, User } from "./types";
import { MOCK_OTP, MOCK_USERS, MOCK_TOKENS } from "./mock/users";
import { MOCK_MEMBERSHIPS, MOCK_PENDING_REQUESTS } from "./mock/groups";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAuth(): AuthApi {
  return {
    async sendOtp(phone) {
      await delay(800);
      console.log(`[MockAuth] OTP sent to ${phone}. Code: ${MOCK_OTP}`);
      return { success: true };
    },

    async resendOtp(phone) {
      await delay(600);
      console.log(`[MockAuth] OTP resent to ${phone}. Code: ${MOCK_OTP}`);
      return { success: true };
    },

    async verifyOtp(phone, code) {
      await delay(1000);
      if (code !== MOCK_OTP) throw new Error("Invalid OTP code");

      const isKnownUser = phone in MOCK_USERS;
      const user: User = MOCK_USERS[phone] ?? {
        id: `user-${Date.now()}`,
        phone,
        name: null,
        createdAt: new Date().toISOString(),
      };
      const token = `mock-token-${user.id}`;

      if (!isKnownUser) return { status: "new_user", user, token };

      const pending = MOCK_PENDING_REQUESTS[phone];
      if (pending) return { status: "invitation_pending", user, token, request: pending };

      const memberships = MOCK_MEMBERSHIPS[phone];
      if (!memberships?.length) return { status: "no_groups", user, token };
      if (memberships.length === 1)
        return { status: "one_group", user, token, membership: memberships[0]! };
      return { status: "multiple_groups", user, token, memberships };
    },

    async getStatus(token) {
      await delay(500);
      const phone = MOCK_TOKENS[token];
      if (!phone) throw new Error("Invalid token");
      const user = MOCK_USERS[phone];
      if (!user) throw new Error("User not found");

      const pending = MOCK_PENDING_REQUESTS[phone];
      if (pending) {
        return {
          user,
          groupStatus: "invitation_pending",
          pendingRequest: {
            requestId: pending.id,
            groupName: pending.groupName,
            requestedAt: pending.requestedAt,
          },
        };
      }

      const memberships = MOCK_MEMBERSHIPS[phone];
      if (!memberships?.length) return { user, groupStatus: "no_groups" };
      if (memberships.length === 1) return { user, groupStatus: "one_group" };
      return { user, groupStatus: "multiple_groups" };
    },

    async updateProfile(token, name) {
      await delay(600);
      const phone = MOCK_TOKENS[token];
      if (!phone) throw new Error("Invalid token");
      const user = MOCK_USERS[phone];
      if (!user) throw new Error("User not found");
      return { ...user, name };
    },
  };
}
