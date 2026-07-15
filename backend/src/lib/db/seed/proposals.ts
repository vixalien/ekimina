import type { Address } from "@ekimina/types";

import type { SeedGroup } from "./groups.js";

import { ikiminaABI } from "@ekimina/contracts";
import { parseEventLogs } from "viem";

import { publicClient } from "../../chain.js";
// oxlint-disable-next-line no-restricted-imports
import { db } from "../index.js";
// oxlint-disable-next-line no-restricted-imports
import { proposalTexts } from "../schema.js";

import { getIkimina, makeWallet } from "./helpers.js";

export async function createLoanProposal(
  g: SeedGroup,
  groupAddr: Address,
  proposerIdx: number,
  borrowerIdx: number,
  amount: bigint,
  interestBps: number,
  dueCycleDelta: number,
): Promise<string | null> {
  const proposer = g.memberAddresses[proposerIdx];
  const borrower = g.memberAddresses[borrowerIdx];
  const wallet = makeWallet(proposer);
  const ikimina = getIkimina(groupAddr, wallet);

  const curCycle = await getIkimina(groupAddr).read.currentCycle();

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.proposeLoan([
    borrower,
    amount,
    interestBps,
    curCycle + BigInt(dueCycleDelta),
  ]);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  return proposalId ? String(proposalId) : null;
}

export async function createDiscretionaryProposal(
  g: SeedGroup,
  groupAddr: Address,
  proposerIdx: number,
  recipientIdx: number,
  amount: bigint,
): Promise<string | null> {
  const proposer = g.memberAddresses[proposerIdx];
  const recipient = g.memberAddresses[recipientIdx];
  const wallet = makeWallet(proposer);
  const ikimina = getIkimina(groupAddr, wallet);

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.proposeDiscretionary([recipient, amount]);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  return proposalId ? String(proposalId) : null;
}

export async function createSettingsProposal(
  g: SeedGroup,
  groupAddr: Address,
  proposerIdx: number,
  newPenaltyRateBps: number,
): Promise<string | null> {
  const proposer = g.memberAddresses[proposerIdx];
  const wallet = makeWallet(proposer);
  const ikimina = getIkimina(groupAddr, wallet);

  const reader = getIkimina(groupAddr);
  const config = await reader.read.config();

  const newConfig = [
    config[0],
    config[1],
    config[2],
    config[3],
    BigInt(newPenaltyRateBps),
    config[5],
    config[6],
    config[7],
    config[8],
  ];

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.proposeSettings([newConfig]);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  return proposalId ? String(proposalId) : null;
}

export async function createMemberExitProposal(
  g: SeedGroup,
  groupAddr: Address,
  proposerIdx: number,
  memberIdx: number,
  settlement: bigint,
): Promise<string | null> {
  const proposer = g.memberAddresses[proposerIdx];
  const memberToExit = g.memberAddresses[memberIdx];
  const wallet = makeWallet(proposer);
  const ikimina = getIkimina(groupAddr, wallet);

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.proposeMemberExit([memberToExit, settlement]);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  return proposalId ? String(proposalId) : null;
}

export async function createDissolveProposal(
  g: SeedGroup,
  groupAddr: Address,
  proposerIdx: number,
): Promise<string | null> {
  const proposer = g.memberAddresses[proposerIdx];
  const wallet = makeWallet(proposer);
  const ikimina = getIkimina(groupAddr, wallet);

  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.proposeDissolve();

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const logs = parseEventLogs({
    abi: ikiminaABI,
    logs: receipt.logs,
    eventName: "ProposalCreated",
  });
  const proposalId = logs[0]?.args.id;
  return proposalId ? String(proposalId) : null;
}

export async function approveProposal(
  groupAddr: Address,
  approverAddr: string,
  proposalId: string,
) {
  const wallet = makeWallet(approverAddr);
  const ikimina = getIkimina(groupAddr, wallet);
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.approveProposal([proposalId]);
  await publicClient.waitForTransactionReceipt({ hash });
}

export async function rejectProposal(groupAddr: Address, rejecterAddr: string, proposalId: string) {
  const wallet = makeWallet(rejecterAddr);
  const ikimina = getIkimina(groupAddr, wallet);
  // oxlint-disable-next-line typescript/no-explicit-any
  const hash = await (ikimina as any).write.rejectProposal([proposalId]);
  await publicClient.waitForTransactionReceipt({ hash });
}

export async function seedProposalText(
  proposalId: string,
  groupAddress: string,
  purpose: string,
  category: string | null,
  reason: string | null,
  reasonCategory: string | null,
) {
  try {
    await db
      .insert(proposalTexts)
      .values({
        proposalId: `${groupAddress}:${proposalId}`,
        purpose,
        category,
        reason,
        reasonCategory,
      })
      .onConflictDoNothing({ target: proposalTexts.proposalId });
  } catch {
    console.warn(`    Failed to seed proposal text for proposal ${proposalId}`);
  }
}
