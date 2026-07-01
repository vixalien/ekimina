import type {
  Group,
  GroupMembership,
  PublicGroup,
  JoinRequest,
  GroupDashboardData,
  MemberStanding,
  ContributionHistoryEntry,
  ActivityPendingRequest,
  OutstandingLoan,
  Transaction,
  TransactionDetail,
  ContributionDetail,
  PayoutDetail,
  PenaltyDetail,
  LoanRepaymentDetail,
  LoanDisbursementDetail,
  DiscretionaryDetail,
  LoanDetail,
  LoanRequestReview,
  DiscretionaryFundReview,
  JoinRequestReview,
  MemberWithdrawalReview,
  GroupInviteData,
  GroupSettings,
  UserProfile,
  CommitteeMember,
  SettingsChangeRequest,
} from "../types";
import { MOCK_USERS } from "./users";

// ── Groups ──────────────────────────────────────────────────────────────

const GROUP_1: Group = {
  id: "group-1",
  name: "Umugongo W'Abaturage",
  memberCount: 28,
  isPublic: false,
  inviteCode: "KICUKIRO2025",
  avatarInitials: "UW",
  createdAt: "2024-08-01T00:00:00Z",
};

const GROUP_2: Group = {
  id: "group-2",
  name: "Abahuza Savings Circle",
  memberCount: 12,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "AS",
  createdAt: "2025-01-10T00:00:00Z",
};

const GROUP_3: Group = {
  id: "group-3",
  name: "Imena Cooperative",
  memberCount: 48,
  isPublic: true,
  inviteCode: "IMENA2025",
  avatarInitials: "IC",
  createdAt: "2023-11-15T00:00:00Z",
};

const GROUP_4: Group = {
  id: "group-4",
  name: "Kigali Entrepreneurs IKIMINA",
  memberCount: 31,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "KE",
  createdAt: "2024-06-20T00:00:00Z",
};

const GROUP_5: Group = {
  id: "group-5",
  name: "Abanyeshuri Fund",
  memberCount: 18,
  isPublic: true,
  inviteCode: null,
  avatarInitials: "AF",
  createdAt: "2025-02-01T00:00:00Z",
};

export const ALL_GROUPS: Group[] = [GROUP_1, GROUP_2, GROUP_3, GROUP_4, GROUP_5];

export const MOCK_MEMBERSHIPS: Record<string, GroupMembership[]> = {
  "+250788123456": [{ group: GROUP_1, role: "admin", joinedAt: "2024-08-01T00:00:00Z" }],
  "+250788654321": [
    { group: GROUP_1, role: "member", joinedAt: "2025-02-01T00:00:00Z" },
    { group: GROUP_2, role: "treasurer", joinedAt: "2025-01-15T00:00:00Z" },
  ],
};

export const INVITE_CODE_MAP: Record<string, string> = {
  KICUKIRO2025: "group-1",
  IMENA2025: "group-3",
};

export function toPublicGroup(group: Group): PublicGroup {
  return {
    id: group.id,
    name: group.name,
    memberCount: group.memberCount,
    avatarInitials: group.avatarInitials,
  };
}

// ── Structured mock group data ──────────────────────────────────────────

interface MockCycleConfig {
  currentCycle: number;
  totalCycles: number;
  contributionAmount: number;
  payoutAmount: number;
  cycleLengthDays: number;
  startDate: string;
}

interface MockMemberEntry {
  userId: string;
  name: string;
  initials: string;
}

interface MockGroupExtendedData {
  cycleConfig: MockCycleConfig;
  members: MockMemberEntry[];
  currentCyclePayments: Record<string, MemberStanding["status"]>;
  paymentHistory: Record<string, Record<number, ContributionHistoryEntry["status"]>>;
  memberReputations: Record<string, number>;
  memberLoans: Record<string, { id: string; amount: number; state: string }[]>;
  reserveHistory: number[];
  nextPayoutRecipientId: string;
  daysUntilPayout: number;
}

/** Generate a 2-letter initials string from a name. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Build a member roster for a group that includes known app users (from MOCK_USERS
 * matching MOCK_MEMBERSHIPS) plus filler members to reach `count`.
 */
type MemberStatus = ContributionHistoryEntry["status"];

function generatePaymentHistory(
  currentStatus: MemberStanding["status"],
  currentCycle: number
): Record<number, MemberStatus> {
  const history: Record<number, MemberStatus> = {};
  for (let c = 1; c <= currentCycle; c++) {
    if (c === currentCycle) {
      if (currentStatus === "paid") history[c] = "paid_on_time";
      else if (currentStatus === "pending_late") history[c] = "paid_late";
      else if (currentStatus === "missed_penalised") history[c] = "missed";
      else history[c] = "paid_on_time"; // no_status defaults to on time for past
    } else {
      const rand = (c * 7 + currentCycle * 3) % 10;
      if (rand < 7) history[c] = "paid_on_time";
      else if (rand < 9) history[c] = "paid_late";
      else history[c] = "missed";
    }
  }
  return history;
}

function calcReputation(history: Record<number, MemberStatus>): number {
  const entries = Object.values(history);
  if (entries.length === 0) return 50;
  const onTime = entries.filter((s) => s === "paid_on_time").length;
  const late = entries.filter((s) => s === "paid_late").length;
  const missed = entries.filter((s) => s === "missed").length;
  const score = Math.round(
    (onTime / entries.length) * 70 + (late / entries.length) * 15 + 15 - missed * 3
  );
  return Math.min(100, Math.max(0, score));
}

function buildRoster(
  groupId: string,
  count: number,
  extras: { userId: string; name: string }[]
): MockMemberEntry[] {
  // Known app users in this group
  const known: MockMemberEntry[] = [];
  for (const phone of Object.keys(MOCK_MEMBERSHIPS)) {
    const ms = MOCK_MEMBERSHIPS[phone];
    if (!ms?.some((m) => m.group.id === groupId)) continue;
    const user = MOCK_USERS[phone];
    if (!user || !user.name) continue;
    known.push({ userId: user.id, name: user.name, initials: initialsOf(user.name) });
  }

  // Fill remaining slots with extras
  const remaining = count - known.length;
  const fillers = extras.slice(0, Math.max(0, remaining)).map((e) => ({
    userId: e.userId,
    name: e.name,
    initials: initialsOf(e.name),
  }));

  return [...known, ...fillers];
}

