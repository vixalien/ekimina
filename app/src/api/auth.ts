import type { AuthApi, User } from "./types";
import { MOCK_OTP, MOCK_USERS } from "./mock/users";
import { MOCK_MEMBERSHIPS } from "./mock/groups";

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

      if (code !== MOCK_OTP) {
        throw new Error("Invalid OTP code");
      }

      const user: User = MOCK_USERS[phone] ?? {
        id: `user-${Date.now()}`,
        phone,
        name: null,
        createdAt: new Date().toISOString(),
      };

      const memberships = MOCK_MEMBERSHIPS[phone];

      if (!memberships || memberships.length === 0) {
        return { status: "no_groups", user };
      }

      if (memberships.length === 1) {
        return { status: "one_group", user, membership: memberships[0] };
      }

      return { status: "multiple_groups", user, memberships };
    },
  };
}
