export const dummyGroup = {
  id: "group-001",
  name: "Gasabo Farmers A",
  district: "Gasabo",
  sector: "Remera",
  contributionAmount: "0.01",
  currency: "USDm",
  cycleFrequency: "monthly",
  currentRound: 4,
  totalRounds: 6,
  roundEndDate: "2026-07-15",
  poolSoFar: "0.03",
  paidCount: 3,
  totalMembers: 6,
};

export const dummyMembers = [
  { id: "m1", name: "Uwimana Alice",   phone: "+250788100001", role: "member", reputation: 60, payoutRound: 1 },
  { id: "m2", name: "Mukamana Bob",    phone: "+250788100002", role: "member", reputation: 30, payoutRound: 2 },
  { id: "m3", name: "Habimana Claire", phone: "+250788100003", role: "member", reputation: 55, payoutRound: 3 },
  { id: "m4", name: "Niyonzima David", phone: "+250788100004", role: "member", reputation: 65, payoutRound: 4 },
  { id: "m5", name: "Uwase Eve",       phone: "+250788100005", role: "member", reputation: 50, payoutRound: 5 },
  { id: "m6", name: "Bizimana Frank",  phone: "+250788666655", role: "leader", reputation: 55, payoutRound: 6 },
];

export const dummyContributions = [
  { memberId: "m1", round: 1, amount: "0.01", paidAt: "2026-03-01", status: "paid" },
  { memberId: "m1", round: 2, amount: "0.01", paidAt: "2026-04-02", status: "paid" },
  { memberId: "m1", round: 3, amount: "0.01", paidAt: "2026-04-30", status: "paid" },
  { memberId: "m1", round: 4, amount: "0.01", paidAt: null,         status: "pending" },
  { memberId: "m2", round: 1, amount: "0.01", paidAt: "2026-03-01", status: "paid" },
  { memberId: "m2", round: 2, amount: "0.01", paidAt: "2026-04-05", status: "paid" },
  { memberId: "m2", round: 3, amount: "0.01", paidAt: "2026-05-10", status: "late" },
  { memberId: "m2", round: 4, amount: "0.01", paidAt: null,         status: "pending" },
  { memberId: "m3", round: 1, amount: "0.01", paidAt: "2026-03-01", status: "paid" },
  { memberId: "m3", round: 2, amount: "0.01", paidAt: "2026-04-01", status: "paid" },
  { memberId: "m3", round: 3, amount: "0.01", paidAt: "2026-04-30", status: "paid" },
  { memberId: "m3", round: 4, amount: "0.01", paidAt: null,         status: "pending" },
];

export const dummyRotation = [
  { round: 1, memberId: "m1", name: "Uwimana Alice",   status: "paid",    paidAt: "2026-03-15" },
  { round: 2, memberId: "m2", name: "Mukamana Bob",    status: "paid",    paidAt: "2026-04-15" },
  { round: 3, memberId: "m3", name: "Habimana Claire", status: "paid",    paidAt: "2026-05-15" },
  { round: 4, memberId: "m4", name: "Niyonzima David", status: "current", paidAt: null },
  { round: 5, memberId: "m5", name: "Uwase Eve",       status: "pending", paidAt: null },
  { round: 6, memberId: "m6", name: "Bizimana Frank",  status: "pending", paidAt: null },
];