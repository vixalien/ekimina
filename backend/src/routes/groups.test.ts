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

vi.mock("../lib/event-indexer.js", () => ({
  getTransactions: vi.fn(),
  getTransactionDetail: vi.fn(),
}));

import * as contract from "../lib/contract-data.js";
import * as eventIndexer from "../lib/event-indexer.js";

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

describe("GET /groups/{group}/loans", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns loan list", async () => {
    const mockLoans = [
      {
        id: "1",
        borrower: GROUP,
        principal: "20",
        interestBps: 500,
        totalOwed: "21",
        amountPaid: "0",
        dueCycle: "4",
        state: "0",
      },
    ];
    vi.mocked(contract.getLoans).mockResolvedValue(mockLoans);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/loans`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockLoans);
  });
});

describe("GET /groups/{group}/loans/{id}", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns loan detail when found", async () => {
    const mockLoan = {
      id: "1",
      borrower: GROUP,
      principal: "20",
      interestBps: 500,
      totalOwed: "21",
      amountPaid: "0",
      dueCycle: "4",
      state: "0",
    };
    (contract.getLoanDetail as unknown as Mock).mockResolvedValue(mockLoan);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/loans/1`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockLoan);
  });

  it("returns 404 when loan not found", async () => {
    (contract.getLoanDetail as unknown as Mock).mockResolvedValue(null);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/loans/999`);
    expect(res.status).toBe(404);
  });
});

describe("GET /groups/{group}/proposals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns proposals", async () => {
    const mockProposals = [{ id: "1", kind: "0", proposer: GROUP, state: "0" }];
    vi.mocked(contract.getProposals).mockResolvedValue(mockProposals);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/proposals`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockProposals);
  });
});

describe("GET /groups/{group}/proposals/{id}", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns proposal detail when found", async () => {
    const mockProposal = { id: "1", kind: "0", proposer: GROUP, state: "0" };
    (contract.getProposalDetail as unknown as Mock).mockResolvedValue(mockProposal);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/proposals/1`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockProposal);
  });
});

describe("GET /groups/{group}/transactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns transactions from event indexer", async () => {
    const mockTxs = [
      {
        id: "0xtx:0",
        type: "contribution" as const,
        memberName: "Alice",
        memberInitials: "A",
        memberId: GROUP,
        amount: 10,
        direction: "outflow" as const,
        status: "confirmed" as const,
        cycle: 1,
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(eventIndexer.getTransactions).mockResolvedValue(mockTxs);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/transactions`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockTxs);
  });
});

describe("GET /groups/{group}/transactions/{id}", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns transaction detail when found", async () => {
    const mockTx = {
      id: "0xtx:0",
      type: "contribution" as const,
      memberName: "Alice",
      memberInitials: "A",
      memberId: GROUP,
      amount: 10,
      direction: "outflow" as const,
      status: "confirmed" as const,
      cycle: 1,
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(eventIndexer.getTransactionDetail).mockResolvedValue(mockTx);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/transactions/0xtx:0`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockTx);
  });

  it("returns 404 when transaction not found", async () => {
    vi.mocked(eventIndexer.getTransactionDetail).mockResolvedValue(null);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/transactions/0xnone:0`);
    expect(res.status).toBe(404);
  });
});

describe("GET /groups/{group}/pending", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns pending requests", async () => {
    const mockPending = [
      {
        id: "1",
        type: "loan_request" as const,
        subject: "Loan",
        signatureCount: 1,
        signatureThreshold: 3,
        timestamp: "2026-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(contract.getPendingRequests).mockResolvedValue(mockPending);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/pending`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockPending);
  });
});

describe("GET /groups/{group}/committee", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns committee members", async () => {
    const mockCommittee = [{ userId: GROUP, name: "Alice", initials: "A" }];
    vi.mocked(contract.getCommittee).mockResolvedValue(mockCommittee);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/committee`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockCommittee);
  });
});

describe("GET /groups/{group}/settings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns group settings", async () => {
    const mockSettings = {
      name: "Test Group",
      isPublic: false,
      contributionAmount: 10,
      cycleLength: 30,
      payoutAmount: 50,
      penaltyRate: 5,
      approvalThreshold: 0.6,
      allMembersAreCommittee: false,
      committeeSize: 1,
      loansEnabled: true,
      loanInterestRate: 5,
      discretionaryFundEnabled: true,
      groupPolicy: "private" as const,
    };
    vi.mocked(contract.getSettings).mockResolvedValue(mockSettings);

    const { default: groups } = await import("./groups.js");
    const res = await groups.request(`/groups/${GROUP}/settings`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockSettings);
  });
});