const GROUP_1_MEMBERS = buildRoster("group-1", 28, [
  { userId: "g1m-3", name: "Patrick Kabera" },
  { userId: "g1m-4", name: "Diane Mukamana" },
  { userId: "g1m-5", name: "Eric Bakunda" },
  { userId: "g1m-6", name: "Alice Niyonzima" },
  { userId: "g1m-7", name: "Jean Havugimana" },
  { userId: "g1m-8", name: "Grace Niyonsaba" },
  { userId: "g1m-9", name: "David Bizimana" },
  { userId: "g1m-10", name: "Claudine Kagame" },
  { userId: "g1m-11", name: "Fiston Mugisha" },
  { userId: "g1m-12", name: "Lauren Yvonne" },
  { userId: "g1m-13", name: "Pierre Abimana" },
  { userId: "g1m-14", name: "Beatrice Zawadi" },
  { userId: "g1m-15", name: "Sandrine Nikuze" },
  { userId: "g1m-16", name: "Alain Kamanzi" },
  { userId: "g1m-17", name: "Jeanne Yvonne" },
  { userId: "g1m-18", name: "Olivier Tuyishime" },
  { userId: "g1m-19", name: "Isabelle Niyonteze" },
  { userId: "g1m-20", name: "Cyprien Yuhi" },
  { userId: "g1m-21", name: "Faustin Abizeyimana" },
  { userId: "g1m-22", name: "Rose Shyaka" },
  { userId: "g1m-23", name: "Emmanuel Kirezi" },
  { userId: "g1m-24", name: "Ange Niwemfura" },
  { userId: "g1m-25", name: "Christian Habimana" },
  { userId: "g1m-26", name: "Lydie Pudence" },
  { userId: "g1m-27", name: "Noella Turkurire" },
  { userId: "g1m-28", name: "Theogene Mugenzi" },
]);

const GROUP_2_MEMBERS = buildRoster("group-2", 12, [
  { userId: "g2m-3", name: "Patrick Kabera" },
  { userId: "g2m-4", name: "Diane Mukamana" },
  { userId: "g2m-5", name: "Eric Bakunda" },
  { userId: "g2m-6", name: "Alice Niyonzima" },
  { userId: "g2m-7", name: "Jean Havugimana" },
  { userId: "g2m-8", name: "Grace Niyonsaba" },
  { userId: "g2m-9", name: "David Bizimana" },
  { userId: "g2m-10", name: "Claudine Kagame" },
  { userId: "g2m-11", name: "Fiston Mugisha" },
  { userId: "g2m-12", name: "Lauren Yvonne" },
]);

function buildPaymentHistories(
  members: MockMemberEntry[],
  currentCyclePayments: Record<string, MemberStanding["status"]>,
  currentCycle: number
): {
  paymentHistory: Record<string, Record<number, MemberStatus>>;
  memberReputations: Record<string, number>;
} {
  const paymentHistory: Record<string, Record<number, MemberStatus>> = {};
  const memberReputations: Record<string, number> = {};
  for (const m of members) {
    const history = generatePaymentHistory(
      currentCyclePayments[m.userId] ?? "no_status",
      currentCycle
    );
    paymentHistory[m.userId] = history;
    memberReputations[m.userId] = calcReputation(history);
  }
  return { paymentHistory, memberReputations };
}

const G1_PAYMENTS = {
  "user-1": "paid" as const, // Jean Mugabo
  "user-2": "paid" as const, // Marie Uwimana
  "g1m-3": "paid" as const,
  "g1m-4": "paid" as const,
  "g1m-5": "paid" as const,
  "g1m-6": "paid" as const,
  "g1m-7": "paid" as const,
  "g1m-8": "paid" as const,
  "g1m-9": "pending_late" as const,
  "g1m-10": "paid" as const,
  "g1m-11": "paid" as const,
  "g1m-12": "paid" as const,
  "g1m-13": "pending_late" as const,
  "g1m-14": "paid" as const,
  "g1m-15": "paid" as const,
  "g1m-16": "missed_penalised" as const,
  "g1m-17": "paid" as const,
  "g1m-18": "no_status" as const,
  "g1m-19": "paid" as const,
  "g1m-20": "paid" as const,
  "g1m-21": "paid" as const,
  "g1m-22": "pending_late" as const,
  "g1m-23": "paid" as const,
  "g1m-24": "paid" as const,
  "g1m-25": "paid" as const,
  "g1m-26": "paid" as const,
  "g1m-27": "paid" as const,
  "g1m-28": "paid" as const,
};

const G1_HISTORIES = buildPaymentHistories(GROUP_1_MEMBERS, G1_PAYMENTS, 7);

const MOCK_GROUP_DATA: Record<string, MockGroupExtendedData> = {
  "group-1": {
    cycleConfig: {
      currentCycle: 7,
      totalCycles: 12,
      contributionAmount: 5000,
      payoutAmount: 21000,
      cycleLengthDays: 30,
      startDate: "2024-08-01T00:00:00Z",
    },
    members: GROUP_1_MEMBERS,
    currentCyclePayments: G1_PAYMENTS,
    paymentHistory: G1_HISTORIES.paymentHistory,
    memberReputations: G1_HISTORIES.memberReputations,
    memberLoans: {
      "user-1": [{ id: "loan-1", amount: 25000, state: "requested, 1 of 3 signed" }],
      "user-2": [{ id: "loan-2", amount: 12000, state: "repaying cycle 9" }],
      "g1m-5": [{ id: "loan-3", amount: 30000, state: "disbursed, repaying cycle 8" }],
      "g1m-16": [{ id: "loan-4", amount: 8000, state: "repaying cycle 4" }],
    },
    reserveHistory: [120000, 132000, 141000, 153000, 162000, 174000, 184500],
    nextPayoutRecipientId: "user-1",
    daysUntilPayout: 3,
  },
  "group-2": {
    cycleConfig: {
      currentCycle: 3,
      totalCycles: 12,
      contributionAmount: 10000,
      payoutAmount: 42000,
      cycleLengthDays: 14,
      startDate: "2025-01-10T00:00:00Z",
    },
    members: GROUP_2_MEMBERS,
    currentCyclePayments: {
      "user-2": "paid",
      "g2m-3": "paid",
      "g2m-4": "paid",
      "g2m-5": "paid",
      "g2m-6": "paid",
      "g2m-7": "paid",
      "g2m-8": "paid",
      "g2m-9": "pending_late",
      "g2m-10": "paid",
      "g2m-11": "paid",
      "g2m-12": "no_status",
    },
    paymentHistory: buildPaymentHistories(
      GROUP_2_MEMBERS,
      {
        "user-2": "paid",
        "g2m-3": "paid",
        "g2m-4": "paid",
        "g2m-5": "paid",
        "g2m-6": "paid",
        "g2m-7": "paid",
        "g2m-8": "paid",
        "g2m-9": "pending_late",
        "g2m-10": "paid",
        "g2m-11": "paid",
        "g2m-12": "no_status",
      },
      3
    ).paymentHistory,
    memberReputations: buildPaymentHistories(
      GROUP_2_MEMBERS,
      {
        "user-2": "paid",
        "g2m-3": "paid",
        "g2m-4": "paid",
        "g2m-5": "paid",
        "g2m-6": "paid",
        "g2m-7": "paid",
        "g2m-8": "paid",
        "g2m-9": "pending_late",
        "g2m-10": "paid",
        "g2m-11": "paid",
        "g2m-12": "no_status",
      },
      3
    ).memberReputations,
    memberLoans: {
      "g2m-5": [{ id: "loan-5", amount: 20000, state: "requested, 2 of 4 signed" }],
    },
    reserveHistory: [45000, 62000, 85000],
    nextPayoutRecipientId: "user-2",
    daysUntilPayout: -2,
  },
};

