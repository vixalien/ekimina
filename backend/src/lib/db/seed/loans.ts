import type { Address } from "@ekimina/types";

import type { SeedGroup } from "./groups.js";

import { getContract } from "viem";

import { publicClient } from "../../chain.js";

import { getIkimina, makeWallet } from "./helpers.js";

export async function seedLoanApprovals(
  groupAddr: Address,
  g: SeedGroup,
  proposalId: string,
  approverIndices: number[],
) {
  for (const idx of approverIndices) {
    const addr = g.memberAddresses[idx];
    try {
      const wallet = makeWallet(addr);
      const ikimina = getIkimina(groupAddr, wallet);
      // oxlint-disable-next-line typescript/no-explicit-any
      const hash = await (ikimina as any).write.approveProposal([proposalId]);
      await publicClient.waitForTransactionReceipt({ hash });
    } catch {
      console.warn(`    ${addr.slice(0, 6)} approveProposal failed`);
    }
  }
}

export async function seedLoanRejection(
  groupAddr: Address,
  g: SeedGroup,
  proposalId: string,
  rejecterIdx: number,
) {
  const addr = g.memberAddresses[rejecterIdx];
  try {
    const wallet = makeWallet(addr);
    const ikimina = getIkimina(groupAddr, wallet);
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (ikimina as any).write.rejectProposal([proposalId]);
    await publicClient.waitForTransactionReceipt({ hash });
  } catch {
    console.warn(`    ${addr.slice(0, 6)} rejectProposal failed`);
  }
}

export async function seedLoanRepayment(
  groupAddr: Address,
  g: SeedGroup,
  loanId: string,
  borrowerIdx: number,
) {
  const addr = g.memberAddresses[borrowerIdx];
  try {
    const wallet = makeWallet(addr);
    const userToken = getContract({
      address: await getIkimina(groupAddr).read.token(),
      abi: [
        {
          type: "function",
          name: "approve",
          inputs: [{ type: "address" }, { type: "uint256" }],
          outputs: [{ type: "bool" }],
          stateMutability: "nonpayable",
        },
      ],
      client: { public: publicClient, wallet },
    });

    const loan = await getIkimina(groupAddr).read.getLoan([BigInt(loanId)]);
    const remaining = loan.totalOwed - loan.amountPaid;

    // oxlint-disable-next-line typescript/no-explicit-any
    await (userToken as any).write.approve([groupAddr, remaining]);

    const ikimina = getIkimina(groupAddr, wallet);
    // oxlint-disable-next-line typescript/no-explicit-any
    const hash = await (ikimina as any).write.repayLoan([loanId]);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`    Loan ${loanId} repaid by ${addr.slice(0, 6)}`);
  } catch (e) {
    console.warn(`    Loan ${loanId} repayment failed — ${(e as Error).message.slice(0, 60)}`);
  }
}
