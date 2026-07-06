// Mock member data for the USSD flow.
// In production this would come from the indexer + backend store.

export interface USSDMember {
  id: string;
  name: string;
  phone: string;
  role: "leader" | "member";
  reputation: number;
  payoutRound: number;
}

export interface USSDContribution {
  memberId: string;
  round: number;
  amount: string;
  status: "paid" | "pending" | "late";
  paidAt: string | null;
}

export interface USSDGroup {
  name: string;
  currentRound: number;
  totalMembers: number;
  paidCount: number;
  poolSoFar: string;
  contribution: string;
  frequency: string;
}

export interface USSDRotation {
  round: number;
  name: string;
  status: "paid" | "current" | "pending";
}

export const members: USSDMember[] = [
  {
    id: "m1",
    name: "Mukamana Alice",
    phone: "+250788111222",
    role: "leader",
    reputation: 85,
    payoutRound: 3,
  },
  {
    id: "m2",
    name: "Niyonzima David",
    phone: "+250788333444",
    role: "member",
    reputation: 70,
    payoutRound: 4,
  },
  {
    id: "m3",
    name: "Uwase Eve",
    phone: "+250788555666",
    role: "member",
    reputation: 60,
    payoutRound: 5,
  },
  {
    id: "m4",
    name: "Habarurema Jean",
    phone: "+250788777888",
    role: "member",
    reputation: 75,
    payoutRound: 1,
  },
  {
    id: "m5",
    name: "Mukamana Bob",
    phone: "+250788999000",
    role: "member",
    reputation: 45,
    payoutRound: 2,
  },
  {
    id: "m6",
    name: "Uwimana Grace",
    phone: "+250788000111",
    role: "member",
    reputation: 90,
    payoutRound: 6,
  },
];

export const contributions: USSDContribution[] = [
  { memberId: "m1", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-15" },
  { memberId: "m1", round: 2, amount: "0.01", status: "paid", paidAt: "2026-02-15" },
  { memberId: "m1", round: 3, amount: "0.01", status: "paid", paidAt: "2026-03-15" },
  { memberId: "m2", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-16" },
  { memberId: "m2", round: 2, amount: "0.01", status: "paid", paidAt: "2026-02-14" },
  { memberId: "m2", round: 3, amount: "0.01", status: "paid", paidAt: "2026-03-16" },
  { memberId: "m3", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-17" },
  { memberId: "m3", round: 2, amount: "0.01", status: "pending", paidAt: null },
  { memberId: "m3", round: 3, amount: "0.01", status: "late", paidAt: null },
  { memberId: "m4", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-14" },
  { memberId: "m4", round: 2, amount: "0.01", status: "paid", paidAt: "2026-02-15" },
  { memberId: "m4", round: 3, amount: "0.01", status: "paid", paidAt: "2026-03-15" },
  { memberId: "m5", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-18" },
  { memberId: "m5", round: 2, amount: "0.01", status: "paid", paidAt: "2026-02-16" },
  { memberId: "m5", round: 3, amount: "0.01", status: "late", paidAt: null },
  { memberId: "m6", round: 1, amount: "0.01", status: "paid", paidAt: "2026-01-13" },
  { memberId: "m6", round: 2, amount: "0.01", status: "paid", paidAt: "2026-02-13" },
  { memberId: "m6", round: 3, amount: "0.01", status: "paid", paidAt: "2026-03-13" },
];

export const group: USSDGroup = {
  name: "Gasabo Farmers A",
  currentRound: 4,
  totalMembers: 6,
  paidCount: 4,
  poolSoFar: "0.06",
  contribution: "0.01",
  frequency: "Monthly",
};

export const rotation: USSDRotation[] = [
  { round: 1, name: "Habarurema Jean", status: "paid" },
  { round: 2, name: "Mukamana Bob", status: "paid" },
  { round: 3, name: "Mukamana Alice", status: "paid" },
  { round: 4, name: "Niyonzima David", status: "current" },
  { round: 5, name: "Uwase Eve", status: "pending" },
  { round: 6, name: "Uwimana Grace", status: "pending" },
];