// ── Dashboard computation ───────────────────────────────────────────────

export function computeDashboard(groupId: string): GroupDashboardData {
  const group = ALL_GROUPS.find((g) => g.id === groupId);
  const extra = MOCK_GROUP_DATA[groupId];
  if (!group || !extra) throw new Error("Group not found");

  const {
    cycleConfig,
    members,
    currentCyclePayments,
    reserveHistory,
    nextPayoutRecipientId,
    daysUntilPayout,
  } = extra;

  const paidCount = Object.values(currentCyclePayments).filter((s) => s === "paid").length;
  const reserveBalance = reserveHistory[reserveHistory.length - 1] ?? 0;
  const recipient = members.find((m) => m.userId === nextPayoutRecipientId) ?? members[0]!;

  return {
    currentCycle: cycleConfig.currentCycle,
    totalCycles: cycleConfig.totalCycles,
    paidCount,
    totalMemberCount: members.length,
    reserveBalance,
    reserveHistory,
    contributionAmount: cycleConfig.contributionAmount,
    payoutAmount: cycleConfig.payoutAmount,
    nextPayoutRecipient: { name: recipient.name, initials: recipient.initials },
    daysUntilPayout,
    members: members.map((m) => ({
      userId: m.userId,
      initials: m.initials,
      name: m.name,
      status: currentCyclePayments[m.userId] ?? "no_status",
    })),
  };
}

export { MOCK_GROUP_DATA };

// ── Pending requests ────────────────────────────────────────────────────

export const MOCK_PENDING_REQUESTS: Record<string, JoinRequest> = {
  "+250788777666": {
    id: "req-1",
    groupId: "group-1",
    groupName: "Umugongo W'Abaturage",
    status: "pending",
    requestedAt: "2026-06-25T09:00:00Z",
  },
};

// ── Activity: pending requests (multi-sig committee actions) ────────────

export const MOCK_ACTIVITY_REQUESTS: Record<string, ActivityPendingRequest[]> = {
  "group-1": [
    {
      id: "loan-1",
      type: "loan_request",
      subject: "Habimana P.",
      amountOrValue: "25,000 RWF",
      signatureCount: 1,
      signatureThreshold: 3,
      timestamp: "2026-06-28T10:30:00Z",
    },
    {
      id: "act-req-2",
      type: "join_request",
      subject: "Kagabo D.",
      amountOrValue: undefined,
      signatureCount: 0,
      signatureThreshold: 2,
      timestamp: "2026-06-29T08:00:00Z",
    },
    {
      id: "act-req-3",
      type: "settings_change",
      subject: "penalty rate",
      amountOrValue: "15% \u2192 20%",
      signatureCount: 1,
      signatureThreshold: 2,
      timestamp: "2026-06-29T14:00:00Z",
    },
    {
      id: "act-req-4",
      type: "discretionary_fund",
      subject: "Social fund \u00b7 5,000 RWF",
      amountOrValue: "5,000 RWF",
      signatureCount: 0,
      signatureThreshold: 2,
      timestamp: "2026-06-30T10:00:00Z",
    },
    {
      id: "act-req-5",
      type: "member_withdrawal",
      subject: "Uwimana A.",
      amountOrValue: undefined,
      signatureCount: 1,
      signatureThreshold: 2,
      timestamp: "2026-06-30T12:00:00Z",
    },
  ],
};

// ── Activity: outstanding loans ─────────────────────────────────────────

export const MOCK_OUTSTANDING_LOANS: Record<string, OutstandingLoan[]> = {
  "group-1": [
    {
      loanId: "loan-3",
      borrowerName: "Eric Bakunda",
      borrowerInitials: "EB",
      borrowerUserId: "g1m-5",
      amount: 30000,
      dueCycle: 8,
    },
    {
      loanId: "loan-2",
      borrowerName: "Marie Uwimana",
      borrowerInitials: "MU",
      borrowerUserId: "user-2",
      amount: 12000,
      dueCycle: 9,
    },
    {
      loanId: "loan-4",
      borrowerName: "Alain Kamanzi",
      borrowerInitials: "AK",
      borrowerUserId: "g1m-16",
      amount: 8000,
      dueCycle: 10,
    },
  ],
};

// ── Activity: transaction feed ──────────────────────────────────────────

