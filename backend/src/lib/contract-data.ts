import type { Address } from "@ekimina/types";

import { getIkiminaContract, getFactoryContract } from "@ekimina/contracts";

import { publicClient } from "./chain.js";
import { ACCOUNT_NAMES, GROUP_META } from "./deployed-state.js";

function r(addr: Address) {
  return getIkiminaContract(addr, { public: publicClient }).read;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function nameOf(addr: string): { name: string; initials: string } {
  const name = ACCOUNT_NAMES[addr.toLowerCase()] ?? addr.slice(0, 6);
  return { name, initials: initialsOf(name) };
}

function toAmount(v: bigint): number {
  return Number(v) / 1e18;
}

export async function getDashboard(groupAddr: Address) {
  const c = r(groupAddr);
  const [config, curCycle, cycleStart, reserve, activeCount] = await Promise.all([
    c.config(),
    c.currentCycle(),
    c.cycleStart(),
    c.reserve(),
    c.activeCount(),
  ]);
  const [contribution, , payout] = config;
  const current = Number(curCycle);
  const paid = await c.paidCount([curCycle]);
  const memberAddrs = await c.memberList();
  const activeMembers: Address[] = [];
  const standings: any[] = [];
  for (const addr of memberAddrs) {
    if (!(await c.isActive([addr]))) continue;
    activeMembers.push(addr);
    const paidThisCycle = await c.hasPaid([curCycle, addr]);
    const n = nameOf(addr);
    standings.push({
      userId: addr,
      initials: n.initials,
      name: n.name,
      status: paidThisCycle ? ("paid" as const) : ("pending_late" as const),
    });
  }

  return {
    currentCycle: current,
    totalCycles: 12,
    paidCount: Number(paid),
    totalMemberCount: activeMembers.length,
    reserveBalance: toAmount(reserve),
    reserveHistory: [] as number[],
    contributionAmount: toAmount(contribution),
    payoutAmount: toAmount(payout),
    nextPayoutRecipient:
      (activeMembers[Number(current) % activeMembers.length] ?? activeMembers[0])
        ? nameOf(activeMembers[Number(current) % activeMembers.length] ?? activeMembers[0])
        : { name: "—", initials: "—" },
    daysUntilPayout: 3,
    members: standings,
  };
}

export async function getMembers(groupAddr: Address, query?: string) {
  const c = r(groupAddr);
  const result: any[] = [];
  for (const addr of await c.memberList()) {
    if (!(await c.isActive([addr]))) continue;
    const n = nameOf(addr);
    if (query && !n.name.toLowerCase().includes(query.toLowerCase())) continue;
    result.push({
      userId: addr,
      name: n.name,
      initials: n.initials,
      address: addr,
      status: "no_status" as const,
      reputation: 75,
      activeLoanAmount: null,
      penaltyCount: 0,
    });
  }
  return result;
}

export async function getMemberDetail(groupAddr: Address, userId: string) {
  const c = r(groupAddr);
  const addr = userId as Address;
  const [active, isComm, joined, penalty] = await Promise.all([
    c.isActive([addr]),
    c.isCommittee([addr]),
    c.joinedCycle([addr]),
    c.penaltyOwed([addr]),
  ]);
  if (!active) return null;

  const n = nameOf(addr);
  const current = Number(await c.currentCycle());
  const joinedCycle = Number(joined);
  const history: any[] = [];
  let onTime = 0;
  for (let cy = joinedCycle; cy <= current; cy++) {
    if (await c.hasPaid([BigInt(cy), addr])) {
      history.push({ cycle: cy, status: "paid_on_time" as const });
      onTime++;
    } else {
      history.push({
        cycle: cy,
        status: "missed" as const,
        penaltyAmount: cy === current ? undefined : toAmount(penalty),
      });
    }
  }

  return {
    userId: addr,
    name: n.name,
    initials: n.initials,
    role: isComm ? "committee" : "member",
    joinedCycle,
    reputation: 75,
    onTimeContributions: onTime,
    totalContributions: history.length,
    activeLoanCount: 0,
    penaltyCount: history.filter((h: any) => h.status === "missed").length,
    contributionHistory: history,
    loans: [],
    isCommitteeMember: isComm,
  };
}

export async function getLoans(groupAddr: Address) {
  const c = r(groupAddr);
  const count = Number(await c.loanCount());
  const loans: any[] = [];
  for (let i = 1; i <= count; i++) loans.push(await c.getLoan([BigInt(i)]));
  return loans;
}

export async function getLoanDetail(groupAddr: Address, loanId: string) {
  return r(groupAddr).getLoan([BigInt(loanId)]);
}

export async function getLoanReview(groupAddr: Address, loanId: string, _userId?: string) {
  const c = r(groupAddr);
  const loan = await c.getLoan([BigInt(loanId)]);
  if (!loan || !loan.borrower) return null;

  const n = nameOf(loan.borrower);
  const sigThreshold = Number(await c.neededApprovals());
  const committee: Address[] = [];
  for (const addr of await c.memberList()) {
    if ((await c.isActive([addr])) && (await c.isCommittee([addr]))) committee.push(addr);
  }
  const sigs = await Promise.all(
    committee.map(async (addr) => {
      const vote = await c.voted([BigInt(loanId), addr]);
      const n2 = nameOf(addr);
      return { userId: addr, name: n2.name, initials: n2.initials, signed: vote === 1 };
    }),
  );

  return {
    loanId,
    borrowerName: n.name,
    borrowerInitials: n.initials,
    borrowerUserId: loan.borrower,
    borrowerRole: "member",
    borrowerJoinedCycle: 1,
    borrowerReputation: 75,
    borrowerActiveLoanCount: 0,
    amount: toAmount(loan.principal),
    interestRate: Number(loan.interestBps) / 100,
    purpose: "",
    deadline: new Date(Number(loan.dueCycle) * 2592000 * 1000).toISOString(),
    signatureThreshold: sigThreshold,
    collectedSignatures: sigs.filter((s) => s.signed).length,
    signatures: sigs,
    currentUserAlreadySigned: false,
  };
}

export async function getCommittee(groupAddr: Address) {
  const c = r(groupAddr);
  const result: any[] = [];
  for (const addr of await c.memberList()) {
    if ((await c.isActive([addr])) && (await c.isCommittee([addr]))) {
      const n = nameOf(addr);
      result.push({ userId: addr, name: n.name, initials: n.initials });
    }
  }
  return result;
}

export async function getUserProfile(_groupAddr: Address, userId: string) {
  const n = nameOf(userId);
  return {
    userId,
    name: n.name,
    initials: n.initials,
    reputation: 75,
    onTimeStreak: 3,
    notificationsEnabled: true,
    isCommitteeMember: false,
  };
}

export async function getSettings(groupAddr: Address) {
  const [
    contribution,
    cycleLength,
    payout,
    ,
    penaltyRateBps,
    approvalThresholdBps,
    loansEnabled,
    discretionaryEnabled,
    allMembersCommittee,
  ] = await r(groupAddr).config();
  const meta = GROUP_META[groupAddr.toLowerCase()] ?? { name: "Group", inviteCode: "" };
  return {
    name: meta.name,
    isPublic: false,
    contributionAmount: toAmount(contribution),
    cycleLength: Number(cycleLength) / 86400,
    payoutAmount: toAmount(payout),
    penaltyRate: Number(penaltyRateBps) / 100,
    approvalThreshold: Number(approvalThresholdBps) / 10000,
    allMembersAreCommittee: allMembersCommittee,
    committeeSize: 1,
    loansEnabled,
    loanInterestRate: 5,
    discretionaryFundEnabled: discretionaryEnabled,
    groupPolicy: "private" as const,
  };
}

export async function getReserveDetail(groupAddr: Address) {
  return {
    balance: toAmount(await r(groupAddr).reserve()),
    history: [] as any[],
    projection6: [] as any[],
    projection12: [] as any[],
    cycleSummary: { contributionsIn: 0, payoutOut: 0, penaltiesAbsorbed: 0, loanInterestIn: 0 },
    insight: "Enable an indexer for reserve history.",
  };
}

export async function getLeaveInfo(groupAddr: Address, userId: string) {
  const [active] = await Promise.all([r(groupAddr).isActive([userId as Address])]);
  const meta = GROUP_META[groupAddr.toLowerCase()] ?? { name: "Group", inviteCode: "" };
  return {
    groupName: meta.name,
    isMidCycle: true,
    contributionStanding: active ? "active" : "inactive",
    outstandingLoanAmount: null,
  };
}

export async function getProposals(groupAddr: Address) {
  const c = r(groupAddr);
  const count = Number(await c.proposalCount());
  const proposals: any[] = [];
  for (let i = 1; i <= count; i++) {
    try {
      proposals.push(await c.getProposal([BigInt(i)]));
    } catch {
      continue;
    }
  }
  return proposals;
}

export async function getProposalDetail(groupAddr: Address, id: string) {
  return r(groupAddr).getProposal([BigInt(id)]);
}

export async function getPendingRequests(groupAddr: Address) {
  const proposals = await getProposals(groupAddr);
  return proposals
    .filter((p: any) => p[5] === BigInt(0))
    .map((p: any) => ({
      id: String(p[0]),
      type: "loan_request" as const,
      subject:
        ["Loan", "Discretionary", "Settings", "MemberExit", "Dissolve"][Number(p[1])] ?? "Proposal",
      signatureCount: Number(p[4]),
      signatureThreshold: Number(p[5]) + Number(p[4]) + 1,
      timestamp: new Date(Number(p[7]) * 1000).toISOString(),
    }));
}

export function getInviteData(groupAddr: Address) {
  const meta = GROUP_META[groupAddr.toLowerCase()];
  return meta
    ? {
        inviteCode: meta.inviteCode,
        shareLink: `https://e-kimina.app/join/${meta.inviteCode}`,
        sentInvites: [] as any[],
      }
    : { inviteCode: "", shareLink: "", sentInvites: [] };
}

export async function getOutstandingLoans(groupAddr: Address) {
  const c = r(groupAddr);
  const count = Number(await c.loanCount());
  const loans: any[] = [];
  for (let i = 1; i <= count; i++) {
    const loan = await c.getLoan([BigInt(i)]);
    if (!loan.borrower || loan.state !== 1) continue;
    const n = nameOf(loan.borrower);
    loans.push({
      loanId: String(i),
      borrowerName: n.name,
      borrowerInitials: n.initials,
      borrowerUserId: loan.borrower,
      amount: toAmount(loan.totalOwed),
      dueCycle: Number(loan.dueCycle),
    });
  }
  return loans;
}

export async function getCycleState(groupAddr: Address) {
  const c = r(groupAddr);
  const [curCycle, cycleStart, reserve, paid, activeCount] = await Promise.all([
    c.currentCycle(),
    c.cycleStart(),
    c.reserve(),
    c.paidCount([await c.currentCycle()]),
    c.activeCount(),
  ]);
  return {
    currentCycle: Number(curCycle),
    rotationLength: Number(activeCount),
    cycleStart: new Date(Number(cycleStart) * 1000).toISOString(),
    reserveBalance: reserve.toString(),
    paidCount: Number(paid),
    memberCount: Number(activeCount),
  };
}

export async function getMembersRaw(groupAddr: Address) {
  const c = r(groupAddr);
  const result: any[] = [];
  for (const addr of await c.memberList()) {
    const [active, isComm, joined] = await Promise.all([
      c.isActive([addr]),
      c.isCommittee([addr]),
      c.joinedCycle([addr]),
    ]);
    if (active)
      result.push({
        address: addr,
        isCommitteeMember: isComm,
        joinedCycle: Number(joined),
        active: true,
      });
  }
  return result;
}

export async function getGroupConfig(groupAddr: Address) {
  const [
    contribution,
    cycleLength,
    payout,
    payoutPolicy,
    penaltyRateBps,
    approvalThresholdBps,
    loansEnabled,
    discretionaryEnabled,
    allMembersCommittee,
  ] = await r(groupAddr).config();
  return {
    contributionAmount: contribution.toString(),
    cycleLength: Number(cycleLength),
    payoutAmount: payout.toString(),
    payoutPolicy: ["none", "rotating", "lump_sum_end"][Number(payoutPolicy)] ?? "none",
    penaltyRateBps: Number(penaltyRateBps),
    approvalThresholdBps: Number(approvalThresholdBps),
    loansEnabled,
    discretionaryEnabled,
    allMembersCommittee,
  };
}

export async function getPublicGroups() {
  const { readFileSync } = await import("fs");
  const { join } = await import("path");
  try {
    const addr = JSON.parse(
      readFileSync(join(process.cwd(), "..", "local.json"), "utf-8"),
    ).FACTORY_ADDRESS;
    if (!addr) return [];
    const factory = getFactoryContract(addr as Address, { public: publicClient });
    const length = await factory.read.allGroupsLength();
    const groups: any[] = [];
    for (let i = 0; i < Number(length); i++) {
      const gAddr = await factory.read.allGroups([BigInt(i)]);
      const meta = GROUP_META[(gAddr as string).toLowerCase()];
      if (meta)
        groups.push({
          id: gAddr,
          name: meta.name,
          memberCount: 0,
          avatarInitials: initialsOf(meta.name),
          isPublic: true,
          contributionAmount: 0,
          cycleLength: 30,
          createdAt: new Date().toISOString(),
        });
    }
    return groups;
  } catch {
    return [];
  }
}
