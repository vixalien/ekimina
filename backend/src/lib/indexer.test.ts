import type { Address } from "@ekimina/types";

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/db/queries.js", async () => {
  const m = await import("../__tests__/mock-store.js");
  return {
    getUserByAddress: vi.fn(() => null),
    getUserByPhone: vi.fn(() => null),
    createUser: vi.fn((u: Record<string, unknown>) => u),
    getAllGroupMeta: vi.fn(() => []),
    getGroupMetaByAddress: vi.fn(() => null),
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

vi.mock("./chain.js", () => ({
  publicClient: {},
}));

vi.mock("./deployed-state.js", () => ({
  ACCOUNT_NAMES: {},
  GROUP_META: {
    "0xabcdef1234567890abcdef1234567890abcdef12": {
      name: "Test Group",
      inviteCode: "TEST12",
    },
  },
}));

import * as contracts from "@ekimina/contracts";

import { mockGroupMeta, clearAll } from "../__tests__/mock-store.js";

const MOCK_CONTRACT = {
  read: {
    config: vi.fn(),
    currentCycle: vi.fn(),
    cycleStart: vi.fn(),
    reserve: vi.fn(),
    activeCount: vi.fn(),
    paidCount: vi.fn(),
  },
};

vi.mocked(contracts.getIkiminaContract).mockReturnValue(MOCK_CONTRACT as never);

const GROUP_ADDR = "0xabcdef1234567890abcdef1234567890abcdef12" as Address;

describe("refreshGroup", () => {
  beforeEach(() => clearAll());

  it("populates groupMeta from GROUP_META after refreshing group", async () => {
    MOCK_CONTRACT.read.config.mockResolvedValue([
      10000000000000000000n,
      2592000n,
      50000000000000000000n,
      1,
      500,
      6000,
      true,
      true,
      false,
    ]);
    MOCK_CONTRACT.read.currentCycle.mockResolvedValue(3n);
    MOCK_CONTRACT.read.cycleStart.mockResolvedValue(1700000000n);
    MOCK_CONTRACT.read.reserve.mockResolvedValue(200000000000000000000n);
    MOCK_CONTRACT.read.activeCount.mockResolvedValue(5n);
    MOCK_CONTRACT.read.paidCount.mockResolvedValue(3n);

    const { refreshGroup } = await import("./indexer.js");
    await refreshGroup(GROUP_ADDR);

    expect(mockGroupMeta.size).toBe(1);
    const meta = mockGroupMeta.get(GROUP_ADDR);
    expect(meta).toBeDefined();
    expect(meta!.name).toBe("Test Group");
    expect(meta!.inviteCode).toBe("TEST12");
    expect(meta!.address).toBe(GROUP_ADDR);
  });
});