export const MOCK_TRANSACTIONS: Record<string, Transaction[]> = {
  "group-1": [
    // Cycle 7 (current) — most recent first
    {
      id: "tx-01",
      type: "contribution",
      memberName: "Jean Mugabo",
      memberInitials: "JM",
      memberId: "user-1",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-28T09:14:00Z",
    },
    {
      id: "tx-02",
      type: "contribution",
      memberName: "Marie Uwimana",
      memberInitials: "MU",
      memberId: "user-2",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-27T11:02:00Z",
    },
    {
      id: "tx-03",
      type: "contribution",
      memberName: "Diane Mukamana",
      memberInitials: "DM",
      memberId: "g1m-4",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-26T14:30:00Z",
    },
    {
      id: "tx-04",
      type: "contribution",
      memberName: "Patrick Kabera",
      memberInitials: "PK",
      memberId: "g1m-3",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-25T08:45:00Z",
    },
    {
      id: "tx-05",
      type: "contribution",
      memberName: "Rose Shyaka",
      memberInitials: "RS",
      memberId: "g1m-22",
      amount: 5000,
      direction: "inflow",
      status: "pending",
      cycle: 7,
      timestamp: "2026-06-24T16:20:00Z",
    },
    {
      id: "tx-06",
      type: "contribution",
      memberName: "Alain Kamanzi",
      memberInitials: "AK",
      memberId: "g1m-16",
      amount: 5000,
      direction: "inflow",
      status: "failed",
      cycle: 6,
      timestamp: "2026-05-29T10:05:00Z",
    },
    {
      id: "tx-07",
      type: "penalty",
      memberName: "Alain Kamanzi",
      memberInitials: "AK",
      memberId: "g1m-16",
      amount: 500,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-23T09:00:00Z",
    },
    {
      id: "tx-08",
      type: "loan_repayment",
      memberName: "Marie Uwimana",
      memberInitials: "MU",
      memberId: "user-2",
      amount: 2400,
      direction: "inflow",
      status: "confirmed",
      cycle: 7,
      timestamp: "2026-06-20T13:44:00Z",
    },
    // Cycle 6
    {
      id: "tx-09",
      type: "payout",
      memberName: "Beatrice Zawadi",
      memberInitials: "BZ",
      memberId: "g1m-14",
      amount: 21000,
      direction: "outflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-31T10:00:00Z",
    },
    {
      id: "tx-10",
      type: "loan_repayment",
      memberName: "Eric Bakunda",
      memberInitials: "EB",
      memberId: "g1m-5",
      amount: 3000,
      direction: "inflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-20T15:10:00Z",
    },
    {
      id: "tx-11",
      type: "contribution",
      memberName: "Jean Havugimana",
      memberInitials: "JH",
      memberId: "g1m-7",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-15T09:30:00Z",
    },
    {
      id: "tx-12",
      type: "contribution",
      memberName: "Fiston Mugisha",
      memberInitials: "FM",
      memberId: "g1m-11",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-10T11:00:00Z",
    },
    {
      id: "tx-13",
      type: "loan_disbursement",
      memberName: "Eric Bakunda",
      memberInitials: "EB",
      memberId: "g1m-5",
      amount: 30000,
      direction: "outflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-05T14:00:00Z",
    },
    {
      id: "tx-14",
      type: "penalty",
      memberName: "Rose Shyaka",
      memberInitials: "RS",
      memberId: "g1m-22",
      amount: 500,
      direction: "inflow",
      status: "confirmed",
      cycle: 6,
      timestamp: "2026-05-03T09:00:00Z",
    },
    // Cycle 5
    {
      id: "tx-15",
      type: "payout",
      memberName: "Grace Niyonsaba",
      memberInitials: "GN",
      memberId: "g1m-8",
      amount: 21000,
      direction: "outflow",
      status: "confirmed",
      cycle: 5,
      timestamp: "2026-04-30T10:00:00Z",
    },
    {
      id: "tx-16",
      type: "discretionary_deposit",
      memberName: "Claudine Kagame",
      memberInitials: "CK",
      memberId: "g1m-10",
      amount: 15000,
      direction: "inflow",
      status: "confirmed",
      cycle: 5,
      timestamp: "2026-04-20T13:00:00Z",
    },
    {
      id: "tx-17",
      type: "contribution",
      memberName: "David Bizimana",
      memberInitials: "DB",
      memberId: "g1m-9",
      amount: 5000,
      direction: "inflow",
      status: "confirmed",
      cycle: 5,
      timestamp: "2026-04-15T10:30:00Z",
    },
    // Cycle 4
    {
      id: "tx-18",
      type: "loan_disbursement",
      memberName: "Marie Uwimana",
      memberInitials: "MU",
      memberId: "user-2",
      amount: 12000,
      direction: "outflow",
      status: "confirmed",
      cycle: 4,
      timestamp: "2026-03-10T11:00:00Z",
    },
    {
      id: "tx-19",
      type: "discretionary_withdrawal",
      memberName: "Cyprien Yuhi",
      memberInitials: "CY",
      memberId: "g1m-20",
      amount: 8000,
      direction: "outflow",
      status: "confirmed",
      cycle: 4,
      timestamp: "2026-03-05T09:30:00Z",
    },
    {
      id: "tx-20",
      type: "payout",
      memberName: "Emmanuel Kirezi",
      memberInitials: "EK",
      memberId: "g1m-23",
      amount: 21000,
      direction: "outflow",
      status: "confirmed",
      cycle: 4,
      timestamp: "2026-02-28T10:00:00Z",
    },
  ],
};

// ── Activity: transaction details ───────────────────────────────────────

