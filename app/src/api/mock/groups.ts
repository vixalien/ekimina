import type { Group, GroupMembership, PublicGroup, JoinRequest, GroupDashboardData, MemberStanding } from "../types";
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
function buildRoster(
  groupId: string,
  count: number,
  extras: { userId: string; name: string }[],
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
    currentCyclePayments: {
      "user-1": "paid", // Jean Mugabo
      "user-2": "paid", // Marie Uwimana
      "g1m-3": "paid",
      "g1m-4": "paid",
      "g1m-5": "paid",
      "g1m-6": "paid",
      "g1m-7": "paid",
      "g1m-8": "paid",
      "g1m-9": "pending_late",
      "g1m-10": "paid",
      "g1m-11": "paid",
      "g1m-12": "paid",
      "g1m-13": "pending_late",
      "g1m-14": "paid",
      "g1m-15": "paid",
      "g1m-16": "missed_penalised",
      "g1m-17": "paid",
      "g1m-18": "no_status",
      "g1m-19": "paid",
      "g1m-20": "paid",
      "g1m-21": "paid",
      "g1m-22": "pending_late",
      "g1m-23": "paid",
      "g1m-24": "paid",
      "g1m-25": "paid",
      "g1m-26": "paid",
      "g1m-27": "paid",
      "g1m-28": "paid",
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
