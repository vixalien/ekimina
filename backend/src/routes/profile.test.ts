import type { Address, User } from "@ekimina/types";

import { describe, it, expect, beforeEach, vi } from "vitest";

import { mockUsers, mockUsersByAddress, clearAll } from "../__tests__/mock-store.js";

vi.mock("../lib/db/queries.js", async () => {
  const m = await import("../__tests__/mock-store.js");
  return {
    getUserByAddress: vi.fn((addr: string) => m.mockUsersByAddress.get(addr) ?? null),
    getUserByPhone: vi.fn(() => null),
    createUser: vi.fn((user: Record<string, unknown>) => {
      m.mockUsers.set(user.id as string, user);
      m.mockUsersByAddress.set(user.address as string, user);
      return user;
    }),
    getAllGroupMeta: vi.fn(() => []),
    getGroupMetaByAddress: vi.fn(() => null),
    getGroupMetaByInviteCode: vi.fn(() => null),
    upsertGroupMeta: vi.fn((meta: Record<string, unknown>) => meta),
    getPaymentIntent: vi.fn(() => null),
    createPaymentIntent: vi.fn((i: Record<string, unknown>) => i),
    updatePaymentIntent: vi.fn(() => null),
    getSigningState: vi.fn(() => null),
    upsertSigningState: vi.fn((id: string, userId: string) => ({
      id,
      signedBy: [userId],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    deleteSigningState: vi.fn(),
    createJoinRequest: vi.fn((r: Record<string, unknown>) => r),
    deleteJoinRequest: vi.fn(),
    getSettingsChange: vi.fn(() => null),
    createSettingsChange: vi.fn((c: Record<string, unknown>) => c),
    getReview: vi.fn(() => null),
    upsertReview: vi.fn((r: Record<string, unknown>) => r),
  };
});

const ADDRESS = "0x1234567890123456789012345678901234567890" as Address;

function addUser(overrides: Partial<User> = {}): User {
  const user: User = {
    id: "user-1",
    address: ADDRESS,
    name: null,
    phone: "0788123456",
    custodial: true,
    notificationsEnabled: true,
    ...overrides,
  };
  mockUsers.set(user.id, user as unknown as Record<string, unknown>);
  mockUsersByAddress.set(user.address, user as unknown as Record<string, unknown>);
  return user;
}

describe("GET /users/{address}", () => {
  beforeEach(() => {
    clearAll();
  });

  it("returns user when address exists", async () => {
    const user = addUser({ name: "Alice" });

    const { default: profile } = await import("./profile.js");
    const res = await profile.request(`/users/${user.address}`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as User;
    expect(body.id).toBe(user.id);
    expect(body.name).toBe("Alice");
    expect(body.address).toBe(user.address);
  });

  it("returns 404 for unknown address", async () => {
    const { default: profile } = await import("./profile.js");
    const res = await profile.request("/users/0x0000000000000000000000000000000000000000");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  it("returns 400 for invalid address format", async () => {
    const { default: profile } = await import("./profile.js");
    const res = await profile.request("/users/not-an-address");
    expect(res.status).toBe(400);
  });
});