const TX_DETAIL_MAP: Record<string, TransactionDetail> = {
  "tx-01": {
    id: "tx-01",
    type: "contribution",
    memberName: "Jean Mugabo",
    memberInitials: "JM",
    memberId: "user-1",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-28T09:14:00Z",
    fromName: "Jean Mugabo",
    method: "MTN MoMo",
    referenceId: "MM260628.0914.A7B3",
    contextNote: "Counted toward cycle 7 completion.",
  } satisfies ContributionDetail,

  "tx-02": {
    id: "tx-02",
    type: "contribution",
    memberName: "Marie Uwimana",
    memberInitials: "MU",
    memberId: "user-2",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-27T11:02:00Z",
    fromName: "Marie Uwimana",
    method: "MTN MoMo",
    referenceId: "MM260627.1102.C4D9",
    contextNote: "Counted toward cycle 7 completion.",
  } satisfies ContributionDetail,

  "tx-03": {
    id: "tx-03",
    type: "contribution",
    memberName: "Diane Mukamana",
    memberInitials: "DM",
    memberId: "g1m-4",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-26T14:30:00Z",
    fromName: "Diane Mukamana",
    method: "MTN MoMo",
    referenceId: "MM260626.1430.E2F1",
    contextNote: "Counted toward cycle 7 completion.",
  } satisfies ContributionDetail,

  "tx-04": {
    id: "tx-04",
    type: "contribution",
    memberName: "Patrick Kabera",
    memberInitials: "PK",
    memberId: "g1m-3",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-25T08:45:00Z",
    fromName: "Patrick Kabera",
    method: "MTN MoMo",
    referenceId: "MM260625.0845.F8G2",
    contextNote: "Counted toward cycle 7 completion.",
  } satisfies ContributionDetail,

  "tx-05": {
    id: "tx-05",
    type: "contribution",
    memberName: "Rose Shyaka",
    memberInitials: "RS",
    memberId: "g1m-22",
    amount: 5000,
    direction: "inflow",
    status: "pending",
    cycle: 7,
    timestamp: "2026-06-24T16:20:00Z",
    fromName: "Rose Shyaka",
    method: "MTN MoMo",
    referenceId: "MM260624.1620.H5K7",
    failureReason: undefined,
    contextNote: undefined,
  } satisfies ContributionDetail,

  "tx-06": {
    id: "tx-06",
    type: "contribution",
    memberName: "Alain Kamanzi",
    memberInitials: "AK",
    memberId: "g1m-16",
    amount: 5000,
    direction: "inflow",
    status: "failed",
    cycle: 6,
    timestamp: "2026-05-29T10:05:00Z",
    fromName: "Alain Kamanzi",
    method: "MTN MoMo",
    referenceId: "MM260529.1005.J3L9",
    failureReason:
      "Insufficient balance on the MTN MoMo account. This contribution was not counted toward cycle 6.",
    contextNote: undefined,
  } satisfies ContributionDetail,

  "tx-07": {
    id: "tx-07",
    type: "penalty",
    memberName: "Alain Kamanzi",
    memberInitials: "AK",
    memberId: "g1m-16",
    amount: 500,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-23T09:00:00Z",
    reason: "Missed cycle 6 contribution",
    appliedBy: "System rule",
    contextNote: "Penalty added to the group reserve.",
  } satisfies PenaltyDetail,

  "tx-08": {
    id: "tx-08",
    type: "loan_repayment",
    memberName: "Marie Uwimana",
    memberInitials: "MU",
    memberId: "user-2",
    amount: 2400,
    direction: "inflow",
    status: "confirmed",
    cycle: 7,
    timestamp: "2026-06-20T13:44:00Z",
    installmentNumber: 3,
    totalInstallments: 5,
    method: "MTN MoMo",
    linkedLoanId: "loan-2",
    contextNote: "Interest contributed to the group reserve.",
  } satisfies LoanRepaymentDetail,

  "tx-09": {
    id: "tx-09",
    type: "payout",
    memberName: "Beatrice Zawadi",
    memberInitials: "BZ",
    memberId: "g1m-14",
    amount: 21000,
    direction: "outflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-31T10:00:00Z",
    toName: "Beatrice Zawadi",
    source: "Cycle 6 pool",
    method: "MTN MoMo",
    contextNote: "Payout for cycle 6 rotation.",
  } satisfies PayoutDetail,

  "tx-10": {
    id: "tx-10",
    type: "loan_repayment",
    memberName: "Eric Bakunda",
    memberInitials: "EB",
    memberId: "g1m-5",
    amount: 3000,
    direction: "inflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-20T15:10:00Z",
    installmentNumber: 1,
    totalInstallments: 5,
    method: "MTN MoMo",
    linkedLoanId: "loan-3",
    contextNote: "Interest contributed to the group reserve.",
  } satisfies LoanRepaymentDetail,

  "tx-11": {
    id: "tx-11",
    type: "contribution",
    memberName: "Jean Havugimana",
    memberInitials: "JH",
    memberId: "g1m-7",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-15T09:30:00Z",
    fromName: "Jean Havugimana",
    method: "MTN MoMo",
    referenceId: "MM260515.0930.K1M4",
    contextNote: "Counted toward cycle 6 completion.",
  } satisfies ContributionDetail,

  "tx-12": {
    id: "tx-12",
    type: "contribution",
    memberName: "Fiston Mugisha",
    memberInitials: "FM",
    memberId: "g1m-11",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-10T11:00:00Z",
    fromName: "Fiston Mugisha",
    method: "MTN MoMo",
    referenceId: "MM260510.1100.L6N8",
    contextNote: "Counted toward cycle 6 completion.",
  } satisfies ContributionDetail,

  "tx-13": {
    id: "tx-13",
    type: "loan_disbursement",
    memberName: "Eric Bakunda",
    memberInitials: "EB",
    memberId: "g1m-5",
    amount: 30000,
    direction: "outflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-05T14:00:00Z",
    toName: "Eric Bakunda",
    method: "MTN MoMo",
    contextNote: "Loan approved by committee and disbursed from reserve.",
  } satisfies LoanDisbursementDetail,

  "tx-14": {
    id: "tx-14",
    type: "penalty",
    memberName: "Rose Shyaka",
    memberInitials: "RS",
    memberId: "g1m-22",
    amount: 500,
    direction: "inflow",
    status: "confirmed",
    cycle: 6,
    timestamp: "2026-05-03T09:00:00Z",
    reason: "Late contribution in cycle 5",
    appliedBy: "System rule",
    contextNote: "Penalty added to the group reserve.",
  } satisfies PenaltyDetail,

  "tx-15": {
    id: "tx-15",
    type: "payout",
    memberName: "Grace Niyonsaba",
    memberInitials: "GN",
    memberId: "g1m-8",
    amount: 21000,
    direction: "outflow",
    status: "confirmed",
    cycle: 5,
    timestamp: "2026-04-30T10:00:00Z",
    toName: "Grace Niyonsaba",
    source: "Cycle 5 pool",
    method: "MTN MoMo",
    contextNote: "Payout for cycle 5 rotation.",
  } satisfies PayoutDetail,

  "tx-16": {
    id: "tx-16",
    type: "discretionary_deposit",
    memberName: "Claudine Kagame",
    memberInitials: "CK",
    memberId: "g1m-10",
    amount: 15000,
    direction: "inflow",
    status: "confirmed",
    cycle: 5,
    timestamp: "2026-04-20T13:00:00Z",
    category: "Emergency fund",
    counterparty: "Claudine Kagame",
    reason: "Personal contribution to discretionary reserve",
    approvedBy: "Jean Mugabo",
    contextNote: "Added to the discretionary fund reserve.",
  } satisfies DiscretionaryDetail,

  "tx-17": {
    id: "tx-17",
    type: "contribution",
    memberName: "David Bizimana",
    memberInitials: "DB",
    memberId: "g1m-9",
    amount: 5000,
    direction: "inflow",
    status: "confirmed",
    cycle: 5,
    timestamp: "2026-04-15T10:30:00Z",
    fromName: "David Bizimana",
    method: "MTN MoMo",
    referenceId: "MM260415.1030.N2P5",
    contextNote: "Counted toward cycle 5 completion.",
  } satisfies ContributionDetail,

  "tx-18": {
    id: "tx-18",
    type: "loan_disbursement",
    memberName: "Marie Uwimana",
    memberInitials: "MU",
    memberId: "user-2",
    amount: 12000,
    direction: "outflow",
    status: "confirmed",
    cycle: 4,
    timestamp: "2026-03-10T11:00:00Z",
    toName: "Marie Uwimana",
    method: "MTN MoMo",
    contextNote: "Loan approved by committee and disbursed from reserve.",
  } satisfies LoanDisbursementDetail,

  "tx-19": {
    id: "tx-19",
    type: "discretionary_withdrawal",
    memberName: "Cyprien Yuhi",
    memberInitials: "CY",
    memberId: "g1m-20",
    amount: 8000,
    direction: "outflow",
    status: "confirmed",
    cycle: 4,
    timestamp: "2026-03-05T09:30:00Z",
    category: "Medical assistance",
    counterparty: "Cyprien Yuhi",
    reason: "Emergency medical expense support",
    approvedBy: "Jean Mugabo",
    contextNote: "Withdrawn from the discretionary fund reserve.",
  } satisfies DiscretionaryDetail,

  "tx-20": {
    id: "tx-20",
    type: "payout",
    memberName: "Emmanuel Kirezi",
    memberInitials: "EK",
    memberId: "g1m-23",
    amount: 21000,
    direction: "outflow",
    status: "confirmed",
    cycle: 4,
    timestamp: "2026-02-28T10:00:00Z",
    toName: "Emmanuel Kirezi",
    source: "Cycle 4 pool",
    method: "MTN MoMo",
    contextNote: "Payout for cycle 4 rotation.",
  } satisfies PayoutDetail,
};

export function getTransactionDetail(transactionId: string): TransactionDetail | null {
  return TX_DETAIL_MAP[transactionId] ?? null;
}

