import type { GroupSettings } from "../api/types";

export interface GroupTemplate {
  id: string;
  title: string;
  description: string;
  defaults: Partial<GroupSettings>;
}

export const GROUP_TEMPLATES: GroupTemplate[] = [
  {
    id: "student",
    title: "Student group",
    description: "One lump payout at the end, no loans",
    defaults: {
      contributionAmount: 5000,
      cycleLength: 30,
      payoutAmount: 100000,
      penaltyRate: 5,
      approvalThreshold: 0.5,
      allMembersAreCommittee: false,
      committeeSize: 3,
      loansEnabled: false,
      loanInterestRate: 0,
      discretionaryFundEnabled: false,
    },
  },
  {
    id: "vacation",
    title: "Vacation pool",
    description: "No scheduled payout, equal split on the date",
    defaults: {
      contributionAmount: 10000,
      cycleLength: 14,
      payoutAmount: 0,
      penaltyRate: 0,
      approvalThreshold: 0.5,
      allMembersAreCommittee: true,
      committeeSize: 0,
      loansEnabled: false,
      loanInterestRate: 0,
      discretionaryFundEnabled: false,
    },
  },
  {
    id: "farmers",
    title: "Farmers VSLA",
    description: "Rotating payout, loans on, optional discretionary fund",
    defaults: {
      contributionAmount: 2000,
      cycleLength: 7,
      payoutAmount: 20000,
      penaltyRate: 10,
      approvalThreshold: 0.66,
      allMembersAreCommittee: false,
      committeeSize: 5,
      loansEnabled: true,
      loanInterestRate: 10,
      discretionaryFundEnabled: true,
    },
  },
  {
    id: "employee",
    title: "Employee group",
    description: "Small or no scheduled payout, loans and discretionary fund on",
    defaults: {
      contributionAmount: 20000,
      cycleLength: 30,
      payoutAmount: 10000,
      penaltyRate: 5,
      approvalThreshold: 0.5,
      allMembersAreCommittee: false,
      committeeSize: 3,
      loansEnabled: true,
      loanInterestRate: 5,
      discretionaryFundEnabled: true,
    },
  },
  {
    id: "scratch",
    title: "Start from scratch",
    description: "Set every field yourself",
    defaults: {},
  },
];
