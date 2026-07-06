import type { Address, GroupDashboardData, MemberDetail } from "@ekimina/types";
import type { Mock } from "vitest";

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

import * as contract from "../lib/contract-data.js";

const GROUP = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;

describe("GET /groups/{group}/dashboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns dashboard when group exists", async () => {
    const mockData: GroupDashboardData = {
      currentCycle: 1,
      totalCycles: 12,
      paidCount: 2,
      totalMemberCount: 3,
      reserveBalance: 100,
      reserveHistory: [],
      contributionAmount: 10,
      payoutAmount: 5,
      nextPayoutRecipient: { name: "Alice", initials: "A" },
      daysUntilPayout: 3,
      members: [],
    };
    vi.mocked(contract.getDashboard).mockResolvedValue(mockData);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/dashboard`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockData);
  });

  it("returns 404 when group not found", async () => {
    (contract.getDashboard as unknown as Mock).mockResolvedValue(null);
    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/dashboard`);
    expect(res.status).toBe(404);
  });
});

describe("GET /groups/{group}/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns member list", async () => {
    vi.mocked(contract.getMembers).mockResolvedValue([]);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/members`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("GET /groups/{group}/members/{userId}", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns member detail when found", async () => {
    const mockDetail = {
      userId: GROUP,
      name: "Alice",
      initials: "A",
      role: "member",
      joinedCycle: 1,
      reputation: 75,
      onTimeContributions: 3,
      totalContributions: 4,
      activeLoanCount: 0,
      penaltyCount: 1,
      contributionHistory: [],
      loans: [],
      isCommitteeMember: false,
    } as MemberDetail;
    (contract.getMemberDetail as unknown as Mock).mockResolvedValue(mockDetail);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/members/${GROUP}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockDetail);
  });

  it("returns 404 when member not found", async () => {
    (contract.getMemberDetail as unknown as Mock).mockResolvedValue(null);
    const { default: groups } = await import("./groups.js");
    const res = await groups.request(
      `/groups/${GROUP}/members/0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /groups/public", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns public groups", async () => {
    vi.mocked(contract.getPublicGroups).mockResolvedValue([]);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request("/groups/public");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