// ── Loan lifecycle mock data ──────────────────────────────────────────

const LOAN_DEADLINE = "2026-12-31T00:00:00Z";

export const MOCK_LOAN_DETAILS: Record<string, LoanDetail> = {
  "loan-1": {
    loanId: "loan-1",
    borrowerName: "Jean Mugabo",
    borrowerInitials: "JM",
    borrowerUserId: "user-1",
    borrowerRole: "Admin",
    borrowerJoinedCycle: 1,
    amount: 25000,
    interestRate: 5,
    currentState: "signing",
    purpose: "Home renovation materials",
    deadline: LOAN_DEADLINE,
    signatureThreshold: 3,
    collectedSignatures: 1,
    signatures: [
      {
        userId: "user-2",
        name: "Marie Uwimana",
        initials: "MU",
        role: "Treasurer",
        signed: true,
        signedAt: "2026-06-28T11:00:00Z",
      },
      { userId: "g1m-3", name: "Patrick Kabera", initials: "PK", role: "Member", signed: false },
      { userId: "g1m-4", name: "Diane Mukamana", initials: "DM", role: "Member", signed: false },
    ],
  },

  "loan-2": {
    loanId: "loan-2",
    borrowerName: "Marie Uwimana",
    borrowerInitials: "MU",
    borrowerUserId: "user-2",
    borrowerRole: "Treasurer",
    borrowerJoinedCycle: 1,
    amount: 12000,
    interestRate: 5,
    currentState: "repaying",
    purpose: "School fees for second term",
    deadline: "2026-09-30T00:00:00Z",
    totalOwed: 12600,
    amountPaid: 5040,
    lastPaymentAt: "2026-06-20T13:44:00Z",
  },

  "loan-3": {
    loanId: "loan-3",
    borrowerName: "Eric Bakunda",
    borrowerInitials: "EB",
    borrowerUserId: "g1m-5",
    borrowerRole: "Member",
    borrowerJoinedCycle: 1,
    amount: 30000,
    interestRate: 5,
    currentState: "repaying",
    purpose: "Small business inventory restock",
    deadline: "2026-11-30T00:00:00Z",
    totalOwed: 31500,
    amountPaid: 6300,
    lastPaymentAt: "2026-05-20T15:10:00Z",
  },

  "loan-4": {
    loanId: "loan-4",
    borrowerName: "Alain Kamanzi",
    borrowerInitials: "AK",
    borrowerUserId: "g1m-16",
    borrowerRole: "Member",
    borrowerJoinedCycle: 3,
    amount: 8000,
    interestRate: 5,
    currentState: "repaying",
    purpose: "Medical expenses",
    deadline: "2026-08-15T00:00:00Z",
    totalOwed: 8400,
    amountPaid: 6300,
    lastPaymentAt: "2026-06-15T10:00:00Z",
  },

  "loan-5": {
    loanId: "loan-5",
    borrowerName: "Eric Bakunda",
    borrowerInitials: "EB",
    borrowerUserId: "g2m-5",
    borrowerRole: "Member",
    borrowerJoinedCycle: 1,
    amount: 20000,
    interestRate: 5,
    currentState: "signing",
    purpose: "Agricultural inputs for planting season",
    deadline: LOAN_DEADLINE,
    signatureThreshold: 4,
    collectedSignatures: 2,
    signatures: [
      {
        userId: "user-2",
        name: "Marie Uwimana",
        initials: "MU",
        role: "Treasurer",
        signed: true,
        signedAt: "2026-06-27T10:00:00Z",
      },
      {
        userId: "g2m-3",
        name: "Patrick Kabera",
        initials: "PK",
        role: "Member",
        signed: true,
        signedAt: "2026-06-28T09:00:00Z",
      },
      { userId: "g2m-4", name: "Diane Mukamana", initials: "DM", role: "Member", signed: false },
      { userId: "g2m-6", name: "Alice Niyonzima", initials: "AN", role: "Member", signed: false },
    ],
  },

  "loan-6": {
    loanId: "loan-6",
    borrowerName: "Diane Mukamana",
    borrowerInitials: "DM",
    borrowerUserId: "g1m-4",
    borrowerRole: "Member",
    borrowerJoinedCycle: 2,
    amount: 15000,
    interestRate: 5,
    currentState: "requested",
    purpose: "Tailoring equipment purchase",
    deadline: LOAN_DEADLINE,
    submittedAt: "2026-06-29T14:00:00Z",
    signatureThreshold: 3,
    collectedSignatures: 0,
  },

  "loan-7": {
    loanId: "loan-7",
    borrowerName: "Patrick Kabera",
    borrowerInitials: "PK",
    borrowerUserId: "g1m-3",
    borrowerRole: "Member",
    borrowerJoinedCycle: 1,
    amount: 20000,
    interestRate: 5,
    currentState: "approved",
    purpose: "Motorcycle repair and registration",
    deadline: LOAN_DEADLINE,
    approvedAt: "2026-06-29T16:00:00Z",
  },

  "loan-8": {
    loanId: "loan-8",
    borrowerName: "Grace Niyonsaba",
    borrowerInitials: "GN",
    borrowerUserId: "g1m-8",
    borrowerRole: "Member",
    borrowerJoinedCycle: 1,
    amount: 18000,
    interestRate: 5,
    currentState: "disbursed",
    purpose: "Market stall expansion",
    deadline: "2026-10-31T00:00:00Z",
    disbursedAt: "2026-06-25T10:00:00Z",
    disbursementTransactionId: "tx-13",
    totalOwed: 18900,
    amountPaid: 0,
  },

  "loan-9": {
    loanId: "loan-9",
    borrowerName: "Jean Havugimana",
    borrowerInitials: "JH",
    borrowerUserId: "g1m-7",
    borrowerRole: "Member",
    borrowerJoinedCycle: 2,
    amount: 10000,
    interestRate: 5,
    currentState: "repaid",
    purpose: "Emergency family support",
    deadline: "2026-06-01T00:00:00Z",
    totalOwed: 10500,
    completedAt: "2026-05-28T10:00:00Z",
  },

  "loan-10": {
    loanId: "loan-10",
    borrowerName: "Sandrine Nikuze",
    borrowerInitials: "SN",
    borrowerUserId: "g1m-15",
    borrowerRole: "Member",
    borrowerJoinedCycle: 3,
    amount: 20000,
    interestRate: 5,
    currentState: "defaulted",
    purpose: "Farming equipment rental",
    deadline: "2026-08-01T00:00:00Z",
    remainingBalance: 12600,
    amountPaidBeforeDefault: 7400,
    reputationImpact: -20,
  },
};

