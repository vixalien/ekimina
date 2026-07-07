import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/contract-data.js", () => ({
  getDashboard: vi.fn(),
  getMembers: vi.fn(),
  getMemberDetail: vi.fn(),
  getLoans: vi.fn(),
  getLoanDetail: vi.fn(),
  getLoanReview: vi.fn(),
  getCommittee: vi.fn(),
  getSettings: vi.fn(),
  getInviteData: vi.fn(),
  getReserveDetail: vi.fn(),
  getProposals: vi.fn(),
  getProposalDetail: vi.fn(),
  getPendingRequests: vi.fn(),
  getUserProfile: vi.fn(),
  getLeaveInfo: vi.fn(),
  getPublicGroups: vi.fn(),
}));

vi.mock("@ekimina/contracts", () => ({
  getIkiminaContract: vi.fn(),
  getFactoryContract: vi.fn(),
}));

vi.mock("../lib/chain.js", () => ({
  publicClient: {},
}));

vi.mock("../lib/indexer.js", () => ({
  getCachedGroup: vi.fn().mockResolvedValue(null),
  getCachedCycle: vi.fn().mockResolvedValue(null),
}));

import * as contracts from "@ekimina/contracts";

import * as contract from "../lib/contract-data.js";

const MOCK_READER = {
  read: {
    config: vi
      .fn()
      .mockResolvedValue([
        10000000000000000000n,
        2592000n,
        50000000000000000000n,
        1,
        500,
        6000,
        true,
        true,
        false,
      ]),
    currentCycle: vi.fn().mockResolvedValue(1n),
    cycleStart: vi.fn().mockResolvedValue(1700000000n),
    reserve: vi.fn().mockResolvedValue(0n),
    activeCount: vi.fn().mockResolvedValue(1n),
    paidCount: vi.fn().mockResolvedValue(0n),
    memberList: vi.fn().mockResolvedValue([]),
    isActive: vi.fn().mockResolvedValue(true),
    isCommittee: vi.fn().mockResolvedValue(false),
  },
};

vi.mocked(contracts.getIkiminaContract).mockReturnValue(MOCK_READER as never);

describe("merged app route resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contract.getPublicGroups).mockResolvedValue([]);
  });

  it("groups sub-app alone returns 200 for /groups/public", async () => {
    const { default: groups } = await import("./groups.js");
    const res = await groups.request("/groups/public");
    expect(res.status).toBe(200);
  });

  it("indexer sub-app alone returns 400 for /groups/public", async () => {
    const { default: indexer } = await import("./indexer.js");
    const res = await indexer.request("/groups/public");
    expect(res.status).toBe(400);
  });

  it("groups-first merged app returns 200 for /groups/public", async () => {
    const { OpenAPIHono } = await import("@hono/zod-openapi");
    const { default: groups } = await import("./groups.js");
    const { default: indexer } = await import("./indexer.js");

    const app = new OpenAPIHono().route("/", groups).route("/", indexer);
    const res = await app.request("/groups/public");
    expect(res.status).toBe(200);
  });

  it("indexer-first merged app returns 400 for /groups/public", async () => {
    const { OpenAPIHono } = await import("@hono/zod-openapi");
    const { default: groups } = await import("./groups.js");
    const { default: indexer } = await import("./indexer.js");

    const app = new OpenAPIHono().route("/", indexer).route("/", groups);
    const res = await app.request("/groups/public");
    expect(res.status).toBe(400);
  });
});
