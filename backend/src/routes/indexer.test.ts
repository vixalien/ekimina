import type { GroupMeta } from "@ekimina/types";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { mockGroupMeta, clearAll } from "../__tests__/mock-store.js";

vi.mock("../lib/db/queries.js", async () => {
  const m = await import("../__tests__/mock-store.js");
  return {
    getUserByAddress: vi.fn(() => null),
    getUserByPhone: vi.fn(() => null),
    createUser: vi.fn((u: Record<string, unknown>) => u),
    getAllGroupMeta: vi.fn(() => Array.from(m.mockGroupMeta.values())),
    getGroupMetaByAddress: vi.fn((addr: string) => m.mockGroupMeta.get(addr) ?? null),
    getGroupMetaByInviteCode: vi.fn(() => null),
    upsertGroupMeta: vi.fn((meta: Record<string, unknown>) => {
      m.mockGroupMeta.set(meta.address as string, meta);
      return meta;
    }),
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

vi.mock("@ekimina/contracts", () => ({
  getIkiminaContract: vi.fn(),
  getFactoryContract: vi.fn(),
}));

vi.mock("../lib/chain.js", () => ({
  publicClient: {},
}));

vi.mock("../lib/indexer.js", () => ({
  getCachedGroup: vi.fn(),
  getCachedCycle: vi.fn(),
}));

describe("GET /users/{address}/groups", () => {
  beforeEach(() => clearAll());

  it("returns groups from groupMeta store", async () => {
    const addr = "0xcafac3dd18ac6c6e92c921884f9e4176737c052c" as const;
    const creator = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" as const;
    const meta: GroupMeta = {
      address: addr,
      name: "Umugongo W'Abaturage",
      inviteCode: "AB3K9F",
      createdAt: "2026-01-15T00:00:00.000Z",
      creator,
    };
    mockGroupMeta.set(meta.address, meta as unknown as Record<string, unknown>);

    const { default: indexer } = await import("./indexer.js");
    const res = await indexer.request(`/users/${creator}/groups`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as GroupMeta[];
    expect(body).toHaveLength(1);
    expect(body[0]?.name).toBe("Umugongo W'Abaturage");
    expect(body[0]?.address).toBe(addr);
  });

  it("returns empty array when groupMeta is empty", async () => {
    const { default: indexer } = await import("./indexer.js");
    const res = await indexer.request("/users/0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266/groups");
    expect(res.status).toBe(200);
    const body = (await res.json()) as GroupMeta[];
    expect(body).toEqual([]);
  });
});