export const MOCK_LOAN_REVIEWS: Record<string, LoanRequestReview> = {
  "loan-1": {
    loanId: "loan-1",
    borrowerName: "Jean Mugabo",
    borrowerInitials: "JM",
    borrowerUserId: "user-1",
    borrowerRole: "Admin",
    borrowerJoinedCycle: 1,
    borrowerReputation: 82,
    borrowerActiveLoanCount: 0,
    amount: 25000,
    interestRate: 5,
    purpose: "Home renovation materials",
    deadline: LOAN_DEADLINE,
    signatureThreshold: 3,
    collectedSignatures: 1,
    signatures: [
      {
        userId: "user-2",
        name: "Marie Uwimana",
        initials: "MU",
        role: "Treasurer",
        signed: true,
        signedAt: "2026-06-28T11:00:00Z",
      },
      { userId: "g1m-3", name: "Patrick Kabera", initials: "PK", role: "Member", signed: false },
      { userId: "g1m-4", name: "Diane Mukamana", initials: "DM", role: "Member", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
  "loan-5": {
    loanId: "loan-5",
    borrowerName: "Eric Bakunda",
    borrowerInitials: "EB",
    borrowerUserId: "g2m-5",
    borrowerRole: "Member",
    borrowerJoinedCycle: 1,
    borrowerReputation: 75,
    borrowerActiveLoanCount: 1,
    amount: 20000,
    interestRate: 5,
    purpose: "Agricultural inputs for planting season",
    deadline: LOAN_DEADLINE,
    signatureThreshold: 4,
    collectedSignatures: 2,
    signatures: [
      {
        userId: "user-2",
        name: "Marie Uwimana",
        initials: "MU",
        role: "Treasurer",
        signed: true,
        signedAt: "2026-06-27T10:00:00Z",
      },
      {
        userId: "g2m-3",
        name: "Patrick Kabera",
        initials: "PK",
        role: "Member",
        signed: true,
        signedAt: "2026-06-28T09:00:00Z",
      },
      { userId: "g2m-4", name: "Diane Mukamana", initials: "DM", role: "Member", signed: false },
      { userId: "g2m-6", name: "Alice Niyonzima", initials: "AN", role: "Member", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
  "loan-6": {
    loanId: "loan-6",
    borrowerName: "Diane Mukamana",
    borrowerInitials: "DM",
    borrowerUserId: "g1m-4",
    borrowerRole: "Member",
    borrowerJoinedCycle: 2,
    borrowerReputation: 68,
    borrowerActiveLoanCount: 0,
    amount: 15000,
    interestRate: 5,
    purpose: "Tailoring equipment purchase",
    deadline: LOAN_DEADLINE,
    signatureThreshold: 3,
    collectedSignatures: 0,
    signatures: [
      { userId: "user-1", name: "Jean Mugabo", initials: "JM", role: "Admin", signed: false },
      { userId: "user-2", name: "Marie Uwimana", initials: "MU", role: "Treasurer", signed: false },
      { userId: "g1m-3", name: "Patrick Kabera", initials: "PK", role: "Member", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
};

export function getLoanDetail(loanId: string): LoanDetail | null {
  return MOCK_LOAN_DETAILS[loanId] ?? null;
}

export function getLoanRequestReview(loanId: string): LoanRequestReview | null {
  return MOCK_LOAN_REVIEWS[loanId] ?? null;
}

export function signLoan(
  loanId: string,
  userId: string
): { success: boolean; thresholdMet: boolean } {
  const review = MOCK_LOAN_REVIEWS[loanId];
  if (!review) return { success: false, thresholdMet: false };

  const sig = review.signatures.find((s) => s.userId === userId);
  if (!sig || sig.signed) return { success: false, thresholdMet: false };

  sig.signed = true;
  sig.signedAt = new Date().toISOString();
  review.collectedSignatures += 1;
  review.currentUserAlreadySigned = true;
  review.currentUserSignedAt = sig.signedAt;

  const thresholdMet = review.collectedSignatures >= review.signatureThreshold;

  // Also update the loan detail if it exists
  const detail = MOCK_LOAN_DETAILS[loanId];
  if (detail && detail.currentState === "signing") {
    const detailSig = detail.signatures.find((s) => s.userId === userId);
    if (detailSig) {
      detailSig.signed = true;
      detailSig.signedAt = sig.signedAt;
    }
    detail.collectedSignatures += 1;
    if (thresholdMet) {
      (detail as any).currentState = "approved";
      (detail as any).approvedAt = new Date().toISOString();
    }
  }

  return { success: true, thresholdMet };
}

export function rejectLoan(loanId: string): { success: boolean } {
  const detail = MOCK_LOAN_DETAILS[loanId];
  if (detail) {
    (detail as any).currentState = "defaulted";
  }
  return { success: true };
}

// ── Group settings ─────────────────────────────────────────────────────

export const MOCK_GROUP_SETTINGS: Record<string, GroupSettings> = {
  "group-1": {
    name: "Umugongo W'Abaturage",
    isPublic: false,
    contributionAmount: 5000,
    cycleLength: 30,
    payoutAmount: 21000,
    penaltyRate: 15,
    approvalThreshold: 0.66,
    allMembersAreCommittee: false,
    committeeSize: 3,
    loansEnabled: true,
    loanInterestRate: 5,
    discretionaryFundEnabled: true,
    groupPolicy: "private",
  },
  "group-2": {
    name: "Abahuza Savings Circle",
    isPublic: true,
    contributionAmount: 10000,
    cycleLength: 14,
    payoutAmount: 42000,
    penaltyRate: 10,
    approvalThreshold: 0.5,
    allMembersAreCommittee: true,
    committeeSize: 0,
    loansEnabled: true,
    loanInterestRate: 5,
    discretionaryFundEnabled: false,
    groupPolicy: "public",
  },
};

// ── Committee members ──────────────────────────────────────────────────

export const MOCK_COMMITTEE: Record<string, CommitteeMember[]> = {
  "group-1": [
    { userId: "user-1", name: "Jean Mugabo", initials: "JM" },
    { userId: "user-2", name: "Marie Uwimana", initials: "MU" },
    { userId: "g1m-3", name: "Patrick Kabera", initials: "PK" },
  ],
  "group-2": [{ userId: "user-2", name: "Marie Uwimana", initials: "MU" }],
};

// ── User profiles ──────────────────────────────────────────────────────

export const MOCK_USER_PROFILES: Record<string, UserProfile> = {
  "user-1": {
    userId: "user-1",
    name: "Jean Mugabo",
    initials: "JM",
    reputation: 82,
    onTimeStreak: 7,
    notificationsEnabled: true,
    isCommitteeMember: true,
  },
  "user-2": {
    userId: "user-2",
    name: "Marie Uwimana",
    initials: "MU",
    reputation: 88,
    onTimeStreak: 6,
    notificationsEnabled: true,
    isCommitteeMember: true,
  },
};

// ── Settings change requests ───────────────────────────────────────────

export const MOCK_SETTINGS_CHANGE_REQUESTS: Record<string, SettingsChangeRequest[]> = {
  "group-1": [
    {
      id: "act-req-3",
      groupId: "group-1",
      field: "penalty_rate",
      fieldLabel: "Penalty rate",
      currentValue: "15%",
      proposedValue: "20%",
      requesterName: "Jean Mugabo",
      requesterInitials: "JM",
      requesterUserId: "user-1",
      signatureCount: 1,
      signatureThreshold: 2,
      signatures: [
        {
          userId: "user-1",
          name: "Jean Mugabo",
          initials: "JM",
          signed: true,
          signedAt: "2026-06-29T14:00:00Z",
        },
        {
          userId: "user-2",
          name: "Marie Uwimana",
          initials: "MU",
          signed: false,
        },
      ],
      currentUserAlreadySigned: true,
      currentUserSignedAt: "2026-06-29T14:00:00Z",
      createdAt: "2026-06-29T14:00:00Z",
    },
  ],
};

export function getSettingsChangeReview(requestId: string): SettingsChangeRequest | null {
  for (const requests of Object.values(MOCK_SETTINGS_CHANGE_REQUESTS)) {
    const found = requests.find((r) => r.id === requestId);
    if (found) return found;
  }
  return null;
}

export function signSettingsChange(
  requestId: string,
  userId: string
): { success: boolean; thresholdMet: boolean } {
  const review = getSettingsChangeReview(requestId);
  if (!review) return { success: false, thresholdMet: false };

  const sig = review.signatures.find((s) => s.userId === userId);
  if (!sig || sig.signed) return { success: false, thresholdMet: false };

  sig.signed = true;
  sig.signedAt = new Date().toISOString();
  review.signatureCount += 1;
  review.currentUserAlreadySigned = true;
  review.currentUserSignedAt = sig.signedAt;

  const thresholdMet = review.signatureCount >= review.signatureThreshold;
  return { success: true, thresholdMet };
}

export function rejectSettingsChange(requestId: string): { success: boolean } {
  for (const groupId of Object.keys(MOCK_SETTINGS_CHANGE_REQUESTS)) {
    const requests = MOCK_SETTINGS_CHANGE_REQUESTS[groupId];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx !== -1) {
      requests.splice(idx, 1);
      return { success: true };
    }
  }
  return { success: false };
}

// ── Phase 6: Discretionary fund reviews ─────────────────────────────

export const MOCK_DISCRETIONARY_REVIEWS: Record<string, DiscretionaryFundReview> = {
  "act-req-4": {
    id: "act-req-4",
    groupId: "group-1",
    requesterName: "Diane Mukamana",
    requesterInitials: "DM",
    requesterUserId: "g1m-4",
    direction: "deposit",
    amount: 5000,
    category: "Social fund",
    paidTo: "Community events vendor",
    reason:
      "We're organising a community event for Umugongo W'Abaturage members and their families. The funds will cover venue hire, refreshments, and entertainment. This will be our first social fund event and we expect 40+ attendees.",
    requestedAt: "2026-06-30T10:00:00Z",
    signatureCount: 0,
    signatureThreshold: 2,
    signatures: [
      { userId: "user-1", name: "Jean Mugabo", initials: "JM", role: "Admin", signed: false },
      { userId: "user-2", name: "Marie Uwimana", initials: "MU", role: "Treasurer", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
};

// ── Phase 6: Join request reviews ─────────────────────────────

export const MOCK_JOIN_REQUEST_REVIEWS: Record<string, JoinRequestReview> = {
  "act-req-2": {
    id: "act-req-2",
    groupId: "group-1",
    applicantName: "Kagabo D.",
    applicantInitials: "KD",
    applicantPhone: "+250788000001",
    joinMethod: "invite_code",
    inviteCode: "AB3K9F",
    requestedAt: "2026-06-29T08:00:00Z",
    signatureCount: 0,
    signatureThreshold: 2,
    signatures: [
      { userId: "user-1", name: "Jean Mugabo", initials: "JM", role: "Admin", signed: false },
      { userId: "user-2", name: "Marie Uwimana", initials: "MU", role: "Treasurer", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
};

// ── Phase 6: Member withdrawal reviews ──────────────────────────

export const MOCK_WITHDRAWAL_REVIEWS: Record<string, MemberWithdrawalReview> = {
  "act-req-5": {
    id: "act-req-5",
    groupId: "group-1",
    memberName: "Alain Kamanzi",
    memberInitials: "AK",
    memberUserId: "g1m-16",
    reasonCategory: "Repeated default",
    contributionRate: "6 of 10",
    penaltyCount: 3,
    outstandingLoanAmount: 12000,
    requestedAt: "2026-06-30T12:00:00Z",
    signatureCount: 1,
    signatureThreshold: 2,
    signatures: [
      {
        userId: "user-1",
        name: "Jean Mugabo",
        initials: "JM",
        role: "Admin",
        signed: true,
        signedAt: "2026-06-30T12:00:00Z",
      },
      { userId: "user-2", name: "Marie Uwimana", initials: "MU", role: "Treasurer", signed: false },
    ],
    currentUserAlreadySigned: false,
  },
};

// ── Phase 6: Invite data ────────────────────────────────────────

export const MOCK_INVITE_DATA: Record<string, GroupInviteData> = {
  "group-1": {
    inviteCode: "AB3K9F",
    shareLink: "https://e-kimina.app/join/AB3K9F",
    sentInvites: [
      { phone: "+250788112233", sentAt: "2026-06-28T14:00:00Z" },
      { phone: "+250788445566", sentAt: "2026-06-27T09:30:00Z" },
      { phone: "+250788778899", sentAt: "2026-06-25T16:45:00Z" },
    ],
  },
};

// ── Phase 6: handler helpers ──────────────────────────────────────

export function signReview(
  map: Record<
    string,
    {
      signatures: { userId: string; signed: boolean; signedAt?: string }[];
      signatureCount: number;
      signatureThreshold: number;
      currentUserAlreadySigned: boolean;
      currentUserSignedAt?: string;
    }
  >,
  requestId: string,
  userId: string
): { success: boolean; thresholdMet: boolean } {
  const review = map[requestId];
  if (!review) return { success: false, thresholdMet: false };

  const sig = review.signatures.find((s) => s.userId === userId);
  if (!sig || sig.signed) return { success: false, thresholdMet: false };

  sig.signed = true;
  sig.signedAt = new Date().toISOString();
  review.signatureCount += 1;
  review.currentUserAlreadySigned = true;
  review.currentUserSignedAt = sig.signedAt;

  const thresholdMet = review.signatureCount >= review.signatureThreshold;
  return { success: true, thresholdMet };
}

export function rejectReview(
  map: Record<string, unknown>,
  requestId: string
): { success: boolean } {
  if (!map[requestId]) return { success: false };
  delete map[requestId];
  return { success: true };
}
