import type { Address, Transaction, TransactionDirection, TransactionType } from "@ekimina/types";

import { parseAbiItem } from "viem";

import { publicClient } from "./chain.js";
import { nameOf } from "./name-resolver.js";

const contributionEvent = parseAbiItem(
  "event ContributionMade(address indexed member, uint256 indexed cycle, uint256 amount)",
);
const payoutEvent = parseAbiItem(
  "event PayoutReleased(address indexed recipient, uint256 indexed cycle, uint256 amount)",
);
const penaltyEvent = parseAbiItem(
  "event PenaltyApplied(address indexed member, uint256 indexed cycle, uint256 amount)",
);
const loanDisbursedEvent = parseAbiItem(
  "event LoanDisbursed(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 proposalId)",
);
const loanRepaidEvent = parseAbiItem(
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount)",
);
const discDisbursedEvent = parseAbiItem(
  "event DiscretionaryDisbursed(address indexed recipient, uint256 amount, uint256 proposalId)",
);
const memberJoinedEvent = parseAbiItem("event MemberJoined(address indexed member, uint256 cycle)");
const memberExitedEvent = parseAbiItem(
  "event MemberExited(address indexed member, uint256 settlement, uint256 proposalId)",
);

interface RawEvent {
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: string;
}

async function fetchEvents(groupAddr: Address): Promise<RawEvent[]> {
  const fromBlock = 0n;

  async function getLogs(event: ReturnType<typeof parseAbiItem>) {
    try {
      // oxlint-disable-next-line typescript/no-explicit-any
      const logs = await (publicClient as any).getLogs({
        address: groupAddr,
        event,
        fromBlock,
        toBlock: "latest",
      });
      // oxlint-disable-next-line typescript/no-explicit-any
      return logs.map((l: any) => ({
        // oxlint-disable-next-line typescript/no-explicit-any
        eventName: (event as any).name,
        args: l.args as Record<string, unknown>,
        blockNumber: l.blockNumber,
        logIndex: l.logIndex ?? 0,
        transactionHash: l.transactionHash,
      }));
    } catch {
      return [];
    }
  }

  const results = await Promise.all([
    getLogs(contributionEvent),
    getLogs(payoutEvent),
    getLogs(penaltyEvent),
    getLogs(loanDisbursedEvent),
    getLogs(loanRepaidEvent),
    getLogs(discDisbursedEvent),
    getLogs(memberJoinedEvent),
    getLogs(memberExitedEvent),
  ]);

  return results.flat();
}

function toTxType(eventName: string): TransactionType {
  switch (eventName) {
    case "ContributionMade":
      return "contribution";
    case "PayoutReleased":
      return "payout";
    case "PenaltyApplied":
      return "penalty";
    case "LoanDisbursed":
      return "loan_disbursement";
    case "LoanRepaid":
      return "loan_repayment";
    case "DiscretionaryDisbursed":
      return "discretionary_withdrawal";
    default:
      return "contribution";
  }
}

function toDirection(eventName: string): TransactionDirection {
  switch (eventName) {
    case "ContributionMade":
    case "PenaltyApplied":
    case "LoanRepaid":
      return "outflow";
    case "PayoutReleased":
    case "LoanDisbursed":
    case "DiscretionaryDisbursed":
      return "inflow";
    default:
      return "neutral";
  }
}

function getMemberId(eventName: string, args: Record<string, unknown>): string {
  if (
    eventName === "ContributionMade" ||
    eventName === "PenaltyApplied" ||
    eventName === "MemberJoined" ||
    eventName === "MemberExited"
  ) {
    return args.member as string;
  }
  if (eventName === "PayoutReleased") {
    return args.recipient as string;
  }
  if (eventName === "LoanDisbursed" || eventName === "LoanRepaid") {
    return args.borrower as string;
  }
  if (eventName === "DiscretionaryDisbursed") {
    return args.recipient as string;
  }
  return "";
}

function getAmount(eventName: string, args: Record<string, unknown>): number {
  const raw = args.amount ?? args.settlement ?? 0n;
  return Number(raw) / 1e18;
}

function getCycle(eventName: string, args: Record<string, unknown>): number {
  const raw = args.cycle;
  return raw ? Number(raw) : 0;
}

function buildTx(e: RawEvent): Transaction {
  const memberId = getMemberId(e.eventName, e.args);
  const n = nameOf(memberId);
  const id = `${e.transactionHash}:${e.logIndex}`;

  return {
    id,
    type: toTxType(e.eventName),
    memberName: n.name,
    memberInitials: n.initials,
    memberId,
    amount: getAmount(e.eventName, e.args),
    direction: toDirection(e.eventName),
    status: "confirmed" as const,
    cycle: getCycle(e.eventName, e.args),
    timestamp: new Date(Number(e.blockNumber) * 1000).toISOString(),
  };
}

export async function getTransactions(groupAddr: Address): Promise<Transaction[]> {
  const events = await fetchEvents(groupAddr);
  return events
    .map(buildTx)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function buildDetail(e: RawEvent) {
  const base = buildTx(e);
  const memberId = getMemberId(e.eventName, e.args);
  const n = nameOf(memberId);

  switch (e.eventName) {
    case "ContributionMade":
      return {
        ...base,
        fromName: n.name,
        method: "Mobile Money",
        referenceId: `MM${base.cycle}.${String(e.blockNumber).slice(-4)}`,
      };
    case "PayoutReleased":
      return {
        ...base,
        toName: n.name,
        source: "Group reserve",
        method: "Mobile Money",
      };
    case "PenaltyApplied":
      return {
        ...base,
        reason: "Missed contribution",
        appliedBy: "System (automatic)",
      };
    case "LoanDisbursed":
      return {
        ...base,
        toName: n.name,
        method: "Mobile Money",
      };
    case "LoanRepaid":
      return {
        ...base,
        installmentNumber: 1,
        totalInstallments: 1,
        method: "Mobile Money",
        linkedLoanId: String(e.args.loanId ?? ""),
      };
    case "DiscretionaryDisbursed":
      return {
        ...base,
        category: "operations",
        counterparty: n.name,
        reason: "Group expense",
        approvedBy: "Committee",
      };
    default:
      return base;
  }
}

export async function getTransactionDetail(groupAddr: Address, id: string) {
  const [txHash, logIdxStr] = id.split(":");
  const logIdx = Number(logIdxStr);

  const events = await fetchEvents(groupAddr);
  const match = events.find((e) => e.transactionHash === txHash && e.logIndex === logIdx);
  return match ? buildDetail(match) : null;
}
